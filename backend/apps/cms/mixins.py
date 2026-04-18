import uuid

from django.conf import settings
from django.db import models


class PublishableMixin(models.Model):
    """Abstract model for content that follows a publishing workflow.

    Status lifecycle:
        draft → review → approved → published → archived
        published → draft (unpublish for re-editing)
        any → archived (soft delete)

    Public APIs should filter by status='published' only.
    """

    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("review", "In Review"),
        ("approved", "Approved"),
        ("published", "Published"),
        ("archived", "Archived"),
    ]

    VALID_TRANSITIONS = {
        "draft": ["review", "archived"],
        "review": ["approved", "draft", "archived"],
        "approved": ["published", "draft", "archived"],
        "published": ["draft", "archived"],
        "archived": ["draft"],
    }

    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default="draft", db_index=True
    )
    version = models.IntegerField(default=1)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="%(class)s_created",
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="%(class)s_updated",
    )
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="%(class)s_approved",
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    published_at = models.DateTimeField(null=True, blank=True)
    scheduled_publish_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True

    def can_transition_to(self, new_status):
        return new_status in self.VALID_TRANSITIONS.get(self.status, [])

    def transition_to(self, new_status, user=None):
        """Transition to a new status. Raises ValueError if transition is invalid."""
        if not self.can_transition_to(new_status):
            raise ValueError(
                f"Cannot transition from '{self.status}' to '{new_status}'. "
                f"Valid transitions: {self.VALID_TRANSITIONS.get(self.status, [])}"
            )

        from django.utils import timezone

        self.status = new_status
        self.updated_by = user

        if new_status == "approved" and user:
            self.approved_by = user
            self.approved_at = timezone.now()

        if new_status == "published":
            self.published_at = timezone.now()
            self.scheduled_publish_at = None

        self.save()

    def save(self, *args, **kwargs):
        if self.pk:
            self.version = models.F("version") + 1
        super().save(*args, **kwargs)
        if self.pk:
            self.refresh_from_db(fields=["version"])
