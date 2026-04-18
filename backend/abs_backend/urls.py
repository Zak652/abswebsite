from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("django-admin/", admin.site.urls),
    path("api/v1/auth/", include("apps.accounts.urls")),
    path("api/v1/rfq/", include("apps.rfq.urls")),
    path("api/v1/subscriptions/", include("apps.subscriptions.urls")),
    path("api/v1/training/", include("apps.training.urls")),
    path("api/v1/admin/", include("apps.accounts.admin_urls")),
    path("api/v1/admin/cms/", include("apps.cms.admin_urls")),
    path("api/v1/products/", include("apps.products.urls")),
    path("api/v1/services/", include("apps.services.urls")),
    path("api/v1/cms/", include("apps.cms.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
