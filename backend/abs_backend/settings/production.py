from django.core.exceptions import ImproperlyConfigured

import environ

from .base import *  # noqa: F401, F403
from .base import SENTRY_DSN, SENTRY_ENVIRONMENT, SENTRY_TRACES_SAMPLE_RATE

env = environ.Env()


# --------------------------------------------------------------------------
# Sentry — error + performance tracing (decision 2026-05-08, see § 3.5).
# Only initialised in production so dev exceptions don't pollute the project.
# --------------------------------------------------------------------------
if SENTRY_DSN:
    import sentry_sdk
    from sentry_sdk.integrations.celery import CeleryIntegration
    from sentry_sdk.integrations.django import DjangoIntegration
    from sentry_sdk.integrations.logging import LoggingIntegration
    from sentry_sdk.integrations.redis import RedisIntegration

    sentry_sdk.init(
        dsn=SENTRY_DSN,
        integrations=[
            DjangoIntegration(),
            CeleryIntegration(monitor_beat_tasks=True),
            RedisIntegration(),
            # Capture WARNING+ as breadcrumbs, ERROR+ as events.
            LoggingIntegration(level="WARNING", event_level="ERROR"),
        ],
        environment=SENTRY_ENVIRONMENT,
        traces_sample_rate=SENTRY_TRACES_SAMPLE_RATE,
        # PII scrubbing — never ship request bodies or auth headers.
        send_default_pii=False,
        # Tag every event with the deploy SHA if the platform exposes it.
        release=env("SENTRY_RELEASE", default=None),
    )

DEBUG = False

ALLOWED_HOSTS = env.list("ALLOWED_HOSTS")

CORS_ALLOWED_ORIGINS = env.list("CORS_ALLOWED_ORIGINS")
CORS_ALLOW_CREDENTIALS = True

CSRF_TRUSTED_ORIGINS = env.list("CSRF_TRUSTED_ORIGINS")

# HTTPS / HSTS
SECURE_SSL_REDIRECT = True
SECURE_HSTS_SECONDS = 31536000  # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

# Content / framing
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = "same-origin"
X_FRAME_OPTIONS = "DENY"

# Cookies
SESSION_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = "Strict"
CSRF_COOKIE_SECURE = True
CSRF_COOKIE_HTTPONLY = True
CSRF_COOKIE_SAMESITE = "Strict"

# Required-secret gate. Fail closed on any unset / placeholder secret so a
# misconfigured deploy can't silently boot with broken auth or payments.
_PLACEHOLDERS = {"", "change-me", "changeme", "dev-jwt-secret", "REPLACE_ME"}

_REQUIRED_SECRETS = (
    "DJANGO_SECRET_KEY",
    "JWT_SECRET",
    "RESEND_API_KEY",
    "FLUTTERWAVE_SECRET_KEY",
    "FLUTTERWAVE_WEBHOOK_SECRET",
    "REVALIDATION_SECRET",
)
for _name in _REQUIRED_SECRETS:
    _val = env(_name, default="")
    if not _val or _val in _PLACEHOLDERS:
        raise ImproperlyConfigured(
            f"{_name} is required in production and must not be a placeholder.",
        )

if not ALLOWED_HOSTS:
    raise ImproperlyConfigured("ALLOWED_HOSTS must contain at least one host in production.")
if not CSRF_TRUSTED_ORIGINS:
    raise ImproperlyConfigured("CSRF_TRUSTED_ORIGINS must be set in production.")
if not CORS_ALLOWED_ORIGINS:
    raise ImproperlyConfigured("CORS_ALLOWED_ORIGINS must be set in production.")
