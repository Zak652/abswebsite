"""RFQ submission flow (build guide § 3.10).

Public POST /api/v1/rfq/ — anonymous-allowed quote requests with
serializer validation, email acknowledgement, and a rate limit. The
contract is small but launch-critical: the form must accept valid
submissions, reject incomplete ones, and never break a submission
because the email service is down.
"""
from __future__ import annotations

from unittest.mock import patch

import pytest
from django.core.cache import cache
from rest_framework.test import APIClient

from apps.rfq.models import RFQSubmission


@pytest.fixture(autouse=True)
def _clear_throttle_cache():
    cache.clear()
    yield
    cache.clear()


@pytest.fixture
def api():
    return APIClient()


@pytest.fixture
def valid_payload():
    return {
        "email": "buyer@acme.com",
        "company_name": "Acme Industries",
        "needs_hardware": True,
        "needs_software": False,
        "needs_services": False,
        "asset_count_range": "201-1000",
        "location_count": "5",
        "additional_notes": "Looking for a phased rollout next quarter.",
    }


# ---------------------------------------------------------------------------
# Happy path
# ---------------------------------------------------------------------------


def test_anonymous_user_can_submit(api, valid_payload, db):
    with patch("apps.rfq.views.send_rfq_acknowledgment") as mocked:
        res = api.post("/api/v1/rfq/", valid_payload, format="json")
    assert res.status_code == 201, res.data
    body = res.json()
    assert body["email"] == "buyer@acme.com"
    assert body["company_name"] == "Acme Industries"
    assert body["status"] == "new"  # default status
    assert "id" in body
    mocked.assert_called_once()


def test_submission_persists_to_database(api, valid_payload, db):
    with patch("apps.rfq.views.send_rfq_acknowledgment"):
        res = api.post("/api/v1/rfq/", valid_payload, format="json")
    rfq = RFQSubmission.objects.get(pk=res.data["id"])
    assert rfq.email == "buyer@acme.com"
    assert rfq.needs_hardware is True
    assert rfq.needs_software is False
    assert rfq.user is None  # anonymous submission


def test_email_failure_does_not_break_submission(api, valid_payload, db):
    """Email outage must not prevent users from sending us quotes."""
    with patch(
        "apps.rfq.views.send_rfq_acknowledgment",
        side_effect=Exception("smtp down"),
    ):
        res = api.post("/api/v1/rfq/", valid_payload, format="json")
    assert res.status_code == 201
    assert RFQSubmission.objects.filter(email="buyer@acme.com").exists()


# ---------------------------------------------------------------------------
# Validation
# ---------------------------------------------------------------------------


def test_submission_requires_at_least_one_solution_type(api, valid_payload, db):
    payload = {
        **valid_payload,
        "needs_hardware": False,
        "needs_software": False,
        "needs_services": False,
    }
    res = api.post("/api/v1/rfq/", payload, format="json")
    assert res.status_code == 400


def test_submission_rejects_invalid_email(api, valid_payload, db):
    payload = {**valid_payload, "email": "not-an-email"}
    res = api.post("/api/v1/rfq/", payload, format="json")
    assert res.status_code == 400
    assert "email" in res.data


def test_submission_requires_company_name(api, valid_payload, db):
    payload = {**valid_payload, "company_name": ""}
    res = api.post("/api/v1/rfq/", payload, format="json")
    assert res.status_code == 400
    assert "company_name" in res.data


def test_submission_requires_asset_count_range(api, valid_payload, db):
    payload = {**valid_payload, "asset_count_range": ""}
    res = api.post("/api/v1/rfq/", payload, format="json")
    assert res.status_code == 400


# ---------------------------------------------------------------------------
# Authenticated user — submission gets linked
# ---------------------------------------------------------------------------


def test_authenticated_user_submission_links_to_account(
    api, valid_payload, client_user,
):
    api.force_authenticate(user=client_user)
    with patch("apps.rfq.views.send_rfq_acknowledgment"):
        res = api.post("/api/v1/rfq/", valid_payload, format="json")
    assert res.status_code == 201
    rfq = RFQSubmission.objects.get(pk=res.data["id"])
    assert rfq.user == client_user


# ---------------------------------------------------------------------------
# Throttle
# ---------------------------------------------------------------------------


def test_endpoint_is_rate_limited(api, valid_payload, db):
    """Configured rate is 10/min for the rfq scope. The 11th call
    inside one minute must 429."""
    with patch("apps.rfq.views.send_rfq_acknowledgment"):
        statuses = [
            api.post("/api/v1/rfq/", valid_payload, format="json").status_code
            for _ in range(12)
        ]
    assert statuses[:10] == [201] * 10
    assert 429 in statuses[10:]


# ---------------------------------------------------------------------------
# /api/v1/rfq/mine/ — authenticated list
# ---------------------------------------------------------------------------


def test_my_rfqs_requires_authentication(api, db):
    res = api.get("/api/v1/rfq/mine/")
    assert res.status_code in (401, 403)


def test_my_rfqs_returns_only_my_submissions(api, valid_payload, client_user):
    """Two users, two submissions — each only sees their own."""
    api.force_authenticate(user=client_user)
    with patch("apps.rfq.views.send_rfq_acknowledgment"):
        api.post("/api/v1/rfq/", valid_payload, format="json")

    # Make a second user and a submission attributed to them.
    from apps.accounts.models import User

    other = User.objects.create_user(
        email="other@example.com",
        password="other-password-123",  # gitleaks:allow
        full_name="Other",
        company_name="OtherCo",
        role="client",
    )
    RFQSubmission.objects.create(
        user=other,
        email=other.email,
        company_name=other.company_name,
        needs_hardware=True,
        asset_count_range="1-50",
    )

    res = api.get("/api/v1/rfq/mine/")
    assert res.status_code == 200
    results = res.json().get("results", res.json())
    emails = {r["email"] for r in results}
    assert "buyer@acme.com" in emails
    assert "other@example.com" not in emails
