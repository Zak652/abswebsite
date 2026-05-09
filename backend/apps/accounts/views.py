import hashlib
import jwt
import logging
from datetime import datetime, timedelta, timezone

from django.conf import settings
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import OutstandingToken, RefreshToken

from apps.core.signing import InvalidToken as InvalidSignedToken
from apps.core.signing import make_token, read_token
from apps.notifications.service import (
    send_email_verification,
    send_password_reset_email,
)

from .models import AuditLog, User
from .serializers import (
    EmailVerifyConfirmSerializer,
    LoginSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    RegisterSerializer,
    UserSerializer,
)


logger = logging.getLogger(__name__)

PASSWORD_RESET_PURPOSE = "password_reset"
PASSWORD_RESET_TTL_SECONDS = 60 * 60  # 1 hour

EMAIL_VERIFY_PURPOSE = "email_verify"
EMAIL_VERIFY_TTL_SECONDS = 24 * 60 * 60  # 24 hours


def _password_hash_fingerprint(user: User) -> str:
    """Short stable fingerprint of the user's password hash.

    Embedded in reset tokens so a successful reset (which rotates the
    hash) automatically invalidates any other outstanding link for the
    same user. Truncated SHA-256 keeps the token short while preserving
    enough entropy that a reused/forged token can't collide.
    """
    digest = hashlib.sha256(user.password.encode("utf-8")).hexdigest()
    return digest[:16]


def _make_email_verify_token(user: User) -> str:
    """Sign a single-use email verification token.

    The ``vfp`` field is a fingerprint of ``email + email_verified_at``.
    Once a verification succeeds, ``email_verified_at`` flips from None
    to a timestamp and the same token can no longer be redeemed —
    enforces single-use without a separate token table.
    """
    raw = f"{user.email}|{user.email_verified_at or ''}".encode("utf-8")
    vfp = hashlib.sha256(raw).hexdigest()[:16]
    return make_token(
        {
            "uid": str(user.id),
            "purpose": EMAIL_VERIFY_PURPOSE,
            "vfp": vfp,
        }
    )


SESSION_COOKIE_NAME = "abs_session"
REFRESH_COOKIE_NAME = "abs_refresh"
REFRESH_COOKIE_PATH = "/api/v1/auth/"


def _make_session_jwt(user):
    """Short-lived JWT for the abs_session cookie. Read by the Next.js
    middleware (src/middleware.ts) to gate /admin-portal/* and /portal/*."""
    payload = {
        "user_id": str(user.id),
        "role": user.role,
        "exp": datetime.now(tz=timezone.utc) + timedelta(days=7),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm="HS256")


def _set_session_cookie(response, user):
    response.set_cookie(
        SESSION_COOKIE_NAME,
        _make_session_jwt(user),
        max_age=7 * 24 * 3600,
        httponly=True,
        samesite="Strict",
        secure=not settings.DEBUG,
    )


def _set_refresh_cookie(response, refresh_token: str):
    response.set_cookie(
        REFRESH_COOKIE_NAME,
        refresh_token,
        max_age=7 * 24 * 3600,
        httponly=True,
        samesite="Lax",
        secure=not settings.DEBUG,
        path=REFRESH_COOKIE_PATH,
    )


def _clear_auth_cookies(response):
    response.delete_cookie(SESSION_COOKIE_NAME)
    response.delete_cookie(REFRESH_COOKIE_NAME, path=REFRESH_COOKIE_PATH)


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "register"

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        try:
            send_email_verification(user, _make_email_verify_token(user))
        except Exception:
            logger.exception(
                "send_email_verification failed for user %s on register", user.id
            )

        refresh = RefreshToken.for_user(user)
        response = Response(
            {
                "user": UserSerializer(user).data,
                "access": str(refresh.access_token),
            },
            status=status.HTTP_201_CREATED,
        )
        _set_session_cookie(response, user)
        _set_refresh_cookie(response, str(refresh))
        return response


class LoginView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "login"

    def post(self, request):
        serializer = LoginSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]

        refresh = RefreshToken.for_user(user)
        response = Response(
            {
                "user": UserSerializer(user).data,
                "access": str(refresh.access_token),
            }
        )
        _set_session_cookie(response, user)
        _set_refresh_cookie(response, str(refresh))
        return response


class CookieTokenRefreshView(APIView):
    """Read the refresh token from the HttpOnly cookie, rotate it, and return
    a fresh access token. The refresh token is never exposed to JavaScript."""

    permission_classes = [AllowAny]

    def post(self, request):
        raw = request.COOKIES.get(REFRESH_COOKIE_NAME)
        if not raw:
            return Response(
                {"detail": "No refresh cookie."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        try:
            refresh = RefreshToken(raw)
        except TokenError as exc:
            raise InvalidToken(exc.args[0]) from exc

        access = str(refresh.access_token)
        # Rotation: blacklist old, issue new (matches SIMPLE_JWT.ROTATE_REFRESH_TOKENS)
        if getattr(settings, "SIMPLE_JWT", {}).get("ROTATE_REFRESH_TOKENS", False):
            try:
                refresh.blacklist()
            except Exception:
                pass
            refresh.set_jti()
            refresh.set_exp()
            refresh.set_iat()

        response = Response({"access": access})
        _set_refresh_cookie(response, str(refresh))
        return response


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        raw = request.COOKIES.get(REFRESH_COOKIE_NAME) or request.data.get("refresh")
        if raw:
            try:
                RefreshToken(raw).blacklist()
            except Exception:
                pass

        response = Response({"detail": "Logged out successfully."})
        _clear_auth_cookies(response)
        return response


class MeView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class PasswordResetRequestView(APIView):
    """Issue a one-shot password-reset link to a user's email.

    The response is intentionally identical whether or not the address
    maps to an account, so this endpoint can't be used to enumerate
    registered users. The actual decision (send vs. silently no-op)
    happens server-side after we've already returned 200.

    Rate-limited via ScopedRateThrottle (5/hour per IP) — the throttle
    rate is configured in settings under the ``password_reset`` scope.
    """

    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "password_reset"

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"].lower().strip()

        # Best-effort email send. Any failure (unknown user, email error)
        # logs but never changes the response shape.
        try:
            user = User.objects.get(email__iexact=email, is_active=True)
        except User.DoesNotExist:
            logger.info("password_reset_requested for unknown email")
            return self._neutral_response()

        token = make_token(
            {
                "uid": str(user.id),
                "purpose": PASSWORD_RESET_PURPOSE,
                "fp": _password_hash_fingerprint(user),
            }
        )

        try:
            send_password_reset_email(user, token)
        except Exception:
            logger.exception(
                "send_password_reset_email failed for user %s", user.id
            )

        return self._neutral_response()

    @staticmethod
    def _neutral_response():
        return Response(
            {
                "detail": (
                    "If an account exists for that address, a reset link "
                    "has been sent."
                )
            },
            status=status.HTTP_200_OK,
        )


class PasswordResetConfirmView(APIView):
    """Consume a password-reset token and set a new password.

    On success: rotates the password (which invalidates the token via
    the embedded fingerprint), blacklists every outstanding refresh
    token for the user (forcing re-login on all devices), and clears
    auth cookies on the response.
    """

    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "password_reset"

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        token = serializer.validated_data["token"]
        new_password = serializer.validated_data["new_password"]

        try:
            payload = read_token(token, max_age_seconds=PASSWORD_RESET_TTL_SECONDS)
        except InvalidSignedToken:
            return Response(
                {"detail": "This reset link is invalid or has expired."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if payload.get("purpose") != PASSWORD_RESET_PURPOSE:
            return Response(
                {"detail": "This reset link is invalid or has expired."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user = User.objects.get(pk=payload["uid"], is_active=True)
        except (User.DoesNotExist, KeyError, ValueError):
            return Response(
                {"detail": "This reset link is invalid or has expired."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if payload.get("fp") != _password_hash_fingerprint(user):
            return Response(
                {"detail": "This reset link has already been used."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(new_password)
        user.save(update_fields=["password", "updated_at"])

        # Blacklist every outstanding refresh token for the user so any
        # active session on another device gets a 401 on next refresh.
        try:
            for outstanding in OutstandingToken.objects.filter(user=user):
                try:
                    RefreshToken(outstanding.token).blacklist()
                except (TokenError, Exception):
                    continue
        except Exception:
            logger.exception(
                "blacklist_after_password_reset failed for user %s", user.id
            )

        response = Response(
            {"detail": "Password has been reset. Please log in."},
            status=status.HTTP_200_OK,
        )
        _clear_auth_cookies(response)
        return response


class EmailVerifyRequestView(APIView):
    """Re-send the email-verification link for the authenticated user.

    The very first link is sent automatically by ``RegisterView.create``;
    this endpoint exists so a user who lost the email (spam folder,
    expired link) can ask for a fresh one. Already-verified accounts
    return 200 with a noop response so an idempotent retry from the
    frontend is safe.
    """

    permission_classes = [IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "email_verify_request"

    def post(self, request):
        user = request.user
        if user.email_verified_at is not None:
            return Response(
                {"detail": "Email is already verified.", "verified": True},
                status=status.HTTP_200_OK,
            )

        try:
            send_email_verification(user, _make_email_verify_token(user))
        except Exception:
            logger.exception(
                "send_email_verification failed for user %s", user.id
            )

        return Response(
            {
                "detail": "A verification email has been sent.",
                "verified": False,
            },
            status=status.HTTP_200_OK,
        )


class EmailVerifyConfirmView(APIView):
    """Consume an email-verification token and mark the email verified.

    Idempotent for the originally-issued user — replaying a stale token
    after the email has already been verified is a 400 (the embedded
    ``vfp`` fingerprint changes when ``email_verified_at`` flips), so
    the frontend should treat 400 as "this link was already used or has
    expired" and offer a re-send button.
    """

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = EmailVerifyConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        token = serializer.validated_data["token"]

        try:
            payload = read_token(token, max_age_seconds=EMAIL_VERIFY_TTL_SECONDS)
        except InvalidSignedToken:
            return Response(
                {"detail": "This verification link is invalid or has expired."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if payload.get("purpose") != EMAIL_VERIFY_PURPOSE:
            return Response(
                {"detail": "This verification link is invalid or has expired."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user = User.objects.get(pk=payload["uid"], is_active=True)
        except (User.DoesNotExist, KeyError, ValueError):
            return Response(
                {"detail": "This verification link is invalid or has expired."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Verify the fingerprint matches current state — guards against
        # a stale token being replayed after the user's email changed
        # or after a previous verification already flipped the flag.
        raw = f"{user.email}|{user.email_verified_at or ''}".encode("utf-8")
        expected_vfp = hashlib.sha256(raw).hexdigest()[:16]
        if payload.get("vfp") != expected_vfp:
            return Response(
                {"detail": "This verification link has already been used."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from django.utils import timezone

        user.email_verified_at = timezone.now()
        user.save(update_fields=["email_verified_at", "updated_at"])

        AuditLog.objects.create(
            performed_by=user,
            action="email_verified",
            resource_type="User",
            resource_id=str(user.id),
            changes={"email_verified_at": user.email_verified_at.isoformat()},
        )

        return Response(
            {
                "detail": "Email verified.",
                "verified": True,
                "verified_at": user.email_verified_at.isoformat(),
            },
            status=status.HTTP_200_OK,
        )
