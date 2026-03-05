import uuid
from django.contrib.auth.models import (
    AbstractBaseUser,
    BaseUserManager,
    PermissionsMixin,
)
from django.db import models


class Organization(models.Model):
    INDUSTRY_CHOICES = [
        ("logistics", "Logistics & Warehousing"),
        ("manufacturing", "Manufacturing"),
        ("healthcare", "Healthcare"),
        ("defense", "Defense & Government"),
        ("real_estate", "Real Estate & Facilities"),
        ("it", "IT Asset Management"),
        ("other", "Other"),
    ]
    SIZE_CHOICES = [
        ("1-50", "1–50 employees"),
        ("51-200", "51–200 employees"),
        ("201-1000", "201–1,000 employees"),
        ("1001+", "1,000+ employees"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    industry = models.CharField(max_length=30, choices=INDUSTRY_CHOICES, blank=True)
    country = models.CharField(max_length=100, blank=True)
    size_range = models.CharField(max_length=20, choices=SIZE_CHOICES, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "organization"
        ordering = ["name"]

    def __str__(self):
        return self.name


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Email is required")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role", "admin")
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = [
        ("client", "Client"),
        ("admin", "Admin"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=255)
    company_name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20, blank=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="client")
    organization = models.ForeignKey(
        Organization,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="users",
    )
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["full_name", "company_name"]

    class Meta:
        db_table = "accounts_user"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.email} ({self.company_name})"


class AuditLog(models.Model):
    ACTION_CHOICES = [
        ("rfq_status_change", "RFQ Status Changed"),
        ("trial_provisioned", "Trial Provisioned"),
        ("trial_status_change", "Trial Status Changed"),
        ("user_deactivated", "User Deactivated"),
        ("user_role_change", "User Role Changed"),
        ("product_created", "Product Created"),
        ("product_updated", "Product Updated"),
        ("product_deleted", "Product Deleted"),
        ("service_status_change", "Service Request Status Changed"),
        ("training_status_change", "Training Registration Status Changed"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    performed_by = models.ForeignKey(
        User, on_delete=models.PROTECT, related_name="audit_logs"
    )
    action = models.CharField(max_length=50, choices=ACTION_CHOICES)
    resource_type = models.CharField(max_length=50)
    resource_id = models.CharField(max_length=100)
    changes = models.JSONField(default=dict)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "audit_log"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.performed_by.email} — {self.action} ({self.resource_type}:{self.resource_id})"


def log_admin_action(user, action, resource_type, resource_id, changes, request=None):
    """Helper to create an AuditLog entry from admin views."""
    ip = None
    if request:
        x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
        if x_forwarded_for:
            ip = x_forwarded_for.split(",")[0].strip()
        else:
            ip = request.META.get("REMOTE_ADDR")

    AuditLog.objects.create(
        performed_by=user,
        action=action,
        resource_type=resource_type,
        resource_id=str(resource_id),
        changes=changes,
        ip_address=ip,
    )
