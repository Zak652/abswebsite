"""GDPR endpoints (build guide § 3.9).

Cover both the export and the self-service delete:
- Export returns the user's full data set under one JSON envelope
  with no other user's data leaking in.
- Delete soft-removes the user, anonymises adjacent rows, cancels
  active trials, and writes an audit row.

Anonymisation invariants in particular need explicit assertions —
a regression here is a real PII leak, not just a behaviour change.
"""
from __future__ import annotations

from unittest.mock import patch

import pytest
from rest_framework.test import APIClient

from apps.accounts.models import AuditLog, User
from apps.rfq.models import RFQSubmission
from apps.subscriptions.models import ArcplusTrialSignup


@pytest.fixture
def alice(db):
    return User.objects.create_user(
        email="alice@example.com",
        password="alice-password-123",  # gitleaks:allow
        full_name="Alice Adams",
        company_name="Alpha Co",
        phone="+256700000000",
        role="client",
    )


@pytest.fixture
def bob(db):
    return User.objects.create_user(
        email="bob@example.com",
        password="bob-password-456",  # gitleaks:allow
        full_name="Bob Brown",
        company_name="Beta Co",
        role="client",
    )


@pytest.fixture
def api():
    return APIClient()


# ---------------------------------------------------------------------------
# Export — GET /auth/me/export/
# ---------------------------------------------------------------------------


def test_export_requires_authentication(api, db):
    res = api.get("/api/v1/auth/me/export/")
    assert res.status_code in (401, 403)


def test_export_returns_users_own_data(api, alice):
    """Profile + nested arrays for every record type."""
    rfq = RFQSubmission.objects.create(
        user=alice,
        company_name=alice.company_name,
        email=alice.email,
        needs_hardware=True,
        asset_count_range="51-200",
    )
    api.force_authenticate(user=alice)
    res = api.get("/api/v1/auth/me/export/")
    assert res.status_code == 200
    body = res.json()

    assert body["profile"]["email"] == "alice@example.com"
    assert body["profile"]["full_name"] == "Alice Adams"
    assert any(r["id"] == str(rfq.id) for r in body["rfqs"])
    assert "training_registrations" in body
    assert "subscriptions" in body
    assert "service_requests" in body
    assert "audit_log" in body


def test_export_does_not_leak_other_users_records(api, alice, bob):
    RFQSubmission.objects.create(
        user=bob,
        company_name=bob.company_name,
        email=bob.email,
        needs_hardware=True,
        asset_count_range="1-50",
    )
    api.force_authenticate(user=alice)
    body = api.get("/api/v1/auth/me/export/").json()
    assert body["rfqs"] == []  # only Alice's records


def test_export_writes_audit_row(api, alice):
    api.force_authenticate(user=alice)
    api.get("/api/v1/auth/me/export/")
    assert AuditLog.objects.filter(
        performed_by=alice, action="user_data_exported"
    ).exists()


# ---------------------------------------------------------------------------
# Delete — POST /auth/me/delete/
# ---------------------------------------------------------------------------


def test_delete_requires_authentication(api, db):
    res = api.post(
        "/api/v1/auth/me/delete/", {"confirm": True}, format="json"
    )
    assert res.status_code in (401, 403)


def test_delete_requires_explicit_confirm_field(api, alice):
    api.force_authenticate(user=alice)
    res = api.post("/api/v1/auth/me/delete/", {}, format="json")
    assert res.status_code == 400
    alice.refresh_from_db()
    assert alice.deleted_at is None
    assert alice.is_active is True


def test_delete_soft_removes_and_anonymises_user(api, alice):
    api.force_authenticate(user=alice)
    with patch("apps.accounts.views.send_account_deletion_confirmation"):
        res = api.post(
            "/api/v1/auth/me/delete/", {"confirm": True}, format="json"
        )
    assert res.status_code == 200, res.data

    alice.refresh_from_db()
    assert alice.is_active is False
    assert alice.deleted_at is not None
    assert alice.email != "alice@example.com"
    assert alice.email.endswith("@example.invalid")
    assert alice.full_name == "Deleted User"
    assert alice.company_name == "Deleted"
    assert alice.phone == ""
    # Password rendered unusable so the original credential can never
    # log this account back in even if the row is somehow reactivated.
    assert not alice.check_password("alice-password-123")


def test_delete_cancels_active_subscriptions(api, alice):
    sub = ArcplusTrialSignup.objects.create(
        user=alice,
        email=alice.email,
        company_name=alice.company_name,
        full_name=alice.full_name,
        plan="growth",
        status="active",
    )
    api.force_authenticate(user=alice)
    with patch("apps.accounts.views.send_account_deletion_confirmation"):
        api.post("/api/v1/auth/me/delete/", {"confirm": True}, format="json")
    sub.refresh_from_db()
    assert sub.status == "cancelled"
    assert sub.cancelled_at is not None
    assert sub.user is None
    assert sub.email != "alice@example.com"


def test_delete_anonymises_linked_rfqs(api, alice):
    rfq = RFQSubmission.objects.create(
        user=alice,
        company_name=alice.company_name,
        email=alice.email,
        needs_hardware=True,
        asset_count_range="51-200",
    )
    api.force_authenticate(user=alice)
    with patch("apps.accounts.views.send_account_deletion_confirmation"):
        api.post("/api/v1/auth/me/delete/", {"confirm": True}, format="json")
    rfq.refresh_from_db()
    assert rfq.user is None
    assert rfq.email != "alice@example.com"
    assert rfq.company_name == "Deleted"


def test_delete_writes_audit_row_under_original_user(api, alice):
    """Audit row must be written *before* the User row is anonymised
    so we can trace the action back to the original identity."""
    api.force_authenticate(user=alice)
    with patch("apps.accounts.views.send_account_deletion_confirmation"):
        api.post("/api/v1/auth/me/delete/", {"confirm": True}, format="json")
    assert AuditLog.objects.filter(
        performed_by=alice, action="user_self_deleted"
    ).exists()


def test_delete_sends_confirmation_to_original_email(api, alice):
    api.force_authenticate(user=alice)
    with patch(
        "apps.accounts.views.send_account_deletion_confirmation"
    ) as mocked:
        api.post("/api/v1/auth/me/delete/", {"confirm": True}, format="json")
    mocked.assert_called_once()
    kwargs = mocked.call_args.kwargs
    assert kwargs["to_email"] == "alice@example.com"
    assert kwargs["full_name"] == "Alice Adams"


def test_delete_is_idempotent_at_module_level(alice):
    """The module-level delete_user() must no-op when called twice.

    (At the API level a deleted user can no longer authenticate, so
    they simply never reach the second call — but the underlying
    function still needs to be safe in case of an internal retry.)
    """
    from apps.accounts.gdpr import delete_user

    delete_user(alice)
    first_deleted_at = alice.deleted_at
    delete_user(alice)
    alice.refresh_from_db()
    # No second timestamp overwrite — the second call early-returned.
    assert alice.deleted_at == first_deleted_at


def test_export_does_not_include_password_hash(api, alice):
    """Sanity — we must never serialize the password hash, even
    inadvertently via __dict__ or model_to_dict."""
    api.force_authenticate(user=alice)
    body = api.get("/api/v1/auth/me/export/").json()
    serialized = str(body)
    assert "pbkdf2" not in serialized
    assert "argon2" not in serialized
