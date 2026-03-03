from django.contrib import admin

from .models import TrainingSession, TrainingRegistration


@admin.register(TrainingSession)
class TrainingSessionAdmin(admin.ModelAdmin):
    list_display = [
        "title",
        "level",
        "date",
        "delivery_mode",
        "price_usd",
        "capacity",
        "is_active",
    ]
    list_filter = ["level", "delivery_mode", "is_active"]
    ordering = ["date"]


@admin.register(TrainingRegistration)
class TrainingRegistrationAdmin(admin.ModelAdmin):
    list_display = [
        "full_name",
        "email",
        "session",
        "status",
        "amount_paid",
        "created_at",
    ]
    list_filter = ["status"]
    search_fields = ["email", "full_name", "company_name"]
    readonly_fields = [
        "id",
        "flutterwave_tx_ref",
        "flutterwave_tx_id",
        "created_at",
        "updated_at",
    ]
