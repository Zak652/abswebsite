"""Tests for the Flutterwave webhook hardening (§ 2.1.1 – 2.1.4)."""
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
def clear_replay_cache():
    """Redis is shared across test runs, so flush before each webhook test
    to avoid stale event-id entries triggering false replay rejects."""
    cache.clear()
    yield
    cache.clear()


def _sign(body: bytes) -> str:
    return hmac.new(SECRET.encode(), body, hashlib.sha256).hexdigest()


@pytest.fixture
def webhook_settings(settings):
    settings.FLUTTERWAVE_WEBHOOK_SECRET = SECRET
    settings.FLUTTERWAVE_SECRET_KEY = "fw-test-key"
    return settings


@pytest.fixture
def session(db):
    return TrainingSession.objects.create(
        title="Test Session",
        level="beginner",
        date=dt.date.today() + dt.timedelta(days=10),
        time_start=dt.time(9, 0),
        time_end=dt.time(17, 0),
        location="Online",
        delivery_mode="virtual",
        price_usd=Decimal("100.00"),
        capacity=5,
    )


@pytest.fixture
def registration(session):
    return TrainingRegistration.objects.create(
        session=session,
        email="user@example.com",
        company_name="Co",
        full_name="User",
        team_size=2,
        flutterwave_tx_ref="ABS-TRAIN-TEST",
        expected_amount=Decimal("200.00"),
    )


def _post(client, body, signature):
    raw = json.dumps(body).encode()
    return client.post(
        "/api/v1/training/webhook/",
        data=raw,
        content_type="application/json",
        HTTP_VERIF_HASH=signature,
    )


def test_invalid_signature_returns_401(webhook_settings, registration, db):
    client = APIClient()
    body = {"event": "charge.completed", "data": {"tx_ref": "ABS-TRAIN-TEST"}}
    res = _post(client, body, "wrongsig")
    assert res.status_code == 401


def test_signature_against_secret_literal_rejected(webhook_settings, registration, db):
    """The old bug: header equal to the secret should NOT pass."""
    client = APIClient()
    body = {"event": "charge.completed", "data": {"tx_ref": "ABS-TRAIN-TEST"}}
    res = _post(client, body, SECRET)
    assert res.status_code == 401


def test_valid_signature_marks_paid(webhook_settings, registration, db):
    client = APIClient()
    body = {
        "event": "charge.completed",
        "data": {
            "id": 12345,
            "tx_ref": "ABS-TRAIN-TEST",
            "status": "successful",
            "amount": "200.00",
            "created_at": dt.datetime.now(tz=dt.timezone.utc).isoformat(),
        },
    }
    raw = json.dumps(body).encode()

    fake_verify = {"data": {"status": "successful", "amount": "200.00"}}
    with patch("apps.training.views.requests.get") as mock_get, patch(
        "apps.training.views.send_training_confirmation"
    ):
        mock_get.return_value.json.return_value = fake_verify
        res = _post(client, body, _sign(raw))

    assert res.status_code == 200
    registration.refresh_from_db()
    assert registration.status == "paid"


def test_amount_mismatch_rejected(webhook_settings, registration, db):
    client = APIClient()
    body = {
        "event": "charge.completed",
        "data": {
            "id": 22222,
            "tx_ref": "ABS-TRAIN-TEST",
            "status": "successful",
            "amount": "1.00",
            "created_at": dt.datetime.now(tz=dt.timezone.utc).isoformat(),
        },
    }
    raw = json.dumps(body).encode()

    fake_verify = {"data": {"status": "successful", "amount": "1.00"}}
    with patch("apps.training.views.requests.get") as mock_get:
        mock_get.return_value.json.return_value = fake_verify
        res = _post(client, body, _sign(raw))

    assert res.status_code == 409
    registration.refresh_from_db()
    assert registration.status == "pending_payment"


def test_duplicate_delivery_idempotent(webhook_settings, registration, db):
    client = APIClient()
    body = {
        "event": "charge.completed",
        "data": {
            "id": 33333,
            "tx_ref": "ABS-TRAIN-TEST",
            "status": "successful",
            "amount": "200.00",
            "created_at": dt.datetime.now(tz=dt.timezone.utc).isoformat(),
        },
    }
    raw = json.dumps(body).encode()
    fake_verify = {"data": {"status": "successful", "amount": "200.00"}}

    with patch("apps.training.views.requests.get") as mock_get, patch(
        "apps.training.views.send_training_confirmation"
    ) as mock_send:
        mock_get.return_value.json.return_value = fake_verify
        first = _post(client, body, _sign(raw))
        second = _post(client, body, _sign(raw))

    assert first.status_code == 200
    assert second.status_code == 200
    # Second delivery is short-circuited by the replay cache, so the verify
    # call only happens once and the email goes out once.
    assert mock_send.call_count <= 1


def test_null_verify_data_does_not_crash(webhook_settings, registration, db):
    """Regression: Flutterwave verify can return {"data": null} (e.g. with a
    bogus secret in dev). View must handle that without 500-ing."""
    client = APIClient()
    body = {
        "event": "charge.completed",
        "data": {
            "id": 55555,
            "tx_ref": "ABS-TRAIN-TEST",
            "status": "successful",
            "amount": "200.00",
            "created_at": dt.datetime.now(tz=dt.timezone.utc).isoformat(),
        },
    }
    raw = json.dumps(body).encode()
    fake_verify = {"status": "error", "data": None}
    with patch("apps.training.views.requests.get") as mock_get:
        mock_get.return_value.json.return_value = fake_verify
        res = _post(client, body, _sign(raw))
    assert res.status_code == 200
    assert res.json().get("status") == "ignored"
    registration.refresh_from_db()
    assert registration.status == "pending_payment"


def test_stale_event_rejected(webhook_settings, registration, db):
    client = APIClient()
    stale = (dt.datetime.now(tz=dt.timezone.utc) - dt.timedelta(minutes=10)).isoformat()
    body = {
        "event": "charge.completed",
        "data": {
            "id": 44444,
            "tx_ref": "ABS-TRAIN-TEST",
            "status": "successful",
            "amount": "200.00",
            "created_at": stale,
        },
    }
    raw = json.dumps(body).encode()
    res = _post(client, body, _sign(raw))
    assert res.status_code == 200
    body_json = res.json()
    assert body_json.get("status") == "ignored"
    assert body_json.get("reason") == "stale_event"
    registration.refresh_from_db()
    assert registration.status == "pending_payment"
