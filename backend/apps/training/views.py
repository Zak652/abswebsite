import hashlib
import hmac
import logging
import uuid
from datetime import datetime, timezone
from decimal import Decimal

import requests
from django.conf import settings
from django.core.cache import cache
from django.db import transaction
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from .models import TrainingSession, TrainingRegistration
from .serializers import (
    TrainingSessionSerializer,
    TrainingRegistrationSerializer,
    TrainingRegistrationCreateSerializer,
)
from apps.notifications.service import send_training_confirmation


logger = logging.getLogger(__name__)


REPLAY_TTL_SECONDS = 24 * 3600  # how long we remember webhook event ids
REPLAY_MAX_SKEW_SECONDS = 5 * 60  # reject webhook payloads older than this


class TrainingSessionListView(generics.ListAPIView):
    serializer_class = TrainingSessionSerializer
    permission_classes = [AllowAny]
    queryset = TrainingSession.objects.filter(is_active=True)


class TrainingRegistrationCreateView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "training_register"

    def post(self, request):
        serializer = TrainingRegistrationCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        session_obj = serializer.validated_data["session"]
        team_size = serializer.validated_data.get("team_size", 1)
        tx_ref = f"ABS-TRAIN-{uuid.uuid4().hex[:12].upper()}"
        user = request.user if request.user.is_authenticated else None

        # Atomic capacity enforcement — re-read the session under a row lock
        # and reject if the requested team_size would exceed remaining seats.
        with transaction.atomic():
            session_locked = (
                TrainingSession.objects.select_for_update()
                .get(pk=session_obj.pk)
            )
            booked_count = sum(
                session_locked.registrations.filter(
                    status__in=("paid", "pending_payment")
                ).values_list("team_size", flat=True)
            )
            if booked_count + team_size > session_locked.capacity:
                return Response(
                    {"detail": "Insufficient seats remaining for this session."},
                    status=status.HTTP_409_CONFLICT,
                )

            expected_amount = (
                Decimal(session_locked.price_usd) * Decimal(team_size)
            ).quantize(Decimal("0.01"))

            registration = serializer.save(
                user=user,
                flutterwave_tx_ref=tx_ref,
                currency="USD",
                expected_amount=expected_amount,
            )

        # Call Flutterwave for the hosted-checkout link (outside the transaction
        # — we don't hold a row lock across an external HTTP call).
        payment_link = None
        if settings.FLUTTERWAVE_SECRET_KEY:
            try:
                fw_response = requests.post(
                    "https://api.flutterwave.com/v3/payments",
                    json={
                        "tx_ref": tx_ref,
                        "amount": float(expected_amount),
                        "currency": "USD",
                        "redirect_url": f"{settings.FRONTEND_URL}/training/payment-confirm",
                        "customer": {
                            "email": registration.email,
                            "name": registration.full_name,
                            "phonenumber": registration.phone or "",
                        },
                        "customizations": {
                            "title": "ABS Training Registration",
                            "description": session_obj.title,
                        },
                    },
                    headers={
                        "Authorization": f"Bearer {settings.FLUTTERWAVE_SECRET_KEY}"
                    },
                    timeout=10,
                )
                fw_data = fw_response.json()
                if fw_data.get("status") == "success":
                    payment_link = fw_data["data"]["link"]
            except requests.RequestException as exc:
                logger.warning("Flutterwave payment init failed for %s: %s", tx_ref, exc)

        return Response(
            {"id": str(registration.id), "payment_link": payment_link},
            status=status.HTTP_201_CREATED,
        )


def _verify_flutterwave_signature(secret: str, header: str, body: bytes) -> bool:
    """HMAC-SHA256 of the raw request body using the webhook secret. Compare in
    constant time. Returns False on any error so callers fail closed."""
    if not secret or not header:
        return False
    try:
        expected = hmac.new(secret.encode("utf-8"), body, hashlib.sha256).hexdigest()
    except (TypeError, ValueError):
        return False
    return hmac.compare_digest(expected, header)


def _is_replay(event_id: str, event_time: str | None) -> tuple[bool, str | None]:
    """Cache-backed replay check. Returns (is_replay, reject_reason)."""
    if event_time:
        try:
            ts = datetime.fromisoformat(event_time.replace("Z", "+00:00"))
            now = datetime.now(tz=timezone.utc)
            if (now - ts).total_seconds() > REPLAY_MAX_SKEW_SECONDS:
                return True, "stale_event"
        except (ValueError, TypeError):
            # No / malformed timestamp — fall through to id-based check.
            pass

    if not event_id:
        return False, None
    cache_key = f"flutterwave:webhook:{event_id}"
    if cache.get(cache_key):
        return True, "duplicate_event"
    cache.set(cache_key, "seen", timeout=REPLAY_TTL_SECONDS)
    return False, None


class FlutterwaveWebhookView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "webhook"

    def post(self, request):
        secret = settings.FLUTTERWAVE_WEBHOOK_SECRET
        signature = request.META.get("HTTP_VERIF_HASH", "")
        # Compute HMAC over raw bytes — request.body, NOT request.data.
        if not _verify_flutterwave_signature(secret, signature, request.body):
            logger.warning("Flutterwave webhook signature rejected.")
            return Response(status=status.HTTP_401_UNAUTHORIZED)

        data = request.data
        event_data = data.get("data", {}) or {}
        event_id = str(event_data.get("id") or data.get("id") or "")
        event_time = (
            event_data.get("created_at") or data.get("event.timestamp") or None
        )

        is_replay, reason = _is_replay(event_id, event_time)
        if is_replay:
            logger.info("Flutterwave webhook ignored: %s (id=%s)", reason, event_id)
            return Response({"status": "ignored", "reason": reason})

        if not (
            data.get("event") == "charge.completed"
            and event_data.get("status") == "successful"
        ):
            return Response({"status": "ok"})

        tx_ref = event_data.get("tx_ref", "")
        tx_id = event_data.get("id", "")

        # Double-verify with Flutterwave that the transaction is real and
        # successful. This protects against a leaked secret being used to
        # forge events for transactions that didn't actually happen.
        try:
            verify_resp = requests.get(
                f"https://api.flutterwave.com/v3/transactions/{tx_id}/verify",
                headers={"Authorization": f"Bearer {settings.FLUTTERWAVE_SECRET_KEY}"},
                timeout=10,
            )
            verify_data = verify_resp.json()
        except requests.RequestException as exc:
            logger.error("Flutterwave verify call failed for %s: %s", tx_ref, exc)
            return Response(status=status.HTTP_502_BAD_GATEWAY)

        verify_payload = verify_data.get("data") or {}
        if verify_payload.get("status") != "successful":
            logger.warning("Flutterwave verify did not return success for %s.", tx_ref)
            return Response({"status": "ignored", "reason": "verify_not_successful"})

        verified_amount = verify_payload.get("amount")

        # Atomic update so two concurrent deliveries can't both flip status.
        try:
            with transaction.atomic():
                reg = (
                    TrainingRegistration.objects.select_for_update()
                    .get(flutterwave_tx_ref=tx_ref)
                )
                if reg.status == "paid":
                    return Response({"status": "ok", "already": "paid"})

                # Server-side amount check — verified_amount comes from the
                # Flutterwave verify call (server-to-server), and we compare
                # it to the immutable expected_amount snapshot persisted at
                # registration creation.
                if reg.expected_amount is not None and verified_amount is not None:
                    try:
                        if Decimal(str(verified_amount)) != Decimal(reg.expected_amount):
                            logger.error(
                                "Flutterwave amount mismatch for %s: expected %s got %s",
                                tx_ref,
                                reg.expected_amount,
                                verified_amount,
                            )
                            return Response(
                                {"status": "rejected", "reason": "amount_mismatch"},
                                status=status.HTTP_409_CONFLICT,
                            )
                    except (ValueError, TypeError):
                        logger.error("Could not parse amount for %s", tx_ref)
                        return Response(
                            {"status": "rejected", "reason": "amount_unparseable"},
                            status=status.HTTP_400_BAD_REQUEST,
                        )

                reg.status = "paid"
                reg.flutterwave_tx_id = str(tx_id)
                reg.amount_paid = Decimal(str(verified_amount)) if verified_amount else reg.expected_amount
                reg.save(update_fields=["status", "flutterwave_tx_id", "amount_paid", "updated_at"])

                transaction.on_commit(lambda: _safe_send_confirmation(reg.id))
        except TrainingRegistration.DoesNotExist:
            logger.warning("Flutterwave webhook for unknown tx_ref %s", tx_ref)
            return Response({"status": "ignored", "reason": "unknown_tx_ref"})

        return Response({"status": "ok"})


def _safe_send_confirmation(registration_id):
    try:
        reg = TrainingRegistration.objects.get(pk=registration_id)
        send_training_confirmation(reg)
    except Exception as exc:  # pragma: no cover — best-effort email
        logger.warning("send_training_confirmation failed for %s: %s", registration_id, exc)


class TrainingRegistrationListView(generics.ListAPIView):
    serializer_class = TrainingRegistrationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return TrainingRegistration.objects.filter(
            user=self.request.user
        ).select_related("session")
