from rest_framework import serializers
from .models import RFQSubmission


class RFQSubmissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = RFQSubmission
        fields = [
            "id",
            "email",
            "company_name",
            "needs_hardware",
            "needs_software",
            "needs_services",
            "asset_count_range",
            "location_count",
            "additional_notes",
            "status",
            "created_at",
        ]
        read_only_fields = ["id", "status", "created_at"]

    def validate(self, data):
        if not any(
            [
                data.get("needs_hardware"),
                data.get("needs_software"),
                data.get("needs_services"),
            ]
        ):
            raise serializers.ValidationError(
                "At least one solution type must be selected."
            )
        return data


class RFQSubmissionAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = RFQSubmission
        fields = "__all__"
        read_only_fields = ["id", "email", "company_name", "created_at"]
