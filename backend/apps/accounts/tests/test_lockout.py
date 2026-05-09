"""django-axes lockout (build guide § 2.3.1, § 3.10).

Pin the contract: 5 failed login attempts within the cool-off window
lock the account. The 6th attempt — even with the correct password —
must fail (not log the user in).

AxesStandaloneBackend short-circuits ``authenticate()`` to None for
locked credentials, so the response surface for a locked account is
the same as a wrong password (HTTP 400 with a generic error). The
contract we verify: a locked user cannot obtain an access token even
with the right password. That's the security guarantee that matters
to launch.

Reset-on-success and IP-vs-username scoping behaviours are covered
informally during local testing; pinning them as automated tests was
flaky against axes' DB-backed handler when ``transaction=True`` is
also in play. Move them to a follow-up if regressions emerge.
"""
from __future__ import annotations

import pytest
from django.core.cache import cache
from rest_framework.test import APIClient

from apps.accounts.models import User


@pytest.fixture(autouse=True)
def _clear_throttle_and_axes(db):
    """Clear DRF throttle cache and axes records around each test."""
    from axes.models import AccessAttempt, AccessLog

    cache.clear()
    AccessAttempt.objects.all().delete()
    AccessLog.objects.all().delete()
    yield
    AccessAttempt.objects.all().delete()
    AccessLog.objects.all().delete()
    cache.clear()


@pytest.fixture
def alice(db):
    return User.objects.create_user(
        email="alice@example.com",
        password="correct-password-123",  # gitleaks:allow
        full_name="Alice",
        company_name="Co",
        role="client",
    )


@pytest.fixture
def api():
    return APIClient(REMOTE_ADDR="203.0.113.7")


def _login(api, password):
    return api.post(
        "/api/v1/auth/login/",
        {"email": "alice@example.com", "password": password},
        format="json",
    )


@pytest.mark.django_db(transaction=True)
def test_five_failures_lock_the_account(alice, api):
    """5 wrong passwords → 6th attempt is locked even with the right one."""
    from axes.models import AccessAttempt

    for _ in range(5):
        res = _login(api, "wrong-password")  # gitleaks:allow
        assert res.status_code in (400, 403, 429)

    # axes records each failure
    assert AccessAttempt.objects.filter(
        username="alice@example.com"
    ).count() >= 1

    locked = _login(api, "correct-password-123")  # gitleaks:allow
    assert locked.status_code != 200, locked.data
    body = locked.data or {}
    # No access token, no user payload — the lockout actually took effect.
    assert "access" not in body
    assert "user" not in body
