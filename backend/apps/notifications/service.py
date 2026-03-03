from django.conf import settings
from django.template.loader import render_to_string

try:
    import resend

    resend.api_key = settings.RESEND_API_KEY
    RESEND_AVAILABLE = bool(settings.RESEND_API_KEY)
except ImportError:
    RESEND_AVAILABLE = False


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
    html = render_to_string(
        "rfq_acknowledgment.html",
        {
            "company_name": rfq_submission.company_name,
            "ref": ref,
            "needs_hardware": rfq_submission.needs_hardware,
            "needs_software": rfq_submission.needs_software,
            "needs_services": rfq_submission.needs_services,
            "asset_count_range": rfq_submission.asset_count_range,
        },
    )
    _send(
        to=rfq_submission.email,
        subject=f"[ABS] Quote Request Received — Ref #{ref}",
        cc=[settings.RESEND_SALES_EMAIL],
        html=html,
    )


def send_trial_signup_notification(signup):
    """
    Triggered: on POST /api/v1/subscriptions/trial/
    Sends two emails: user confirmation + admin action alert
    """
    user_html = render_to_string("trial_signup_user.html", {"signup": signup})
    _send(
        to=signup.email,
        subject="Your Arcplus trial request is being processed",
        html=user_html,
    )

    admin_html = render_to_string("trial_signup_admin.html", {"signup": signup})
    _send(
        to=settings.RESEND_ADMIN_EMAIL,
        subject=f"[ACTION REQUIRED] New Arcplus Trial — {signup.company_name} ({signup.get_plan_display()})",
        html=admin_html,
    )


def send_training_confirmation(registration):
    """
    Triggered: after Flutterwave webhook confirms payment
    To: registrant
    """
    html = render_to_string(
        "training_confirmation.html",
        {
            "registration": registration,
            "session": registration.session,
        },
    )
    _send(
        to=registration.email,
        subject=f"Training Registration Confirmed — {registration.session.title}",
        html=html,
    )
