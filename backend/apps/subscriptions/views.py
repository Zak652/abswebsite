import logging

from django.db import transaction
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from .models import ArcplusTrialSignup
from .serializers import TrialSignupSerializer
from apps.accounts.permissions import (
    AnonymousOrEmailVerified,
    IsEmailVerified,
)
from apps.notifications.service import (
    send_trial_cancellation_notification,
    send_trial_signup_notification,
)


logger = logging.getLogger(__name__)


class TrialSignupCreateView(generics.CreateAPIView):
    """Public-friendly trial signup form for the Arcplus marketing surface.

    Anonymous submissions stay allowed (the marketing-site flow is the
    dominant traffic pattern). Authenticated requests must come from a
    user whose email is verified so an impersonator sitting on an
    unverified account can't trigger trial provisioning under the
    victim's identity (see ``AnonymousOrEmailVerified`` for the threat
    model).
    """

    serializer_class = TrialSignupSerializer
    permission_classes = [AnonymousOrEmailVerified]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "trial_signup"

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        instance = serializer.save(user=user)
        try:
            send_trial_signup_notification(instance)
        except Exception:
            pass


class TrialSignupListView(generics.ListAPIView):
    serializer_class = TrialSignupSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ArcplusTrialSignup.objects.filter(user=self.request.user)


class TrialSignupCancelView(APIView):
    """User-initiated trial cancellation.

    Owner-only — non-owners get a 404 (not 403) so we don't leak existence
    of trials they shouldn't see. Already-cancelled or otherwise terminal
    signups return 409 so the UI can surface a clear "already finished"
    message instead of pretending the request worked.

    Cancellation is a billable-obligation action (it stops a trial that
    may have been provisioned), so the verified-email gate kicks in
    here too — same threat model as ``TrialSignupCreateView``.
    """

    permission_classes = [IsAuthenticated, IsEmailVerified]

    def post(self, request, pk):
        try:
            with transaction.atomic():
                signup = (
                    ArcplusTrialSignup.objects
                    .select_for_update()
                    .get(pk=pk, user=request.user)
                )
                if signup.status == "cancelled":
                    return Response(
                        {
                            "detail": "Trial is already cancelled.",
                            "status": signup.status,
                        },
                        status=status.HTTP_409_CONFLICT,
                    )
                if signup.status in ArcplusTrialSignup.TERMINAL_STATUSES:
                    return Response(
                        {
                            "detail": (
                                "Trial is in a terminal state and cannot be "
                                "cancelled."
                            ),
                            "status": signup.status,
                        },
                        status=status.HTTP_409_CONFLICT,
                    )

                signup.status = "cancelled"
                signup.cancelled_at = timezone.now()
                reason = (request.data or {}).get("reason", "")
                if isinstance(reason, str):
                    signup.cancellation_reason = reason[:255]
                signup.save(
                    update_fields=[
                        "status",
                        "cancelled_at",
                        "cancellation_reason",
                        "updated_at",
                    ],
                )
                # Send the email post-commit so a rolled-back transaction
                # doesn't notify the user about a state that didn't persist.
                transaction.on_commit(
                    lambda: _safe_send_cancellation_email(signup.id),
                )
        except ArcplusTrialSignup.DoesNotExist:
            return Response(
                {"detail": "Not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(
            TrialSignupSerializer(signup).data,
            status=status.HTTP_200_OK,
        )


def _safe_send_cancellation_email(signup_id):
    try:
        signup = ArcplusTrialSignup.objects.get(pk=signup_id)
        send_trial_cancellation_notification(signup)
    except Exception as exc:  # pragma: no cover — best-effort email
        logger.warning(
            "send_trial_cancellation_notification failed for %s: %s",
            signup_id,
            exc,
        )
