from rest_framework import generics
from rest_framework.permissions import AllowAny

from .models import ServiceRequest
from .serializers import ServiceRequestSerializer
from apps.notifications.service import send_service_request_notification


class ServiceRequestCreateView(generics.CreateAPIView):
    serializer_class = ServiceRequestSerializer
    permission_classes = [AllowAny]

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        instance = serializer.save(user=user)
        try:
            send_service_request_notification(instance)
        except Exception:
            # Never block a submission because of email failure
            pass
