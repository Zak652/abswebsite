from django.urls import path

from .views import RFQSubmissionCreateView, RFQSubmissionListView

urlpatterns = [
    path("", RFQSubmissionCreateView.as_view(), name="rfq-create"),
    path("mine/", RFQSubmissionListView.as_view(), name="rfq-list"),
]
