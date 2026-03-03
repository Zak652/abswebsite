from django.contrib import admin

from .models import ArcplusTrialSignup


@admin.register(ArcplusTrialSignup)
class TrialSignupAdmin(admin.ModelAdmin):
    list_display = ["company_name", "email", "plan", "status", "created_at"]
    list_filter = ["status", "plan"]
    search_fields = ["email", "company_name"]
    ordering = ["-created_at"]
    readonly_fields = ["id", "created_at", "updated_at"]
