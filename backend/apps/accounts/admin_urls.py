from django.urls import path

from .admin_views import (
    AdminStatsView,
    AdminRFQListView,
    AdminRFQUpdateView,
    AdminTrialListView,
    AdminTrialUpdateView,
    AdminTrainingListView,
)

urlpatterns = [
    path("stats/", AdminStatsView.as_view(), name="admin-stats"),
    path("rfq/", AdminRFQListView.as_view(), name="admin-rfq-list"),
    path("rfq/<uuid:pk>/", AdminRFQUpdateView.as_view(), name="admin-rfq-update"),
    path("subscriptions/", AdminTrialListView.as_view(), name="admin-trial-list"),
    path(
        "subscriptions/<uuid:pk>/",
        AdminTrialUpdateView.as_view(),
        name="admin-trial-update",
    ),
    path("training/", AdminTrainingListView.as_view(), name="admin-training-list"),
]
