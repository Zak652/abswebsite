from django.contrib import admin

from .models import RFQSubmission


@admin.register(RFQSubmission)
class RFQSubmissionAdmin(admin.ModelAdmin):
    list_display = ["__str__", "email", "company_name", "status", "created_at"]
    list_filter = ["status", "needs_hardware", "needs_software", "needs_services"]
    search_fields = ["email", "company_name"]
    ordering = ["-created_at"]
    readonly_fields = ["id", "created_at", "updated_at"]
