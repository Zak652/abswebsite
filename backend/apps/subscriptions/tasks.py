from celery import shared_task
from django.utils import timezone
from datetime import timedelta


@shared_task
def check_trial_expiry():
    """
    Daily task: send reminder emails and auto-expire trials.
    Should be scheduled via django-celery-beat to run daily at 08:00 UTC.
    """
    from apps.subscriptions.models import ArcplusTrialSignup
    from apps.notifications.service import (
        send_trial_day7_reminder,
        send_trial_day3_reminder,
        send_trial_expiry_notification,
    )

    now = timezone.now()

    # Day-7 reminders: trials that started exactly 7 days ago (within ±1 hour window)
    day7_start = now - timedelta(days=7, hours=1)
    day7_end = now - timedelta(days=7) + timedelta(hours=1)
    trials_day7 = ArcplusTrialSignup.objects.filter(
        status="active",
        trial_start__gte=day7_start,
        trial_start__lte=day7_end,
        reminder_sent_day7=False,
    )
    for trial in trials_day7:
        try:
            send_trial_day7_reminder(trial)
            trial.reminder_sent_day7 = True
            trial.save(update_fields=["reminder_sent_day7"])
        except Exception:
            pass

    # Day-3 reminders: trials expiring in 3 days (within ±1 hour window)
    day3_start = now + timedelta(days=3) - timedelta(hours=1)
    day3_end = now + timedelta(days=3) + timedelta(hours=1)
    trials_day3 = ArcplusTrialSignup.objects.filter(
        status="active",
        trial_expiry__gte=day3_start,
        trial_expiry__lte=day3_end,
        reminder_sent_day3=False,
    )
    for trial in trials_day3:
        try:
            send_trial_day3_reminder(trial)
            trial.reminder_sent_day3 = True
            trial.save(update_fields=["reminder_sent_day3"])
        except Exception:
            pass

    # Auto-expire overdue trials
    expired = ArcplusTrialSignup.objects.filter(
        status="active",
        trial_expiry__lte=now,
    )
    for trial in expired:
        try:
            trial.status = "expired"
            trial.save(update_fields=["status"])
            send_trial_expiry_notification(trial)
        except Exception:
            pass
