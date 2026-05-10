"""End-to-end training registration flow (build guide § 3.10).

Webhook hardening, capacity enforcement, and the email-send hook
are pinned in dedicated test modules. This file exists to verify
the *composition* — that POST /register/ → mocked Flutterwave
checkout init → webhook → verify → confirmation email walks
cleanly when each piece talks to the next.

If a single sub-test fails the others should still narrow the
diagnosis to its own seam; this test fails *only* when the seams
between them break.
"""
from __future__ import annotations

import datetime as dt
import hashlib
import hmac
import json
from decimal import Decimal
from unittest.mock import patch

import pytest
from django.core.cache import cache
from rest_framework.test import APIClient

from apps.training.models import TrainingRegistration, TrainingSession


SECRET = "fw-test-secret"


@pytest.fixture(autouse=True)
def _clear_cache():
    cache.clear()
    yield
    cache.clear()


@pytest.fixture
def webhook_settings(settings):
    settings.FLUTTERWAVE_WEBHOOK_SECRET = SECRET
    settings.FLUTTERWAVE_SECRET_KEY = "fw-test-key"
    settings.FRONTEND_URL = "https://example.test"
    return settings


@pytest.fixture
def session(db):
    return TrainingSession.objects.create(
        title="RFID Foundations",
        level="beginner",
        date=dt.date.today() + dt.timedelta(days=14),
        time_start=dt.time(9, 0),
        time_end=dt.time(17, 0),
        location="Online",
        delivery_mode="virtual",
        price_usd=Decimal("250.00"),
        capacity=10,
        is_active=True,
    )


def _sign(body: bytes) -> str:
    return hmac.new(SECRET.encode(), body, hashlib.sha256).hexdigest()


@pytest.mark.django_db(transaction=True)
def test_full_register_pay_confirm_flow(webhook_settings, session):
    """Walk register → mocked checkout → webhook → confirmation email.

    Each seam:
      1. /register/ creates a TrainingRegistration with `pending_payment`,
         a deterministic `expected_amount`, and a Flutterwave checkout
         link (we mock the upstream call).
      2. Webhook with valid signature + mocked verify flips status to
         `paid`, persists `flutterwave_tx_id`, and queues the
         confirmation email via `transaction.on_commit`.
      3. The email-send hook is called exactly once with the
         freshly-paid registration's id.
    """
    client = APIClient()

    # ---- Step 1: register --------------------------------------------------
    fake_payment_link = "https://checkout.flutterwave.test/pay/abc123"
    fake_init = {
        "status": "success",
        "data": {"link": fake_payment_link},
    }

    with patch("apps.training.views.requests.post") as mock_post:
        mock_post.return_value.json.return_value = fake_init
        register_res = client.post(
            "/api/v1/training/register/",
            {
                "session": str(session.id),
                "email": "alice@example.com",
                "company_name": "Acme",
                "full_name": "Alice",
                "team_size": 2,
            },
            format="json",
        )

    assert register_res.status_code == 201, register_res.data
    body = register_res.json()
    assert body["payment_link"] == fake_payment_link
    reg_id = body["id"]

    reg = TrainingRegistration.objects.get(pk=reg_id)
    assert reg.status == "pending_payment"
    # 2 seats × $250 = $500
    assert reg.expected_amount == Decimal("500.00")
    tx_ref = reg.flutterwave_tx_ref
    assert tx_ref.startswith("ABS-TRAIN-")

    # ---- Step 2: webhook arrives ------------------------------------------
    webhook_body = {
        "event": "charge.completed",
        "data": {
            "id": 555_001,
            "tx_ref": tx_ref,
            "status": "successful",
            "amount": "500.00",
            "created_at": dt.datetime.now(tz=dt.timezone.utc).isoformat(),
        },
    }
    raw = json.dumps(webhook_body).encode()
    fake_verify = {"data": {"status": "successful", "amount": "500.00"}}

    with patch("apps.training.views.requests.get") as mock_get, patch(
        "apps.training.views.send_training_confirmation"
    ) as mock_email:
        mock_get.return_value.json.return_value = fake_verify
        webhook_res = client.post(
            "/api/v1/training/webhook/",
            data=raw,
            content_type="application/json",
            HTTP_VERIF_HASH=_sign(raw),
        )

    assert webhook_res.status_code == 200, webhook_res.data

    # ---- Step 3: state has fully converged --------------------------------
    reg.refresh_from_db()
    assert reg.status == "paid"
    assert reg.flutterwave_tx_id == "555001"
    assert reg.amount_paid == Decimal("500.00")

    # Email-send hook fired exactly once via transaction.on_commit.
    mock_email.assert_called_once()


@pytest.mark.django_db(transaction=True)
def test_replay_after_confirmed_does_not_resend_email(webhook_settings, session):
    """A duplicate webhook delivery for an already-paid registration is
    a no-op: status stays ``paid`` and no second confirmation email."""
    client = APIClient()

    # Create the registration directly to skip the checkout-init step.
    reg = TrainingRegistration.objects.create(
        session=session,
        email="bob@example.com",
        company_name="Co",
        full_name="Bob",
        team_size=1,
        flutterwave_tx_ref="ABS-TRAIN-REPLAY",
        expected_amount=Decimal("250.00"),
        status="paid",
        flutterwave_tx_id="999",
        amount_paid=Decimal("250.00"),
    )

    body = {
        "event": "charge.completed",
        "data": {
            "id": 999,
            "tx_ref": "ABS-TRAIN-REPLAY",
            "status": "successful",
            "amount": "250.00",
            "created_at": dt.datetime.now(tz=dt.timezone.utc).isoformat(),
        },
    }
    raw = json.dumps(body).encode()
    fake_verify = {"data": {"status": "successful", "amount": "250.00"}}

    with patch("apps.training.views.requests.get") as mock_get, patch(
        "apps.training.views.send_training_confirmation"
    ) as mock_email:
        mock_get.return_value.json.return_value = fake_verify
        res = client.post(
            "/api/v1/training/webhook/",
            data=raw,
            content_type="application/json",
            HTTP_VERIF_HASH=_sign(raw),
        )

    assert res.status_code == 200
    assert res.json().get("already") == "paid"
    reg.refresh_from_db()
    assert reg.status == "paid"
    mock_email.assert_not_called()
