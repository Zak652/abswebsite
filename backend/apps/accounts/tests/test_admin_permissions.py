"""Admin permission gates (build guide § 3.10).

The contract: every URL under ``/api/v1/admin/`` must reject anonymous
and non-admin (client-role) users. We exercise a representative sample
across both admin URL configs (apps/accounts/admin_urls.py and
apps/cms/admin_urls.py) — listing every endpoint would be brittle, but
sampling each "category" catches a regression where someone forgets
``permission_classes = [IsAdmin]`` on a new view.

Failure modes we want to catch:
- Anonymous user gets 401 (not 200, not 500).
- Authenticated client-role user gets 403 (not 200).
- Authenticated admin gets through (status varies by endpoint, but
  it's NOT 401/403).
"""
from __future__ import annotations

import pytest


# Representative sample — one endpoint per category. If a future PR
# introduces a new admin URL category, add a row here.
ADMIN_GET_ENDPOINTS = [
    # Accounts admin
    "/api/v1/admin/stats/",
    "/api/v1/admin/analytics/",
    "/api/v1/admin/rfq/",
    "/api/v1/admin/subscriptions/",
    "/api/v1/admin/training/",
    "/api/v1/admin/users/",
    # CMS admin
    "/api/v1/admin/cms/settings/",
    "/api/v1/admin/cms/meta/",
    "/api/v1/admin/cms/hero/",
    "/api/v1/admin/cms/blocks/",
    "/api/v1/admin/cms/media/",
    "/api/v1/admin/cms/modules/",
    "/api/v1/admin/cms/pricing/",
    "/api/v1/admin/cms/case-studies/",
    "/api/v1/admin/cms/blog-posts/",
]


@pytest.mark.parametrize("path", ADMIN_GET_ENDPOINTS)
def test_anonymous_user_gets_401(path, anon_client):
    res = anon_client.get(path)
    assert res.status_code == 401, (
        f"{path}: anonymous should be 401 unauthenticated, got "
        f"{res.status_code} — does the view declare IsAdmin?"
    )


@pytest.mark.parametrize("path", ADMIN_GET_ENDPOINTS)
def test_client_role_user_gets_403(path, client_client):
    res = client_client.get(path)
    assert res.status_code == 403, (
        f"{path}: client-role should be 403 forbidden, got "
        f"{res.status_code} — does the view declare IsAdmin?"
    )


@pytest.mark.parametrize("path", ADMIN_GET_ENDPOINTS)
def test_admin_user_gets_through(path, admin_client):
    """Admin shouldn't 401/403 — actual status varies by endpoint
    (200, 404, 500 if seed data is missing, etc.) but we just want to
    prove the auth/permission layer doesn't reject them."""
    res = admin_client.get(path)
    assert res.status_code not in (401, 403), (
        f"{path}: admin should pass the IsAdmin check, got "
        f"{res.status_code}"
    )
