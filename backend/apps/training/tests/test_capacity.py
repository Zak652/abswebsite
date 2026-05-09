"""Capacity enforcement on training registration (§ 2.1.5)."""
from __future__ import annotations

import datetime as dt
from decimal import Decimal

import pytest
from rest_framework.test import APIClient

from apps.training.models import TrainingRegistration, TrainingSession


@pytest.fixture
def small_session(db):
    return TrainingSession.objects.create(
        title="Small Session",
        level="beginner",
        date=dt.date.today() + dt.timedelta(days=10),
        time_start=dt.time(9, 0),
        time_end=dt.time(17, 0),
        location="Online",
        delivery_mode="virtual",
        price_usd=Decimal("100.00"),
        capacity=3,
    )


def _register(client, session, team_size=1, email="x@example.com"):
    return client.post(
        "/api/v1/training/register/",
        {
            "session": str(session.pk),
            "email": email,
            "company_name": "Co",
            "full_name": "User",
            "team_size": team_size,
        },
        format="json",
    )


def test_registration_rejected_when_team_size_exceeds_remaining(small_session):
    client = APIClient()
    # Pre-fill 2 of 3 seats.
    TrainingRegistration.objects.create(
        session=small_session,
        email="a@x.com",
        company_name="Co",
        full_name="A",
        team_size=2,
        flutterwave_tx_ref="A",
        expected_amount=Decimal("200.00"),
        status="paid",
    )
    res = _register(client, small_session, team_size=2)
    assert res.status_code == 409


def test_registration_succeeds_within_capacity(small_session):
    client = APIClient()
    # 0 seats taken; team_size=2 fits.
    res = _register(client, small_session, team_size=2)
    assert res.status_code == 201
    reg_id = res.json()["id"]
    reg = TrainingRegistration.objects.get(pk=reg_id)
    assert reg.expected_amount == Decimal("200.00")
    assert reg.status == "pending_payment"


def test_pending_payment_holds_seats(small_session):
    """A pending registration counts toward capacity until it's cancelled."""
    client = APIClient()
    TrainingRegistration.objects.create(
        session=small_session,
        email="a@x.com",
        company_name="Co",
        full_name="A",
        team_size=2,
        flutterwave_tx_ref="A",
        expected_amount=Decimal("200.00"),
        status="pending_payment",
    )
    res = _register(client, small_session, team_size=2)
    assert res.status_code == 409
