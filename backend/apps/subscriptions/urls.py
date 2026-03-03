from django.urls import path

from .views import TrialSignupCreateView, TrialSignupListView

urlpatterns = [
    path("trial/", TrialSignupCreateView.as_view(), name="trial-signup"),
    path("", TrialSignupListView.as_view(), name="subscription-list"),
]
