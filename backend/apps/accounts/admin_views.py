import csv
import io
from datetime import date, timedelta

from django.db.models import Count, DecimalField, Q, Sum
from django.http import HttpResponse
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.products.models import Product
from apps.products.serializers import ProductAdminSerializer, ProductListSerializer
from apps.rfq.models import RFQSubmission
from apps.rfq.serializers import RFQSubmissionAdminSerializer
from apps.services.models import ServiceRequest
from apps.services.serializers import ServiceRequestAdminSerializer
from apps.subscriptions.models import ArcplusTrialSignup
from apps.subscriptions.serializers import TrialSignupAdminSerializer
from apps.training.models import TrainingRegistration
from apps.training.serializers import TrainingRegistrationSerializer
from .models import User, log_admin_action
from .serializers import UserSerializer


class IsAdmin(IsAuthenticated):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.role == "admin"


# ── Stats ──────────────────────────────────────────────────────────────────────


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
                "new_service_requests": ServiceRequest.objects.filter(
                    status="new"
                ).count(),
            }
        )


# ── Analytics ─────────────────────────────────────────────────────────────────


class AdminAnalyticsView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        try:
            period = int(request.query_params.get("period", 30))
        except ValueError:
            period = 30
        period = min(period, 365)

        since = date.today() - timedelta(days=period)

        rfq_by_status = {
            row["status"]: row["count"]
            for row in RFQSubmission.objects.values("status").annotate(
                count=Count("id")
            )
        }

        trial_by_status = {
            row["status"]: row["count"]
            for row in ArcplusTrialSignup.objects.values("status").annotate(
                count=Count("id")
            )
        }

        total_trials = ArcplusTrialSignup.objects.count()
        converted = ArcplusTrialSignup.objects.filter(status="converted").count()
        conversion_rate = round(converted / total_trials, 4) if total_trials > 0 else 0

        service_type_counts = list(
            ServiceRequest.objects.values("service_type").annotate(count=Count("id"))
        )

        training_revenue_usd = (
            TrainingRegistration.objects.filter(
                status="paid", currency="USD"
            ).aggregate(total=Sum("amount_paid", output_field=DecimalField()))["total"]
            or 0
        )

        return Response(
            {
                "period_days": period,
                "since": since.isoformat(),
                "rfqs_by_status": rfq_by_status,
                "trials_by_status": trial_by_status,
                "trial_conversion_rate": conversion_rate,
                "top_service_types": service_type_counts,
                "new_rfqs_period": RFQSubmission.objects.filter(
                    created_at__date__gte=since
                ).count(),
                "new_trials_period": ArcplusTrialSignup.objects.filter(
                    created_at__date__gte=since
                ).count(),
                "new_registrations_period": TrainingRegistration.objects.filter(
                    created_at__date__gte=since, status="paid"
                ).count(),
                "training_revenue_usd": float(training_revenue_usd),
            }
        )


# ── RFQ ───────────────────────────────────────────────────────────────────────


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

    def perform_update(self, serializer):
        old_status = self.get_object().status
        instance = serializer.save()
        if instance.status != old_status:
            log_admin_action(
                user=self.request.user,
                action="rfq_status_change",
                resource_type="rfq",
                resource_id=instance.id,
                changes={"status": {"from": old_status, "to": instance.status}},
                request=self.request,
            )


class AdminRFQExportView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        qs = RFQSubmission.objects.all().order_by("-created_at")
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(
            [
                "Reference",
                "Company",
                "Email",
                "Hardware",
                "Software",
                "Services",
                "Asset Count",
                "Status",
                "Submitted",
            ]
        )
        for rfq in qs:
            writer.writerow(
                [
                    str(rfq.id)[:8].upper(),
                    rfq.company_name,
                    rfq.email,
                    rfq.needs_hardware,
                    rfq.needs_software,
                    rfq.needs_services,
                    rfq.asset_count_range,
                    rfq.status,
                    rfq.created_at.strftime("%Y-%m-%d"),
                ]
            )
        response = HttpResponse(output.getvalue(), content_type="text/csv")
        response["Content-Disposition"] = 'attachment; filename="rfq_export.csv"'
        return response


# ── Subscriptions ─────────────────────────────────────────────────────────────


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

    def perform_update(self, serializer):
        old_status = self.get_object().status
        instance = serializer.save()
        if instance.status != old_status:
            action = (
                "trial_provisioned"
                if instance.status == "provisioned"
                else "trial_status_change"
            )
            log_admin_action(
                user=self.request.user,
                action=action,
                resource_type="trial",
                resource_id=instance.id,
                changes={"status": {"from": old_status, "to": instance.status}},
                request=self.request,
            )


class AdminTrialExportView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        qs = ArcplusTrialSignup.objects.all().order_by("-created_at")
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(
            [
                "Company",
                "Contact",
                "Email",
                "Plan",
                "Asset Count",
                "Status",
                "Submitted",
                "Provisioned At",
            ]
        )
        for t in qs:
            writer.writerow(
                [
                    t.company_name,
                    t.full_name,
                    t.email,
                    t.plan,
                    t.asset_count_estimate,
                    t.status,
                    t.created_at.strftime("%Y-%m-%d"),
                    t.provisioned_at.strftime("%Y-%m-%d") if t.provisioned_at else "",
                ]
            )
        response = HttpResponse(output.getvalue(), content_type="text/csv")
        response["Content-Disposition"] = 'attachment; filename="trials_export.csv"'
        return response


# ── Training ─────────────────────────────────────────────────────────────────


class AdminTrainingListView(generics.ListAPIView):
    serializer_class = TrainingRegistrationSerializer
    permission_classes = [IsAdmin]
    queryset = TrainingRegistration.objects.select_related("session").all()


class AdminTrainingExportView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        qs = (
            TrainingRegistration.objects.select_related("session")
            .all()
            .order_by("-created_at")
        )
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(
            [
                "Session",
                "Date",
                "Registrant",
                "Company",
                "Email",
                "Team Size",
                "Status",
                "Amount Paid",
                "Currency",
                "Registered",
            ]
        )
        for reg in qs:
            writer.writerow(
                [
                    reg.session.title,
                    reg.session.date.strftime("%Y-%m-%d"),
                    reg.full_name,
                    reg.company_name,
                    reg.email,
                    reg.team_size,
                    reg.status,
                    reg.amount_paid or "",
                    reg.currency,
                    reg.created_at.strftime("%Y-%m-%d"),
                ]
            )
        response = HttpResponse(output.getvalue(), content_type="text/csv")
        response["Content-Disposition"] = 'attachment; filename="training_export.csv"'
        return response


# ── Users ─────────────────────────────────────────────────────────────────────


class AdminUserSerializer(UserSerializer):
    class Meta(UserSerializer.Meta):
        fields = list(UserSerializer.Meta.fields) + ["is_active", "updated_at"]
        read_only_fields = ["id", "email", "created_at"]


class AdminUserListView(generics.ListAPIView):
    serializer_class = AdminUserSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        qs = User.objects.all()
        search = self.request.query_params.get("search")
        role = self.request.query_params.get("role")
        if search:
            qs = qs.filter(
                Q(email__icontains=search)
                | Q(full_name__icontains=search)
                | Q(company_name__icontains=search)
            )
        if role:
            qs = qs.filter(role=role)
        return qs


class AdminUserUpdateView(generics.UpdateAPIView):
    serializer_class = AdminUserSerializer
    permission_classes = [IsAdmin]
    queryset = User.objects.all()
    http_method_names = ["patch"]

    def perform_update(self, serializer):
        old_user = self.get_object()
        old_is_active = old_user.is_active
        old_role = old_user.role
        instance = serializer.save()

        if not instance.is_active and old_is_active:
            log_admin_action(
                user=self.request.user,
                action="user_deactivated",
                resource_type="user",
                resource_id=instance.id,
                changes={"is_active": {"from": True, "to": False}},
                request=self.request,
            )
        if instance.role != old_role:
            log_admin_action(
                user=self.request.user,
                action="user_role_change",
                resource_type="user",
                resource_id=instance.id,
                changes={"role": {"from": old_role, "to": instance.role}},
                request=self.request,
            )


# ── Products CRUD ─────────────────────────────────────────────────────────────


class AdminProductListView(generics.ListAPIView):
    serializer_class = ProductListSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        qs = Product.objects.select_related("category").all()
        category = self.request.query_params.get("category")
        if category:
            qs = qs.filter(category__slug=category)
        return qs


class AdminProductCreateView(generics.CreateAPIView):
    serializer_class = ProductAdminSerializer
    permission_classes = [IsAdmin]

    def perform_create(self, serializer):
        instance = serializer.save()
        log_admin_action(
            user=self.request.user,
            action="product_created",
            resource_type="product",
            resource_id=instance.id,
            changes={"name": instance.name, "category": instance.category.slug},
            request=self.request,
        )


class AdminProductUpdateView(generics.UpdateAPIView):
    serializer_class = ProductAdminSerializer
    permission_classes = [IsAdmin]
    queryset = Product.objects.all()
    http_method_names = ["patch"]

    def perform_update(self, serializer):
        instance = serializer.save()
        log_admin_action(
            user=self.request.user,
            action="product_updated",
            resource_type="product",
            resource_id=instance.id,
            changes={"name": instance.name},
            request=self.request,
        )


class AdminProductDeleteView(generics.DestroyAPIView):
    permission_classes = [IsAdmin]
    queryset = Product.objects.all()

    def perform_destroy(self, instance):
        log_admin_action(
            user=self.request.user,
            action="product_deleted",
            resource_type="product",
            resource_id=instance.id,
            changes={"name": instance.name},
            request=self.request,
        )
        instance.delete()


# ── Services ─────────────────────────────────────────────────────────────────


class AdminServiceRequestListView(generics.ListAPIView):
    serializer_class = ServiceRequestAdminSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        qs = ServiceRequest.objects.all()
        service_type = self.request.query_params.get("service_type")
        status_filter = self.request.query_params.get("status")
        if service_type:
            qs = qs.filter(service_type=service_type)
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs


class AdminServiceRequestUpdateView(generics.UpdateAPIView):
    serializer_class = ServiceRequestAdminSerializer
    permission_classes = [IsAdmin]
    queryset = ServiceRequest.objects.all()
    http_method_names = ["patch"]

    def perform_update(self, serializer):
        old_status = self.get_object().status
        instance = serializer.save()
        if instance.status != old_status:
            log_admin_action(
                user=self.request.user,
                action="service_status_change",
                resource_type="service_request",
                resource_id=instance.id,
                changes={"status": {"from": old_status, "to": instance.status}},
                request=self.request,
            )
