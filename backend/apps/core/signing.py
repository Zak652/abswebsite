"""One-shot signed-token helpers for email links.

Why this exists
---------------
Password reset and email verification both need a token that:
- carries a small payload (the user id and a purpose tag),
- expires after a known TTL,
- can't be forged or tampered with by the recipient,
- becomes single-use after a state change (handled by including a
  rotating field — the user's password hash for resets, the
  ``email_verified_at`` timestamp for verifications — in the signed
  payload, so once the side-effect happens the token no longer
  validates against current state).

We use Django's built-in :class:`django.core.signing.TimestampSigner`
rather than rolling our own. The signer keys off ``SECRET_KEY``, so
rotating that invalidates all outstanding links — desirable on a
suspected compromise.
"""

from __future__ import annotations

from typing import Any

from django.core.signing import BadSignature, SignatureExpired, TimestampSigner


class InvalidToken(Exception):
    """Raised when a token is malformed, tampered, expired, or replayed."""


_SIGNER = TimestampSigner(salt="apps.core.signing")


def make_token(payload: dict[str, Any]) -> str:
    """Sign ``payload`` and return a URL-safe token string.

    Payload fields are serialized verbatim into the token, so keep them
    short. Caller is responsible for choosing a ``purpose`` field that
    distinguishes use-cases (e.g. ``"password_reset"``,
    ``"email_verify"``) — :func:`read_token` does not enforce purpose
    matching, that's the caller's job.
    """
    import json

    raw = json.dumps(payload, separators=(",", ":"), sort_keys=True)
    return _SIGNER.sign(raw)


def read_token(token: str, max_age_seconds: int) -> dict[str, Any]:
    """Verify ``token`` and return the original payload.

    Raises :class:`InvalidToken` for any failure (bad signature, expired,
    not JSON). The exception is intentionally generic so callers don't
    leak which mode of failure occurred to end users — that information
    only goes to logs.
    """
    import json

    try:
        raw = _SIGNER.unsign(token, max_age=max_age_seconds)
    except SignatureExpired as exc:
        raise InvalidToken("expired") from exc
    except BadSignature as exc:
        raise InvalidToken("bad_signature") from exc

    try:
        return json.loads(raw)
    except ValueError as exc:
        raise InvalidToken("malformed_payload") from exc
