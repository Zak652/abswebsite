import uuid
from django.db import models


class TrainingSession(models.Model):
    LEVEL_CHOICES = [
        ("beginner", "Beginner"),
        ("advanced", "Advanced"),
        ("expert", "Expert"),
    ]
    DELIVERY_CHOICES = [
        ("virtual", "Virtual"),
        ("in_person", "In Person"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    level = models.CharField(max_length=20, choices=LEVEL_CHOICES)
    date = models.DateField()
    time_start = models.TimeField()
    time_end = models.TimeField()
    location = models.CharField(max_length=255)
    delivery_mode = models.CharField(max_length=20, choices=DELIVERY_CHOICES)
    price_usd = models.DecimalField(max_digits=10, decimal_places=2)
    capacity = models.IntegerField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "training_session"
        ordering = ["date"]

    def __str__(self):
        return f"{self.title} ({self.date})"

    @property
    def seats_remaining(self):
        booked = self.registrations.filter(status="paid").count()
        return max(0, self.capacity - booked)


class TrainingRegistration(models.Model):
    STATUS_CHOICES = [
        ("pending_payment", "Pending Payment"),
        ("paid", "Paid"),
        ("cancelled", "Cancelled"),
        ("refunded", "Refunded"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(
        TrainingSession,
        on_delete=models.PROTECT,
        related_name="registrations",
    )
    user = models.ForeignKey(
        "accounts.User",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="training_registrations",
    )
    email = models.EmailField()
    company_name = models.CharField(max_length=255)
    full_name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20, blank=True)
    team_size = models.IntegerField(default=1)
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default="pending_payment"
    )
    flutterwave_tx_ref = models.CharField(
        max_length=255, blank=True, unique=True, null=True
    )
    flutterwave_tx_id = models.CharField(max_length=255, blank=True)
    amount_paid = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    currency = models.CharField(max_length=10, default="USD")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "training_registration"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.full_name} — {self.session.title} ({self.status})"
