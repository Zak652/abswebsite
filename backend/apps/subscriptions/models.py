import uuid
from django.db import models


class ArcplusTrialSignup(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending Provisioning"),
        ("provisioned", "Provisioned"),
        ("active", "Active Trial"),
        ("converted", "Converted"),
        ("expired", "Expired"),
    ]

    PLAN_CHOICES = [
        ("starter", "Starter"),
        ("growth", "Growth"),
        ("professional", "Professional"),
        ("enterprise", "Enterprise"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        "accounts.User",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="trial_signups",
    )
    email = models.EmailField()
    company_name = models.CharField(max_length=255)
    full_name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20, blank=True)
    plan = models.CharField(max_length=30, choices=PLAN_CHOICES, default="growth")
    asset_count_estimate = models.CharField(max_length=50, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    admin_notes = models.TextField(blank=True)
    provisioned_at = models.DateTimeField(null=True, blank=True)
    provisioned_by = models.CharField(max_length=255, blank=True)
    trial_start = models.DateTimeField(null=True, blank=True)
    trial_expiry = models.DateTimeField(null=True, blank=True)
    reminder_sent_day7 = models.BooleanField(default=False)
    reminder_sent_day3 = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "subscriptions_trialsignup"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.company_name} — {self.plan} ({self.status})"
