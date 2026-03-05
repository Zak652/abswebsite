from django.urls import path

from .views import (
    ProductCategoryListView,
    ProductConfigView,
    ProductDetailView,
    ProductListView,
)

urlpatterns = [
    path(
        "categories/", ProductCategoryListView.as_view(), name="product-category-list"
    ),
    path("", ProductListView.as_view(), name="product-list"),
    path("<slug:slug>/", ProductDetailView.as_view(), name="product-detail"),
    path("<slug:slug>/config/", ProductConfigView.as_view(), name="product-config"),
]
