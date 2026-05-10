"""Email-verified gating across sensitive endpoints (build guide § 3.8).

Backs the threat model documented in
``apps.accounts.permissions.IsEmailVerified``: an authenticated but
unverified user MUST NOT be able to delete the account, cancel a trial,
or trigger trial provisioning under their identity. The same user
*should* still be able to read their profile, log in, log out, and
request email verification (the very thing that unblocks them).

Each test creates a user with ``email_verified_at = None`` and asserts
the rejection comes back as ``403`` with a curated message that
``parseApiError`` on the frontend will render verbatim.
"""
from __future__ import annotations

from unittest.mock import patch

import pytest
from django.utils import timezone
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.subscriptions.models import ArcplusTrialSignup


@pytest.fixture
def unverified(db):
    return User.objects.create_user(
        email="unverified@example.com",
        password="unverified-password-1",  # gitleaks:allow
        full_name="Unverified User",
        company_name="Co",
        role="client",
    )


@pytest.fixture
def verified(db):
    user = User.objects.create_user(
        email="verified@example.com",
        password="verified-password-1",  # gitleaks:allow
        full_name="Verified User",
        company_name="Co",
        role="client",
    )
    user.email_verified_at = timezone.now()
    user.save(update_fields=["email_verified_at"])
    return user


@pytest.fixture
def api():
    return APIClient()


# ---------------------------------------------------------------------------
# /auth/me/delete/
# ---------------------------------------------------------------------------


def test_delete_rejects_unverified_user(api, unverified):
    api.force_authenticate(user=unverified)
    res = api.post("/api/v1/auth/me/delete/", {"confirm": True}, format="json")
    assert res.status_code == 403, res.data
    assert "verify" in (res.data.get("detail") or "").lower()


def test_delete_allows_verified_user(api, verified):
    api.force_authenticate(user=verified)
    with patch("apps.accounts.views.send_account_deletion_confirmation"):
        res = api.post("/api/v1/auth/me/delete/", {"confirm": True}, format="json")
    # 200 happy-path; soft-delete is exercised in test_gdpr.py
    assert res.status_code == 200, res.data


# ---------------------------------------------------------------------------
# /subscriptions/trial-signups/{id}/cancel/
# ---------------------------------------------------------------------------


def test_cancel_rejects_unverified_user(api, unverified):
    trial = ArcplusTrialSignup.objects.create(
        user=unverified,
        email=unverified.email,
        company_name="Co",
        full_name="Unverified User",
        plan="growth",
        status="active",
    )
    api.force_authenticate(user=unverified)
    res = api.post(
        f"/api/v1/subscriptions/{trial.id}/cancel/", {}, format="json",
    )
    assert res.status_code == 403, res.data
    assert "verify" in (res.data.get("detail") or "").lower()


# ---------------------------------------------------------------------------
# /subscriptions/trial-signups/  (POST, AnonymousOrEmailVerified)
# ---------------------------------------------------------------------------


def _trial_payload():
    return {
        "email": "buyer@acme.com",
        "company_name": "Acme",
        "full_name": "Buyer",
        "plan": "growth",
        "asset_count_estimate": "1-1000",
    }


def test_trial_signup_anonymous_still_allowed(api, db):
    """Marketing-form flow stays open — the gate is only for auth'd users."""
    res = api.post(
        "/api/v1/subscriptions/trial/", _trial_payload(), format="json",
    )
    assert res.status_code == 201, res.data


def test_trial_signup_rejects_authenticated_unverified(api, unverified):
    api.force_authenticate(user=unverified)
    res = api.post(
        "/api/v1/subscriptions/trial/", _trial_payload(), format="json",
    )
    assert res.status_code == 403, res.data
    assert "verify" in (res.data.get("detail") or "").lower()


def test_trial_signup_allows_authenticated_verified(api, verified):
    api.force_authenticate(user=verified)
    res = api.post(
        "/api/v1/subscriptions/trial/", _trial_payload(), format="json",
    )
    assert res.status_code == 201, res.data


# ---------------------------------------------------------------------------
# Read-side endpoints stay open for unverified users
# ---------------------------------------------------------------------------


def test_me_endpoint_does_not_require_verification(api, unverified):
    """Reading your own profile must work even before verification — it's
    how the frontend discovers the user is unverified in the first place."""
    api.force_authenticate(user=unverified)
    res = api.get("/api/v1/auth/me/")
    assert res.status_code == 200
    assert res.data["email_verified"] is False


def test_email_verify_request_does_not_require_verification(api, unverified):
    """The path that *unblocks* you obviously can't be locked behind
    verification — that would be a chicken-and-egg trap."""
    api.force_authenticate(user=unverified)
    with patch("apps.accounts.views.send_email_verification"):
        res = api.post("/api/v1/auth/email/verify/request/")
    assert res.status_code == 200, res.data
