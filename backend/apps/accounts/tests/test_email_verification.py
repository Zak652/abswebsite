"""Email verification flow (§ 3.8).

Sibling to test_password_reset.py — same signing infrastructure,
different fingerprint binding (email + email_verified_at).
"""
from __future__ import annotations

from unittest.mock import patch

import pytest
from django.core.cache import cache
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.core.signing import make_token


@pytest.fixture(autouse=True)
def _clear_throttle_cache():
    cache.clear()
    yield
    cache.clear()


@pytest.fixture
def alice(db):
    return User.objects.create_user(
        email="alice@example.com",
        password="orig-password-123",  # gitleaks:allow
        full_name="Alice",
        company_name="Co",
        role="client",
    )


@pytest.fixture
def api():
    return APIClient()


def _login(api, user):
    """Authenticate the api client as ``user`` for subsequent requests.

    Bypasses the password flow because tests don't need to exercise
    /login/ here — they just need to drive endpoints that require an
    authenticated request.user.
    """
    api.force_authenticate(user=user)


# ---------------------------------------------------------------------------
# Auto-send on register
# ---------------------------------------------------------------------------


def test_register_auto_sends_verification_email(db):
    api = APIClient()
    with patch("apps.accounts.views.send_email_verification") as mocked:
        res = api.post(
            "/api/v1/auth/register/",
            {
                "email": "newuser@example.com",
                "password": "test-password-123",  # gitleaks:allow
                "password_confirm": "test-password-123",  # gitleaks:allow
                "full_name": "New User",
                "company_name": "Co",
            },
            format="json",
        )
    assert res.status_code == 201
    mocked.assert_called_once()
    sent_user, sent_token = mocked.call_args.args
    assert sent_user.email == "newuser@example.com"
    assert isinstance(sent_token, str) and len(sent_token) > 20


def test_register_succeeds_even_if_email_send_fails(db):
    """An email outage must not break registration — the user can ask
    for a re-send via the request endpoint."""
    api = APIClient()
    with patch(
        "apps.accounts.views.send_email_verification",
        side_effect=Exception("smtp down"),
    ):
        res = api.post(
            "/api/v1/auth/register/",
            {
                "email": "newuser2@example.com",
                "password": "test-password-123",  # gitleaks:allow
                "password_confirm": "test-password-123",  # gitleaks:allow
                "full_name": "New User",
                "company_name": "Co",
            },
            format="json",
        )
    assert res.status_code == 201


# ---------------------------------------------------------------------------
# Re-send (request) endpoint
# ---------------------------------------------------------------------------


def test_resend_requires_authentication(api, db):
    res = api.post("/api/v1/auth/email/verify/request/", format="json")
    assert res.status_code in (401, 403)


def test_resend_sends_email_for_unverified_user(api, alice):
    _login(api, alice)
    with patch("apps.accounts.views.send_email_verification") as mocked:
        res = api.post("/api/v1/auth/email/verify/request/", format="json")
    assert res.status_code == 200
    assert res.json()["verified"] is False
    mocked.assert_called_once()


def test_resend_noop_for_already_verified_user(api, alice):
    from django.utils import timezone

    alice.email_verified_at = timezone.now()
    alice.save()
    _login(api, alice)

    with patch("apps.accounts.views.send_email_verification") as mocked:
        res = api.post("/api/v1/auth/email/verify/request/", format="json")
    assert res.status_code == 200
    assert res.json()["verified"] is True
    mocked.assert_not_called()


# ---------------------------------------------------------------------------
# Confirm endpoint
# ---------------------------------------------------------------------------


def _capture_token(api, alice):
    """Trigger the resend flow and grab the token off the mocked send."""
    _login(api, alice)
    with patch("apps.accounts.views.send_email_verification") as mocked:
        api.post("/api/v1/auth/email/verify/request/", format="json")
    return mocked.call_args.args[1]


def test_confirm_with_valid_token_marks_email_verified(api, alice):
    token = _capture_token(api, alice)
    res = api.post(
        "/api/v1/auth/email/verify/confirm/",
        {"token": token},
        format="json",
    )
    assert res.status_code == 200, res.data
    body = res.json()
    assert body["verified"] is True
    assert "verified_at" in body
    alice.refresh_from_db()
    assert alice.email_verified_at is not None


def test_confirm_token_is_single_use(api, alice):
    """The vfp fingerprint binds email + email_verified_at; once
    verified, the same token won't validate again."""
    token = _capture_token(api, alice)
    api.post(
        "/api/v1/auth/email/verify/confirm/",
        {"token": token},
        format="json",
    )
    second = api.post(
        "/api/v1/auth/email/verify/confirm/",
        {"token": token},
        format="json",
    )
    assert second.status_code == 400


def test_confirm_with_wrong_purpose_token_is_rejected(api, alice):
    bad_token = make_token(
        {"uid": str(alice.id), "purpose": "password_reset", "vfp": "x" * 16}
    )
    res = api.post(
        "/api/v1/auth/email/verify/confirm/",
        {"token": bad_token},
        format="json",
    )
    assert res.status_code == 400


def test_confirm_with_garbage_token_is_rejected(api, db):
    res = api.post(
        "/api/v1/auth/email/verify/confirm/",
        {"token": "absolute.garbage"},
        format="json",
    )
    assert res.status_code == 400


def test_confirm_writes_audit_log(api, alice):
    """Successful verification records an audit row."""
    from apps.accounts.models import AuditLog

    token = _capture_token(api, alice)
    api.post(
        "/api/v1/auth/email/verify/confirm/",
        {"token": token},
        format="json",
    )
    assert AuditLog.objects.filter(
        performed_by=alice, action="email_verified"
    ).exists()


def test_user_serializer_exposes_email_verified_flag(api, alice):
    _login(api, alice)
    res = api.get("/api/v1/auth/me/")
    assert res.status_code == 200
    assert res.json()["email_verified"] is False

    from django.utils import timezone

    alice.email_verified_at = timezone.now()
    alice.save()
    res = api.get("/api/v1/auth/me/")
    assert res.json()["email_verified"] is True
