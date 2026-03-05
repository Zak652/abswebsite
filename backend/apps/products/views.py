from rest_framework import generics
from rest_framework.permissions import AllowAny

from .models import Product, ProductCategory
from .serializers import (
    ProductCategorySerializer,
    ProductConfigSectionSerializer,
    ProductDetailSerializer,
    ProductListSerializer,
)


class ProductCategoryListView(generics.ListAPIView):
    serializer_class = ProductCategorySerializer
    permission_classes = [AllowAny]
    queryset = ProductCategory.objects.all()


class ProductListView(generics.ListAPIView):
    serializer_class = ProductListSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        qs = Product.objects.filter(is_active=True).select_related("category")
        category_slug = self.request.query_params.get("category")
        if category_slug:
            qs = qs.filter(category__slug=category_slug)
        return qs


class ProductDetailView(generics.RetrieveAPIView):
    serializer_class = ProductDetailSerializer
    permission_classes = [AllowAny]
    queryset = Product.objects.filter(is_active=True).select_related("category")
    lookup_field = "slug"


class ProductConfigView(generics.ListAPIView):
    serializer_class = ProductConfigSectionSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        slug = self.kwargs["slug"]
        product = generics.get_object_or_404(
            Product, slug=slug, is_active=True, is_configurable=True
        )
        return product.config_sections.prefetch_related("options").all()
