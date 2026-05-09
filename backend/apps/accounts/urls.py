from django.urls import path

from .views import (
    CookieTokenRefreshView,
    EmailVerifyConfirmView,
    EmailVerifyRequestView,
    LoginView,
    LogoutView,
    MeDataExportView,
    MeDeleteView,
    MeView,
    PasswordResetConfirmView,
    PasswordResetRequestView,
    RegisterView,
)

urlpatterns = [
    path("register/", RegisterView.as_view(), name="auth-register"),
    path("login/", LoginView.as_view(), name="auth-login"),
    path("logout/", LogoutView.as_view(), name="auth-logout"),
    path("token/refresh/", CookieTokenRefreshView.as_view(), name="token-refresh"),
    path("me/", MeView.as_view(), name="auth-me"),
    path(
        "password/reset/",
        PasswordResetRequestView.as_view(),
        name="auth-password-reset",
    ),
    path(
        "password/reset/confirm/",
        PasswordResetConfirmView.as_view(),
        name="auth-password-reset-confirm",
    ),
    path(
        "email/verify/request/",
        EmailVerifyRequestView.as_view(),
        name="auth-email-verify-request",
    ),
    path(
        "email/verify/confirm/",
        EmailVerifyConfirmView.as_view(),
        name="auth-email-verify-confirm",
    ),
    path(
        "me/export/",
        MeDataExportView.as_view(),
        name="auth-me-export",
    ),
    path(
        "me/delete/",
        MeDeleteView.as_view(),
        name="auth-me-delete",
    ),
]
