from django.urls import path

from .views import (
    TrialSignupCancelView,
    TrialSignupCreateView,
    TrialSignupListView,
)

urlpatterns = [
    path("trial/", TrialSignupCreateView.as_view(), name="trial-signup"),
    path(
        "<uuid:pk>/cancel/",
        TrialSignupCancelView.as_view(),
        name="trial-cancel",
    ),
    path("", TrialSignupListView.as_view(), name="subscription-list"),
]
