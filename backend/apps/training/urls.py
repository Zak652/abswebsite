from django.urls import path

from .views import (
    TrainingSessionListView,
    TrainingRegistrationCreateView,
    FlutterwaveWebhookView,
    TrainingRegistrationListView,
)

urlpatterns = [
    path("sessions/", TrainingSessionListView.as_view(), name="training-sessions"),
    path(
        "register/", TrainingRegistrationCreateView.as_view(), name="training-register"
    ),
    path("webhook/", FlutterwaveWebhookView.as_view(), name="training-webhook"),
    path(
        "registrations/",
        TrainingRegistrationListView.as_view(),
        name="training-registrations",
    ),
]
