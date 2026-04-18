import pytest
from apps.accounts.models import User


@pytest.fixture
def admin_user(db):
    return User.objects.create_user(
        email="admin@test.com",
        password="testpass123",
        full_name="Admin User",
        role="admin",
        is_staff=True,
    )


@pytest.fixture
def client_user(db):
    return User.objects.create_user(
        email="client@test.com",
        password="testpass123",
        full_name="Client User",
        role="client",
    )


@pytest.fixture
def admin_client(admin_user):
    from rest_framework.test import APIClient

    client = APIClient()
    client.force_authenticate(user=admin_user)
    return client


@pytest.fixture
def anon_client():
    from rest_framework.test import APIClient

    return APIClient()


@pytest.fixture
def client_client(client_user):
    from rest_framework.test import APIClient

    client = APIClient()
    client.force_authenticate(user=client_user)
    return client
