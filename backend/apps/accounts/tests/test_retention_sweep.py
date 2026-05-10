"""Retention sweep beat task (build guide § 3.9 / COMPLIANCE.md).

The Celery beat schedule runs ``sweep_inactive_accounts`` daily.
Tests here pin the policy:

  - clients past the retention window are soft-deleted,
  - clients inside the window are untouched,
  - already-deleted accounts are skipped,
  - admin/staff accounts are NEVER swept (deletion of those is a
    manual operation),
  - users who never logged in are evaluated against ``date_joined``.

Behavioural correctness of ``delete_user`` itself is covered by
``test_gdpr.py`` — these tests assert the *selection* logic.
"""
from __future__ import annotations

from datetime import timedelta
from unittest.mock import patch

import pytest
from django.utils import timezone

from apps.accounts.models import User
from apps.accounts.tasks import sweep_inactive_accounts


@pytest.fixture(autouse=True)
def _short_retention(settings):
    """Use a small retention window for the test suite so we can build
    fixtures with reasonable date offsets."""
    settings.ACCOUNT_RETENTION_DAYS = 30


def _client(email: str, last_login=None, days_joined_ago: int = 60) -> User:
    user = User.objects.create_user(
        email=email,
        password="x" * 16,  # gitleaks:allow
        full_name="Client",
        company_name="Co",
        role="client",
    )
    # The User model uses ``created_at`` (auto_now_add) rather than
    # Django's default ``date_joined``. Override it after-the-fact so
    # we can simulate accounts created longer ago than the test runs.
    user.created_at = timezone.now() - timedelta(days=days_joined_ago)
    user.last_login = last_login
    user.save(update_fields=["created_at", "last_login"])
    return user


@pytest.mark.django_db
def test_sweep_deletes_inactive_clients_outside_retention():
    stale = _client(
        "stale@example.com",
        last_login=timezone.now() - timedelta(days=120),
    )
    summary = sweep_inactive_accounts()
    assert summary["swept"] == 1
    stale.refresh_from_db()
    assert stale.deleted_at is not None
    assert stale.is_active is False
    # Email anonymised by delete_user.
    assert stale.email != "stale@example.com"


@pytest.mark.django_db
def test_sweep_keeps_recently_active_clients():
    fresh = _client(
        "fresh@example.com",
        last_login=timezone.now() - timedelta(days=10),
    )
    summary = sweep_inactive_accounts()
    assert summary["swept"] == 0
    fresh.refresh_from_db()
    assert fresh.deleted_at is None
    assert fresh.is_active is True


@pytest.mark.django_db
def test_sweep_uses_date_joined_when_user_never_logged_in():
    """Accounts that never logged in but were created long ago get
    swept; recent never-logged-in accounts don't."""
    old_pristine = _client(
        "old-pristine@example.com",
        last_login=None,
        days_joined_ago=120,
    )
    new_pristine = _client(
        "new-pristine@example.com",
        last_login=None,
        days_joined_ago=5,
    )
    summary = sweep_inactive_accounts()
    assert summary["swept"] == 1
    old_pristine.refresh_from_db()
    new_pristine.refresh_from_db()
    assert old_pristine.deleted_at is not None
    assert new_pristine.deleted_at is None


@pytest.mark.django_db
def test_sweep_skips_admin_accounts():
    """Admin accounts must NEVER be auto-deleted by the sweep —
    removal of those rows is an explicit operational decision."""
    admin = User.objects.create_user(
        email="admin@example.com",
        password="x" * 16,  # gitleaks:allow
        full_name="Admin",
        company_name="Co",
        role="admin",
    )
    admin.last_login = timezone.now() - timedelta(days=365)
    admin.save(update_fields=["last_login"])

    summary = sweep_inactive_accounts()
    assert summary["swept"] == 0
    admin.refresh_from_db()
    assert admin.deleted_at is None


@pytest.mark.django_db
def test_sweep_skips_already_deleted_accounts():
    already = _client(
        "already@example.com",
        last_login=timezone.now() - timedelta(days=120),
    )
    already.deleted_at = timezone.now()
    already.is_active = False
    already.save(update_fields=["deleted_at", "is_active"])

    summary = sweep_inactive_accounts()
    assert summary["swept"] == 0


@pytest.mark.django_db
def test_sweep_continues_past_individual_failure():
    """A delete_user exception on one row must not abort the whole
    sweep — the remaining inactive users still get processed."""
    inactive_at = timezone.now() - timedelta(days=120)
    a = _client("a@example.com", last_login=inactive_at)
    b = _client("b@example.com", last_login=inactive_at)

    real_delete = "apps.accounts.tasks.delete_user"
    call_count = {"n": 0}

    def flaky_delete(user, **kwargs):
        call_count["n"] += 1
        if user.pk == a.pk:
            raise RuntimeError("synthetic")
        from apps.accounts.gdpr import delete_user as real
        return real(user, **kwargs)

    with patch(real_delete, side_effect=flaky_delete):
        summary = sweep_inactive_accounts()

    assert summary["failures"] == 1
    assert summary["swept"] == 1
    a.refresh_from_db()
    b.refresh_from_db()
    # `a` raised → still active. `b` was deleted normally.
    assert a.deleted_at is None
    assert b.deleted_at is not None
