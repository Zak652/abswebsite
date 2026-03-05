from rest_framework import serializers

from .models import Product, ProductCategory, ProductConfigOption, ProductConfigSection


class ProductCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductCategory
        fields = ["id", "name", "slug", "description", "order"]


class ProductConfigOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductConfigOption
        fields = [
            "id",
            "option_id",
            "name",
            "description",
            "price_usd",
            "badge",
            "is_default",
            "overlay_icon",
            "overlay_label",
            "overlay_position",
            "overlay_color",
            "order",
        ]


class ProductConfigSectionSerializer(serializers.ModelSerializer):
    options = ProductConfigOptionSerializer(many=True, read_only=True)

    class Meta:
        model = ProductConfigSection
        fields = ["id", "name", "step_number", "order", "options"]


class ProductListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for gallery/listing pages."""

    category = ProductCategorySerializer(read_only=True)

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "slug",
            "category",
            "short_description",
            "image_hero",
            "is_configurable",
            "is_recommended",
            "is_active",
            "order",
        ]


class ProductDetailSerializer(serializers.ModelSerializer):
    """Full serializer including specifications and config sections."""

    category = ProductCategorySerializer(read_only=True)
    config_sections = ProductConfigSectionSerializer(many=True, read_only=True)

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "slug",
            "category",
            "short_description",
            "full_description",
            "image_hero",
            "image_context",
            "image_detail",
            "image_usecase",
            "specifications",
            "is_configurable",
            "is_recommended",
            "is_active",
            "datasheet_url",
            "order",
            "config_sections",
        ]


class ProductAdminSerializer(serializers.ModelSerializer):
    """Serializer for admin CRUD operations."""

    category_id = serializers.PrimaryKeyRelatedField(
        queryset=ProductCategory.objects.all(), source="category", write_only=True
    )
    category = ProductCategorySerializer(read_only=True)

    class Meta:
        model = Product
        fields = "__all__"
        read_only_fields = ["id", "created_at", "updated_at"]
