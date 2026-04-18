import logging

from django.conf import settings
from django.template import Template, Context
from django.template.loader import render_to_string

logger = logging.getLogger(__name__)

try:
    import resend

    resend.api_key = settings.RESEND_API_KEY
    RESEND_AVAILABLE = bool(settings.RESEND_API_KEY)
except ImportError:
    RESEND_AVAILABLE = False


def _render_db_template(trigger_type, context_dict):
    """
    Try to render a published EmailTemplate from the CMS database.
    Returns (subject, html) or None if no template found / error.
    """
    try:
        from apps.cms.models import EmailTemplate

        tpl = (
            EmailTemplate.objects.filter(
                trigger_type=trigger_type,
                status="published",
            )
            .order_by("-published_at")
            .first()
        )
        if not tpl:
            return None
        subject = Template(tpl.subject).render(Context(context_dict))
        html = Template(tpl.body_html).render(Context(context_dict))
        return subject, html
    except Exception:
        logger.exception("Failed to render DB email template for %s", trigger_type)
        return None


def _send(to, subject, html, cc=None):
    """Send an email. Falls back to console logging in dev if Resend is not configured."""
    if not RESEND_AVAILABLE:
        print(f"[EMAIL DEV] To: {to} | CC: {cc} | Subject: {subject}")
        return

    params = {
        "from": settings.RESEND_FROM_EMAIL,
        "to": to if isinstance(to, list) else [to],
        "subject": subject,
        "html": html,
    }
    if cc:
        params["cc"] = cc if isinstance(cc, list) else [cc]

    resend.Emails.send(params)


def send_rfq_acknowledgment(rfq_submission):
    """
    Triggered: immediately on POST /api/v1/rfq/
    To: submitter + CC sales team
    """
    ref = str(rfq_submission.id)[:8].upper()
    ctx = {
        "company_name": rfq_submission.company_name,
        "ref": ref,
        "needs_hardware": rfq_submission.needs_hardware,
        "needs_software": rfq_submission.needs_software,
        "needs_services": rfq_submission.needs_services,
        "asset_count_range": rfq_submission.asset_count_range,
    }

    db_result = _render_db_template("rfq_acknowledgment", ctx)
    if db_result:
        subject, html = db_result
    else:
        html = render_to_string("rfq_acknowledgment.html", ctx)
        subject = f"[ABS] Quote Request Received — Ref #{ref}"

    _send(
        to=rfq_submission.email,
        subject=subject,
        cc=[settings.RESEND_SALES_EMAIL],
        html=html,
    )


def send_trial_signup_notification(signup):
    """
    Triggered: on POST /api/v1/subscriptions/trial/
    Sends two emails: user confirmation + admin action alert
    """
    ctx = {"signup": signup}

    db_result = _render_db_template("trial_signup", ctx)
    if db_result:
        subject, user_html = db_result
    else:
        user_html = render_to_string("trial_signup_user.html", ctx)
        subject = "Your Arcplus trial request is being processed"
    _send(to=signup.email, subject=subject, html=user_html)

    admin_html = render_to_string("trial_signup_admin.html", ctx)
    _send(
        to=settings.RESEND_ADMIN_EMAIL,
        subject=f"[ACTION REQUIRED] New Arcplus Trial — {signup.company_name} ({signup.get_plan_display()})",
        html=admin_html,
    )


def send_service_request_notification(service_request):
    """
    Triggered: on POST /api/v1/services/requests/
    Sends two emails: user confirmation + admin action alert
    """
    ref = str(service_request.id)[:8].upper()
    service_type_display = service_request.get_service_type_display()
    ctx = {
        "service_request": service_request,
        "ref": ref,
        "service_type_display": service_type_display,
    }

    db_result = _render_db_template("service_request", ctx)
    if db_result:
        subject, user_html = db_result
    else:
        user_html = render_to_string("service_request_user.html", ctx)
        subject = (
            f"[ABS] Service Request Received — {service_type_display} (Ref #{ref})"
        )
    _send(to=service_request.email, subject=subject, html=user_html)

    admin_html = render_to_string(
        "service_request_admin.html",
        ctx,
    )
    _send(
        to=settings.RESEND_ADMIN_EMAIL,
        subject=f"[ACTION REQUIRED] New Service Request — {service_type_display} from {service_request.company_name}",
        html=admin_html,
    )


def send_trial_day7_reminder(signup):
    """Triggered: 7 days after trial starts."""
    ctx = {"signup": signup}
    db_result = _render_db_template("trial_day7_reminder", ctx)
    if db_result:
        subject, html = db_result
    else:
        html = render_to_string("trial_day7_reminder.html", ctx)
        subject = "Your Arcplus trial expires in 7 days"
    _send(to=signup.email, subject=subject, html=html)


def send_trial_day3_reminder(signup):
    """Triggered: 3 days before trial expiry."""
    ctx = {"signup": signup}
    db_result = _render_db_template("trial_day3_reminder", ctx)
    if db_result:
        subject, html = db_result
    else:
        html = render_to_string("trial_day3_reminder.html", ctx)
        subject = "Your Arcplus trial expires in 3 days — upgrade now"
    _send(to=signup.email, subject=subject, html=html)


def send_trial_expiry_notification(signup):
    """Triggered: when trial expires."""
    ctx = {"signup": signup}
    db_result = _render_db_template("trial_expiry", ctx)
    if db_result:
        subject, html = db_result
    else:
        html = render_to_string("trial_expiry.html", ctx)
        subject = "Your Arcplus trial has ended"
    _send(to=signup.email, subject=subject, html=html)


def send_training_confirmation(registration):
    """
    Triggered: after Flutterwave webhook confirms payment
    To: registrant
    """
    ctx = {
        "registration": registration,
        "session": registration.session,
    }
    db_result = _render_db_template("training_confirmation", ctx)
    if db_result:
        subject, html = db_result
    else:
        html = render_to_string("training_confirmation.html", ctx)
        subject = f"Training Registration Confirmed — {registration.session.title}"
    _send(to=registration.email, subject=subject, html=html)
