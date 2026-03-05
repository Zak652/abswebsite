import uuid

from django.db import models


class ServiceRequest(models.Model):
    SERVICE_TYPE_CHOICES = [
        ("asset_register", "Asset Register Creation"),
        ("verification", "Asset Verification"),
        ("disposal", "Asset Disposal Support"),
        ("training_outsource", "Asset Management Training"),
        ("full_outsource", "Asset Management Outsourcing"),
    ]
    STATUS_CHOICES = [
        ("new", "New"),
        ("reviewing", "Under Review"),
        ("scoped", "Proposal Sent"),
        ("in_progress", "In Progress"),
        ("completed", "Completed"),
        ("cancelled", "Cancelled"),
    ]
    URGENCY_CHOICES = [
        ("urgent", "Urgent (< 2 weeks)"),
        ("standard", "Standard (1 month)"),
        ("flexible", "Flexible"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        "accounts.User",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="service_requests",
    )
    service_type = models.CharField(max_length=30, choices=SERVICE_TYPE_CHOICES)
    full_name = models.CharField(max_length=255)
    email = models.EmailField()
    company_name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20, blank=True)
    country = models.CharField(max_length=100)
    asset_count_estimate = models.CharField(max_length=50, blank=True)
    site_count = models.IntegerField(default=1)
    urgency = models.CharField(
        max_length=20, choices=URGENCY_CHOICES, default="standard"
    )
    intake_data = models.JSONField(default=dict)
    additional_requirements = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="new")
    admin_notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "service_request"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.get_service_type_display()} — {self.company_name}"
