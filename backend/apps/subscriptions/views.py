from rest_framework import generics
from rest_framework.permissions import AllowAny, IsAuthenticated

from .models import ArcplusTrialSignup
from .serializers import TrialSignupSerializer
from apps.notifications.service import send_trial_signup_notification


class TrialSignupCreateView(generics.CreateAPIView):
    serializer_class = TrialSignupSerializer
    permission_classes = [AllowAny]

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
