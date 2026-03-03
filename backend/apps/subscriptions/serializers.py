from rest_framework import serializers
from .models import ArcplusTrialSignup


class TrialSignupSerializer(serializers.ModelSerializer):
    class Meta:
        model = ArcplusTrialSignup
        fields = [
            "id",
            "email",
            "company_name",
            "full_name",
            "phone",
            "plan",
            "asset_count_estimate",
            "status",
            "created_at",
        ]
        read_only_fields = ["id", "status", "created_at"]


class TrialSignupAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = ArcplusTrialSignup
        fields = "__all__"
        read_only_fields = ["id", "created_at"]
