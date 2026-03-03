from rest_framework import generics
from rest_framework.permissions import AllowAny, IsAuthenticated

from .models import RFQSubmission
from .serializers import RFQSubmissionSerializer
from apps.notifications.service import send_rfq_acknowledgment


class RFQSubmissionCreateView(generics.CreateAPIView):
    serializer_class = RFQSubmissionSerializer
    permission_classes = [AllowAny]

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        instance = serializer.save(user=user)
        try:
            send_rfq_acknowledgment(instance)
        except Exception:
            # Never block a submission because of email failure
            pass


class RFQSubmissionListView(generics.ListAPIView):
    serializer_class = RFQSubmissionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return RFQSubmission.objects.filter(user=self.request.user)
