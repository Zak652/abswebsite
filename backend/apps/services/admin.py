from django.contrib import admin

from .models import ServiceRequest


@admin.register(ServiceRequest)
class ServiceRequestAdmin(admin.ModelAdmin):
    list_display = [
        "company_name",
        "service_type",
        "country",
        "urgency",
        "status",
        "created_at",
    ]
    list_filter = ["service_type", "status", "urgency", "country"]
    search_fields = ["company_name", "email", "full_name"]
    readonly_fields = ["id", "created_at", "updated_at", "intake_data"]
    ordering = ["-created_at"]
