"""User-initiated trial cancellation (build guide § 3.8 B2)."""
from __future__ import annotations

from unittest.mock import patch

import pytest
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.subscriptions.models import ArcplusTrialSignup


@pytest.fixture
def alice(db):
    """Verified-email user — clears the IsEmailVerified gate on cancel."""
    from django.utils import timezone
    user = User.objects.create_user(
        email="alice@example.com",
        password="test-password-123",  # gitleaks:allow
        full_name="Alice",
        company_name="Co",
        role="client",
    )
    user.email_verified_at = timezone.now()
    user.save(update_fields=["email_verified_at"])
    return user


@pytest.fixture
def bob(db):
    from django.utils import timezone
    user = User.objects.create_user(
        email="bob@example.com",
        password="test-password-123",  # gitleaks:allow
        full_name="Bob",
        company_name="Co",
        role="client",
    )
    user.email_verified_at = timezone.now()
    user.save(update_fields=["email_verified_at"])
    return user


@pytest.fixture
def alices_trial(alice):
    return ArcplusTrialSignup.objects.create(
        user=alice,
        email="alice@example.com",
        company_name="Co",
        full_name="Alice",
        plan="growth",
        status="active",
    )


def _client(user):
    c = APIClient()
    c.force_authenticate(user=user)
    return c


@pytest.mark.django_db(transaction=True)
def test_owner_can_cancel_active_trial(alice, alices_trial):
    # `transaction=True` because send_trial_cancellation_notification fires
    # via transaction.on_commit, which the default test transaction rolls
    # back rather than committing.
    with patch("apps.subscriptions.views.send_trial_cancellation_notification") as mock_send:
        res = _client(alice).post(
            f"/api/v1/subscriptions/{alices_trial.id}/cancel/",
            {"reason": "Found a different tool"},
            format="json",
        )
    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "cancelled"
    assert body["cancelled_at"]
    alices_trial.refresh_from_db()
    assert alices_trial.status == "cancelled"
    assert alices_trial.cancelled_at is not None
    assert alices_trial.cancellation_reason == "Found a different tool"
    assert mock_send.call_count == 1


def test_anonymous_cannot_cancel(alices_trial):
    res = APIClient().post(
        f"/api/v1/subscriptions/{alices_trial.id}/cancel/",
        {},
        format="json",
    )
    assert res.status_code == 401


def test_non_owner_gets_404(bob, alices_trial):
    """Non-owners get 404 (not 403) so existence isn't leaked."""
    res = _client(bob).post(
        f"/api/v1/subscriptions/{alices_trial.id}/cancel/",
        {},
        format="json",
    )
    assert res.status_code == 404
    alices_trial.refresh_from_db()
    assert alices_trial.status == "active"  # untouched


def test_already_cancelled_returns_409(alice, alices_trial):
    alices_trial.status = "cancelled"
    alices_trial.save(update_fields=["status"])
    res = _client(alice).post(
        f"/api/v1/subscriptions/{alices_trial.id}/cancel/",
        {},
        format="json",
    )
    assert res.status_code == 409


@pytest.mark.parametrize("terminal", ["expired", "converted"])
def test_terminal_status_returns_409(alice, alices_trial, terminal):
    alices_trial.status = terminal
    alices_trial.save(update_fields=["status"])
    res = _client(alice).post(
        f"/api/v1/subscriptions/{alices_trial.id}/cancel/",
        {},
        format="json",
    )
    assert res.status_code == 409


def test_unknown_id_returns_404(alice):
    import uuid

    res = _client(alice).post(
        f"/api/v1/subscriptions/{uuid.uuid4()}/cancel/",
        {},
        format="json",
    )
    assert res.status_code == 404


def test_email_failure_does_not_break_cancel(alice, alices_trial):
    """If the cancellation email blows up, the cancel still succeeds."""
    with patch(
        "apps.subscriptions.views.send_trial_cancellation_notification",
        side_effect=RuntimeError("smtp down"),
    ):
        res = _client(alice).post(
            f"/api/v1/subscriptions/{alices_trial.id}/cancel/",
            {},
            format="json",
        )
    assert res.status_code == 200
    alices_trial.refresh_from_db()
    assert alices_trial.status == "cancelled"
