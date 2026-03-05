from django.urls import path

from .admin_views import (
    AdminStatsView,
    AdminAnalyticsView,
    AdminRFQListView,
    AdminRFQUpdateView,
    AdminRFQExportView,
    AdminTrialListView,
    AdminTrialUpdateView,
    AdminTrialExportView,
    AdminTrainingListView,
    AdminTrainingExportView,
    AdminUserListView,
    AdminUserUpdateView,
    AdminProductListView,
    AdminProductCreateView,
    AdminProductUpdateView,
    AdminProductDeleteView,
    AdminServiceRequestListView,
    AdminServiceRequestUpdateView,
)

urlpatterns = [
    # Stats & Analytics
    path("stats/", AdminStatsView.as_view(), name="admin-stats"),
    path("analytics/", AdminAnalyticsView.as_view(), name="admin-analytics"),
    # RFQ
    path("rfq/", AdminRFQListView.as_view(), name="admin-rfq-list"),
    path("rfq/<uuid:pk>/", AdminRFQUpdateView.as_view(), name="admin-rfq-update"),
    path("export/rfq/", AdminRFQExportView.as_view(), name="admin-rfq-export"),
    # Subscriptions/Trials
    path("subscriptions/", AdminTrialListView.as_view(), name="admin-trial-list"),
    path(
        "subscriptions/<uuid:pk>/",
        AdminTrialUpdateView.as_view(),
        name="admin-trial-update",
    ),
    path("export/trials/", AdminTrialExportView.as_view(), name="admin-trial-export"),
    # Training
    path("training/", AdminTrainingListView.as_view(), name="admin-training-list"),
    path(
        "export/training/",
        AdminTrainingExportView.as_view(),
        name="admin-training-export",
    ),
    # Users
    path("users/", AdminUserListView.as_view(), name="admin-user-list"),
    path("users/<uuid:pk>/", AdminUserUpdateView.as_view(), name="admin-user-update"),
    # Products CRUD
    path("products/", AdminProductListView.as_view(), name="admin-product-list"),
    path(
        "products/create/",
        AdminProductCreateView.as_view(),
        name="admin-product-create",
    ),
    path(
        "products/<uuid:pk>/",
        AdminProductUpdateView.as_view(),
        name="admin-product-update",
    ),
    path(
        "products/<uuid:pk>/delete/",
        AdminProductDeleteView.as_view(),
        name="admin-product-delete",
    ),
    # Services
    path("services/", AdminServiceRequestListView.as_view(), name="admin-service-list"),
    path(
        "services/<uuid:pk>/",
        AdminServiceRequestUpdateView.as_view(),
        name="admin-service-update",
    ),
]
