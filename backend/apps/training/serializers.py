from rest_framework import serializers
from .models import TrainingSession, TrainingRegistration


class TrainingSessionSerializer(serializers.ModelSerializer):
    seats_remaining = serializers.IntegerField(read_only=True)

    class Meta:
        model = TrainingSession
        fields = [
            "id",
            "title",
            "level",
            "date",
            "time_start",
            "time_end",
            "location",
            "delivery_mode",
            "price_usd",
            "capacity",
            "seats_remaining",
            "is_active",
        ]


class TrainingRegistrationSerializer(serializers.ModelSerializer):
    session_title = serializers.CharField(source="session.title", read_only=True)
    session_date = serializers.DateField(source="session.date", read_only=True)

    class Meta:
        model = TrainingRegistration
        fields = [
            "id",
            "session",
            "session_title",
            "session_date",
            "email",
            "company_name",
            "full_name",
            "phone",
            "team_size",
            "status",
            "amount_paid",
            "currency",
            "created_at",
        ]
        read_only_fields = ["id", "status", "amount_paid", "currency", "created_at"]


class TrainingRegistrationCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = TrainingRegistration
        fields = ["session", "email", "company_name", "full_name", "phone", "team_size"]
