from rest_framework import serializers

from .models import ServiceRequest


class ServiceRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceRequest
        fields = [
            "id",
            "service_type",
            "full_name",
            "email",
            "company_name",
            "phone",
            "country",
            "asset_count_estimate",
            "site_count",
            "urgency",
            "intake_data",
            "additional_requirements",
            "status",
            "created_at",
        ]
        read_only_fields = ["id", "status", "created_at"]


class ServiceRequestAdminSerializer(serializers.ModelSerializer):
    service_type_display = serializers.CharField(
        source="get_service_type_display", read_only=True
    )
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    urgency_display = serializers.CharField(
        source="get_urgency_display", read_only=True
    )

    class Meta:
        model = ServiceRequest
        fields = "__all__"
        read_only_fields = [
            "id",
            "email",
            "company_name",
            "service_type",
            "created_at",
        ]
