from datetime import date

from django.db.models import Count, Q
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.rfq.models import RFQSubmission
from apps.rfq.serializers import RFQSubmissionAdminSerializer
from apps.subscriptions.models import ArcplusTrialSignup
from apps.subscriptions.serializers import TrialSignupAdminSerializer
from apps.training.models import TrainingRegistration
from apps.training.serializers import TrainingRegistrationSerializer


class IsAdmin(IsAuthenticated):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.role == "admin"


class AdminStatsView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        today = date.today()
        return Response(
            {
                "new_rfqs_today": RFQSubmission.objects.filter(
                    created_at__date=today, status="new"
                ).count(),
                "pending_trials": ArcplusTrialSignup.objects.filter(
                    status="pending"
                ).count(),
                "upcoming_training_headcount": TrainingRegistration.objects.filter(
                    session__date__gte=today, status="paid"
                ).aggregate(total=Count("team_size"))["total"]
                or 0,
                "total_rfqs": RFQSubmission.objects.count(),
                "total_trials": ArcplusTrialSignup.objects.count(),
                "total_registrations": TrainingRegistration.objects.count(),
            }
        )


class AdminRFQListView(generics.ListAPIView):
    serializer_class = RFQSubmissionAdminSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        qs = RFQSubmission.objects.all()
        status_filter = self.request.query_params.get("status")
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs


class AdminRFQUpdateView(generics.UpdateAPIView):
    serializer_class = RFQSubmissionAdminSerializer
    permission_classes = [IsAdmin]
    queryset = RFQSubmission.objects.all()
    http_method_names = ["patch"]


class AdminTrialListView(generics.ListAPIView):
    serializer_class = TrialSignupAdminSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        qs = ArcplusTrialSignup.objects.all()
        status_filter = self.request.query_params.get("status")
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs


class AdminTrialUpdateView(generics.UpdateAPIView):
    serializer_class = TrialSignupAdminSerializer
    permission_classes = [IsAdmin]
    queryset = ArcplusTrialSignup.objects.all()
    http_method_names = ["patch"]


class AdminTrainingListView(generics.ListAPIView):
    serializer_class = TrainingRegistrationSerializer
    permission_classes = [IsAdmin]
    queryset = TrainingRegistration.objects.select_related("session").all()
