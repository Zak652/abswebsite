"""Personal-data export and self-deletion (build guide § 3.9).

GDPR Article 15 (right of access) and Article 17 (right to erasure)
land here. The export aggregates every user-linked record this site
has, the delete soft-removes the account and anonymises PII in
adjacent rows we keep for legitimate-interest reasons (financial
records, capacity counts).

Why a dedicated module
----------------------
Putting both flows here keeps two policies in one place: what we
return to the user, and what we keep after deletion. A future field
addition or new linked model needs to update both — having them
side-by-side surfaces that obligation.

Anonymisation rationale
-----------------------
Hard-deleting linked rows would break referential integrity for
records we have a legitimate-interest basis to keep:
- Training registrations after payment: financial / compliance trail.
- RFQs after a quote is sent: audit / dispute defence.

For those rows we anonymise the PII fields (email, full_name, phone,
company_name) so the row is meaningless about the individual but the
business record persists. The user FK is set to NULL so cascades on
the User row don't take them with us.
"""

from __future__ import annotations

import hashlib
import logging
import uuid
from typing import Any

from django.db import transaction
from django.utils import timezone

from apps.accounts.models import AuditLog, User
from apps.rfq.models import RFQSubmission
from apps.services.models import ServiceRequest
from apps.subscriptions.models import ArcplusTrialSignup
from apps.training.models import TrainingRegistration


logger = logging.getLogger(__name__)


def export_user_data(user: User) -> dict[str, Any]:
    """Return the user's complete personal-data set as a JSON-able dict.

    Conservative serialisation — every field that is or contains PII
    we've collected from the user, plus identifiers and timestamps so
    the user can correlate against external receipts (Flutterwave
    payment confirmations, the welcome email, etc.).
    """
    return {
        "exported_at": timezone.now().isoformat(),
        "profile": {
            "id": str(user.id),
            "email": user.email,
            "full_name": user.full_name,
            "company_name": user.company_name,
            "phone": user.phone,
            "role": user.role,
            "email_verified_at": (
                user.email_verified_at.isoformat()
                if user.email_verified_at
                else None
            ),
            "created_at": user.created_at.isoformat(),
        },
        "rfqs": [
            _serialize_rfq(r) for r in RFQSubmission.objects.filter(user=user)
        ],
        "training_registrations": [
            _serialize_training(r)
            for r in TrainingRegistration.objects.filter(
                user=user
            ).select_related("session")
        ],
        "subscriptions": [
            _serialize_subscription(s)
            for s in ArcplusTrialSignup.objects.filter(user=user)
        ],
        "service_requests": [
            _serialize_service(s)
            for s in ServiceRequest.objects.filter(user=user)
        ],
        "audit_log": [
            {
                "action": e.action,
                "resource_type": e.resource_type,
                "resource_id": e.resource_id,
                "ip_address": e.ip_address,
                "created_at": e.created_at.isoformat(),
            }
            for e in AuditLog.objects.filter(performed_by=user).order_by(
                "-created_at"
            )[:500]
        ],
    }


def delete_user(user: User, *, request=None) -> None:
    """Soft-delete the user and anonymise PII in linked records.

    Idempotent — calling this on an already-deleted user is a no-op
    (the second call sees ``deleted_at != None`` and returns).

    Effects in one atomic transaction:
    - User row: ``is_active=False``, ``deleted_at=now()``, PII columns
      replaced with deterministic placeholders (the email becomes a
      unique-but-meaningless ``deleted-<sha>@example.invalid`` so the
      uniqueness constraint still holds).
    - All ``ArcplusTrialSignup`` rows: ``status='cancelled'`` for any
      that aren't already terminal; PII anonymised.
    - All ``RFQSubmission`` / ``TrainingRegistration`` /
      ``ServiceRequest`` rows: PII anonymised, ``user`` FK nulled so
      the user can be removed without dragging the records along.
    - Audit row written under the user's own id (last write before the
      account is anonymised).

    Refresh-token blacklisting and email confirmation are caller's
    responsibility — they're view-layer concerns.
    """
    if user.deleted_at is not None:
        return

    redacted_email = (
        f"deleted-{hashlib.sha256(str(user.id).encode()).hexdigest()[:12]}"
        f"@example.invalid"
    )

    with transaction.atomic():
        # Audit BEFORE we anonymise so the row reflects the actor's
        # original identity. AuditLog uses PROTECT on performed_by,
        # so the audit entry survives the soft-delete.
        AuditLog.objects.create(
            performed_by=user,
            action="user_self_deleted",
            resource_type="User",
            resource_id=str(user.id),
            changes={"reason": "self_service_gdpr_delete"},
            ip_address=_client_ip(request),
        )

        # Cancel any active subscriptions before anonymising the row
        # itself, so the cancelled_at timestamp is preserved.
        for signup in ArcplusTrialSignup.objects.filter(user=user):
            if signup.status not in ArcplusTrialSignup.TERMINAL_STATUSES:
                signup.status = "cancelled"
                signup.cancelled_at = timezone.now()
                signup.cancellation_reason = "Account deleted by user"
            _anonymise_contact_fields(signup)
            signup.user = None
            signup.save()

        for rfq in RFQSubmission.objects.filter(user=user):
            _anonymise_contact_fields(rfq)
            rfq.user = None
            rfq.save()

        for reg in TrainingRegistration.objects.filter(user=user):
            _anonymise_contact_fields(reg)
            reg.user = None
            reg.save()

        for svc in ServiceRequest.objects.filter(user=user):
            _anonymise_contact_fields(svc)
            svc.user = None
            svc.save()

        user.is_active = False
        user.deleted_at = timezone.now()
        user.email = redacted_email
        user.full_name = "Deleted User"
        user.company_name = "Deleted"
        user.phone = ""
        user.set_unusable_password()
        user.save()


# ---------------------------------------------------------------------------
# Serialisers — kept dumb and field-explicit so a new field is a
# deliberate add, not an automatic leak.
# ---------------------------------------------------------------------------


def _serialize_rfq(rfq: RFQSubmission) -> dict[str, Any]:
    return {
        "id": str(rfq.id),
        "company_name": rfq.company_name,
        "email": rfq.email,
        "needs_hardware": rfq.needs_hardware,
        "needs_software": rfq.needs_software,
        "needs_services": rfq.needs_services,
        "asset_count_range": rfq.asset_count_range,
        "additional_notes": rfq.additional_notes,
        "status": rfq.status,
        "created_at": rfq.created_at.isoformat(),
    }


def _serialize_training(reg: TrainingRegistration) -> dict[str, Any]:
    return {
        "id": str(reg.id),
        "session_title": getattr(reg.session, "title", None),
        "session_id": str(reg.session_id) if reg.session_id else None,
        "full_name": reg.full_name,
        "email": reg.email,
        "phone": reg.phone,
        "company_name": reg.company_name,
        "status": reg.status,
        "amount_paid": str(reg.amount_paid)
        if getattr(reg, "amount_paid", None) is not None
        else None,
        "created_at": reg.created_at.isoformat(),
    }


def _serialize_subscription(s: ArcplusTrialSignup) -> dict[str, Any]:
    return {
        "id": str(s.id),
        "company_name": s.company_name,
        "email": s.email,
        "full_name": s.full_name,
        "plan": s.plan,
        "status": s.status,
        "cancelled_at": s.cancelled_at.isoformat() if s.cancelled_at else None,
        "created_at": s.created_at.isoformat(),
    }


def _serialize_service(s: ServiceRequest) -> dict[str, Any]:
    return {
        "id": str(s.id),
        "service_type": s.service_type,
        "company_name": s.company_name,
        "email": s.email,
        "phone": s.phone,
        "status": s.status,
        "created_at": s.created_at.isoformat(),
    }


# ---------------------------------------------------------------------------
# Anonymisation helpers — set on every model with PII columns.
# ---------------------------------------------------------------------------


_REDACTED_EMAIL_TEMPLATE = "deleted-{}@example.invalid"


def _anonymise_contact_fields(obj: Any) -> None:
    """Best-effort PII scrub.

    Only touches fields that exist on the row — different models
    spell things slightly differently. The email replacement uses a
    new uuid each call so a row can never be re-correlated to the
    originating user via deterministic hashes.
    """
    redacted_email = _REDACTED_EMAIL_TEMPLATE.format(uuid.uuid4().hex[:10])
    if hasattr(obj, "email"):
        obj.email = redacted_email
    if hasattr(obj, "full_name"):
        obj.full_name = "Deleted User"
    if hasattr(obj, "phone"):
        obj.phone = ""
    if hasattr(obj, "company_name"):
        obj.company_name = "Deleted"


def _client_ip(request) -> str | None:
    if not request:
        return None
    fwd = request.META.get("HTTP_X_FORWARDED_FOR")
    if fwd:
        return fwd.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")
