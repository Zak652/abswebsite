import uuid
from django.db import models


class RFQSubmission(models.Model):
    STATUS_CHOICES = [
        ("new", "New"),
        ("reviewing", "Reviewing"),
        ("quoted", "Quoted"),
        ("closed", "Closed"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        "accounts.User",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="rfq_submissions",
    )
    email = models.EmailField()
    company_name = models.CharField(max_length=255)
    needs_hardware = models.BooleanField(default=False)
    needs_software = models.BooleanField(default=False)
    needs_services = models.BooleanField(default=False)
    asset_count_range = models.CharField(max_length=50)
    location_count = models.CharField(max_length=20, blank=True)
    additional_notes = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="new")
    admin_notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "rfq_submission"
        ordering = ["-created_at"]

    def __str__(self):
        return f"RFQ-{str(self.id)[:8].upper()} — {self.company_name}"
