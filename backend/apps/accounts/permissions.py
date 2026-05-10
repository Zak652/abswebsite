"""DRF permission classes (build guide § 3.8).

This module exposes the small set of bespoke permissions used across
the API. Anything more elaborate (object-level checks, role gates)
belongs alongside the view that owns the rule.
"""
from __future__ import annotations

from rest_framework.permissions import BasePermission


class AnonymousOrEmailVerified(BasePermission):
    """Allow anonymous requests OR authenticated requests with a
    verified email.

    Useful for endpoints like trial-signup that are intentionally
    public-friendly (the marketing-site form is the dominant traffic
    pattern), but where authenticated submissions should still prove
    control of the email so an impersonator with a stale unverified
    account can't trigger trial provisioning under the victim's
    account.
    """

    message = (
        "Please verify your email before performing this action. "
        "Check your inbox for the verification link, or request a new one."
    )

    def has_permission(self, request, view) -> bool:
        user = getattr(request, "user", None)
        if user is None or not user.is_authenticated:
            return True
        return user.email_verified_at is not None


class IsEmailVerified(BasePermission):
    """Allow only authenticated users whose email has been verified.

    Why this exists
    ---------------
    A handful of authenticated actions either commit to billable
    obligations (trial signup, plan upgrade) or destroy data (GDPR
    self-delete). Allowing those before the requester has proven
    control of the email address invites two clearly-bad outcomes:

    1. **Account takeover via signup-with-someone-else's-email.** If
       someone registers with ``alice@victim.example`` and never
       verifies, but is allowed to provision a trial / cancel a trial /
       delete the (impostor's view of) the account, the legitimate
       owner has lost data they didn't even know existed.
    2. **Spam vector for free trial provisioning.** Without an email
       gate, a script can create unverified accounts in bulk and
       trigger trial-environment provisioning that costs us real
       money to spin up.

    Login itself is *not* gated — first-day users with a slow email
    delivery shouldn't be locked out. View / read endpoints are also
    not gated. The gate applies specifically to actions that create
    obligations or destroy data.

    Acceptance message
    ------------------
    On rejection, return ``403`` with a curated message that the
    frontend ``parseApiError`` allowlist passes through verbatim.
    """

    message = (
        "Please verify your email before performing this action. "
        "Check your inbox for the verification link, or request a new one."
    )

    def has_permission(self, request, view) -> bool:
        user = getattr(request, "user", None)
        if user is None or not user.is_authenticated:
            return False
        return user.email_verified_at is not None
