"""Periodic account-lifecycle tasks (build guide § 3.9, COMPLIANCE.md).

The retention sweep enforces the GDPR data-minimisation policy:
accounts that haven't been used in the configured retention window
are soft-deleted (PII anonymised, login disabled) automatically.

This is the same code path as the user-initiated GDPR delete — the
only thing different is *who* triggers it. Accounts already
soft-deleted are skipped, so a slow-running sweep can't double-
anonymise anyone.
"""
from __future__ import annotations

import logging
from datetime import timedelta

from celery import shared_task
from django.conf import settings
from django.utils import timezone

from apps.accounts.gdpr import delete_user

logger = logging.getLogger(__name__)


# Default retention window if no setting overrides it. 24 months
# matches the policy decision recorded for PR #22 — long enough that
# occasional users don't lose access; short enough to satisfy the
# data-minimisation argument under GDPR Article 5(1)(e).
DEFAULT_RETENTION_DAYS = 24 * 30  # ~24 months in days


@shared_task
def sweep_inactive_accounts() -> dict:
    """Soft-delete accounts inactive for the retention window.

    Reads ``settings.ACCOUNT_RETENTION_DAYS`` (defaulting to ~24
    months) to compute the cutoff. ``last_login`` is the source of
    truth for "active" — falls back to ``created_at`` for users who
    have never logged in (the User model uses an ``auto_now_add``
    ``created_at`` rather than Django's default ``date_joined``).

    Returns a small dict so the Celery result backend has a useful
    summary for monitoring (Sentry log scrub picks it up too).
    """
    from apps.accounts.models import User

    days = getattr(settings, "ACCOUNT_RETENTION_DAYS", DEFAULT_RETENTION_DAYS)
    cutoff = timezone.now() - timedelta(days=days)

    queryset = (
        User.objects.filter(deleted_at__isnull=True, is_active=True)
        # Skip staff/admin — those should be removed manually, not by a beat.
        .filter(role="client")
        .exclude(last_login__gt=cutoff)
        .exclude(last_login__isnull=True, created_at__gt=cutoff)
    )

    swept = 0
    failures = 0
    for user in queryset.iterator(chunk_size=100):
        try:
            delete_user(user)
            swept += 1
        except Exception as exc:  # pragma: no cover — defensive
            failures += 1
            logger.exception(
                "sweep_inactive_accounts failed to delete user %s: %s",
                user.id,
                exc,
            )

    summary = {"swept": swept, "failures": failures, "cutoff": cutoff.isoformat()}
    logger.info("sweep_inactive_accounts completed: %s", summary)
    return summary
