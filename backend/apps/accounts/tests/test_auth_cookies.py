"""Auth cookie hardening (§ 2.2.1, § 2.2.2)."""
from __future__ import annotations

import pytest
from rest_framework.test import APIClient

from apps.accounts.models import User


REGISTER_PAYLOAD = {
    "email": "alice@example.com",
    "password": "test-password-123",
    "password_confirm": "test-password-123",
    "full_name": "Alice",
    "company_name": "Co",
}


@pytest.fixture
def alice(db):
    return User.objects.create_user(
        email="alice@example.com",
        password="test-password-123",
        full_name="Alice",
        company_name="Co",
        role="client",
    )


def test_register_sets_httponly_session_and_refresh_cookies(db):
    client = APIClient()
    res = client.post("/api/v1/auth/register/", REGISTER_PAYLOAD, format="json")
    assert res.status_code == 201

    session_cookie = res.cookies.get("abs_session")
    refresh_cookie = res.cookies.get("abs_refresh")
    assert session_cookie is not None
    assert refresh_cookie is not None
    # Both must be HttpOnly so JS can't read them.
    assert session_cookie["httponly"]
    assert refresh_cookie["httponly"]
    assert refresh_cookie["path"] == "/api/v1/auth/"
    # Response body must NOT contain the refresh token.
    assert "refresh" not in res.json()


def test_login_sets_httponly_cookies_and_no_refresh_in_body(alice):
    client = APIClient()
    res = client.post(
        "/api/v1/auth/login/",
        {"email": "alice@example.com", "password": "test-password-123"},
        format="json",
    )
    assert res.status_code == 200
    body = res.json()
    assert "refresh" not in body
    assert body.get("access")
    assert res.cookies["abs_session"]["httponly"]
    assert res.cookies["abs_refresh"]["httponly"]


def test_refresh_endpoint_uses_cookie_not_body(alice):
    client = APIClient()
    login = client.post(
        "/api/v1/auth/login/",
        {"email": "alice@example.com", "password": "test-password-123"},
        format="json",
    )
    assert login.status_code == 200
    # The cookie should round-trip via the test client.
    res = client.post("/api/v1/auth/token/refresh/", {}, format="json")
    assert res.status_code == 200
    assert res.json().get("access")


def test_refresh_endpoint_401_without_cookie(db):
    client = APIClient()
    res = client.post("/api/v1/auth/token/refresh/", {}, format="json")
    assert res.status_code == 401


def test_logout_clears_cookies(alice):
    client = APIClient()
    login = client.post(
        "/api/v1/auth/login/",
        {"email": "alice@example.com", "password": "test-password-123"},
        format="json",
    )
    assert login.status_code == 200
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {login.json()['access']}")
    res = client.post("/api/v1/auth/logout/", {}, format="json")
    assert res.status_code == 200
    # max-age=0 (or similar) clears the cookie. Test client surfaces this
    # as an empty-value cookie with max-age=0.
    assert res.cookies["abs_session"]["max-age"] == 0
    assert res.cookies["abs_refresh"]["max-age"] == 0
