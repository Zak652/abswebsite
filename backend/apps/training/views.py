import hmac
import uuid

import requests
from django.conf import settings
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import TrainingSession, TrainingRegistration
from .serializers import (
    TrainingSessionSerializer,
    TrainingRegistrationSerializer,
    TrainingRegistrationCreateSerializer,
)
from apps.notifications.service import send_training_confirmation


class TrainingSessionListView(generics.ListAPIView):
    serializer_class = TrainingSessionSerializer
    permission_classes = [AllowAny]
    queryset = TrainingSession.objects.filter(is_active=True)


class TrainingRegistrationCreateView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = TrainingRegistrationCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        session = serializer.validated_data["session"]
        team_size = serializer.validated_data.get("team_size", 1)
        amount = float(session.price_usd) * team_size
        tx_ref = f"ABS-TRAIN-{uuid.uuid4().hex[:12].upper()}"

        user = request.user if request.user.is_authenticated else None
        registration = serializer.save(
            user=user,
            flutterwave_tx_ref=tx_ref,
            currency="USD",
        )

        # Call Flutterwave to get hosted payment link
        payment_link = None
        if settings.FLUTTERWAVE_SECRET_KEY:
            try:
                fw_response = requests.post(
                    "https://api.flutterwave.com/v3/payments",
                    json={
                        "tx_ref": tx_ref,
                        "amount": amount,
                        "currency": "USD",
                        "redirect_url": f"{settings.FRONTEND_URL}/training/payment-confirm",
                        "customer": {
                            "email": registration.email,
                            "name": registration.full_name,
                            "phonenumber": registration.phone or "",
                        },
                        "customizations": {
                            "title": "ABS Training Registration",
                            "description": session.title,
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
            except Exception:
                pass

        return Response(
            {"id": str(registration.id), "payment_link": payment_link},
            status=status.HTTP_201_CREATED,
        )


class FlutterwaveWebhookView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        # Verify HMAC signature
        secret_hash = settings.FLUTTERWAVE_WEBHOOK_SECRET
        signature = request.META.get("HTTP_VERIF_HASH", "")
        if secret_hash and not hmac.compare_digest(signature, secret_hash):
            return Response(status=status.HTTP_401_UNAUTHORIZED)

        data = request.data
        event_data = data.get("data", {})

        if (
            data.get("event") == "charge.completed"
            and event_data.get("status") == "successful"
        ):
            tx_ref = event_data.get("tx_ref", "")
            tx_id = event_data.get("id", "")

            # Double-verify with Flutterwave
            try:
                verify_resp = requests.get(
                    f"https://api.flutterwave.com/v3/transactions/{tx_id}/verify",
                    headers={
                        "Authorization": f"Bearer {settings.FLUTTERWAVE_SECRET_KEY}"
                    },
                    timeout=10,
                )
                verify_data = verify_resp.json()
                if verify_data.get("data", {}).get("status") == "successful":
                    try:
                        reg = TrainingRegistration.objects.get(
                            flutterwave_tx_ref=tx_ref
                        )
                        if reg.status != "paid":
                            reg.status = "paid"
                            reg.flutterwave_tx_id = str(tx_id)
                            reg.amount_paid = event_data.get("amount")
                            reg.save()
                            try:
                                send_training_confirmation(reg)
                            except Exception:
                                pass
                    except TrainingRegistration.DoesNotExist:
                        pass
            except Exception:
                pass

        return Response({"status": "ok"})


class TrainingRegistrationListView(generics.ListAPIView):
    serializer_class = TrainingRegistrationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return TrainingRegistration.objects.filter(
            user=self.request.user
        ).select_related("session")
