from django.urls import path

from .views import ServiceRequestCreateView

urlpatterns = [
    path(
        "requests/", ServiceRequestCreateView.as_view(), name="service-request-create"
    ),
]
