from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("django-admin/", admin.site.urls),
    path("api/v1/auth/", include("apps.accounts.urls")),
    path("api/v1/rfq/", include("apps.rfq.urls")),
    path("api/v1/subscriptions/", include("apps.subscriptions.urls")),
    path("api/v1/training/", include("apps.training.urls")),
    path("api/v1/admin/", include("apps.accounts.admin_urls")),
]
