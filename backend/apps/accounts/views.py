import jwt
from datetime import datetime, timedelta, timezone

from django.conf import settings
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import RegisterSerializer, LoginSerializer, UserSerializer


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
