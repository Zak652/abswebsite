from rest_framework import serializers

from apps.cms.models import (
    ContentRevision,
    MediaAsset,
    AssetTag,
    ProductImage,
    SiteSettings,
    PageMeta,
    HeroSection,
    PageBlock,
    NavigationItem,
    ServiceOffering,
    ArcplusModule,
    PricingPlan,
    PlanFeature,
    PlanFeatureValue,
    SupportTier,
    SupportFeature,
    SupportFeatureValue,
    CaseStudy,
    DocumentationPage,
    APIEndpointGroup,
    APIEndpoint,
    TagCategory,
    ScannerFeature,
    BlogCategory,
    BlogPost,
    EmailTemplate,
    Testimonial,
    RegionalVariant,
)


# ---------------------------------------------------------------------------
# Media
# ---------------------------------------------------------------------------


class AssetTagSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssetTag
        fields = ["id", "name", "slug"]


class MediaAssetSerializer(serializers.ModelSerializer):
    tags = AssetTagSerializer(many=True, read_only=True)

    class Meta:
        model = MediaAsset
        fields = [
            "id",
            "file",
            "asset_type",
            "filename",
            "alt_text",
            "caption",
            "file_size",
            "width",
            "height",
            "file_webp",
            "file_thumbnail",
            "file_medium",
            "file_large",
            "processing_status",
            "tags",
            "usage_count",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "file_size",
            "width",
            "height",
            "file_webp",
            "file_thumbnail",
            "file_medium",
            "file_large",
            "processing_status",
            "usage_count",
            "created_at",
        ]


class MediaAssetUploadSerializer(serializers.ModelSerializer):
    tag_ids = serializers.PrimaryKeyRelatedField(
        queryset=AssetTag.objects.all(),
        many=True,
        required=False,
        write_only=True,
    )

    class Meta:
        model = MediaAsset
        fields = ["file", "asset_type", "alt_text", "caption", "tag_ids"]

    def create(self, validated_data):
        tag_ids = validated_data.pop("tag_ids", [])
        uploaded_file = validated_data["file"]
        validated_data["filename"] = uploaded_file.name
        validated_data["file_size"] = uploaded_file.size
        validated_data["uploaded_by"] = self.context["request"].user
        asset = MediaAsset.objects.create(**validated_data)
        if tag_ids:
            asset.tags.set(tag_ids)
        return asset


class ProductImageSerializer(serializers.ModelSerializer):
    asset = MediaAssetSerializer(read_only=True)
    asset_id = serializers.PrimaryKeyRelatedField(
        queryset=MediaAsset.objects.all(), source="asset", write_only=True
    )

    class Meta:
        model = ProductImage
        fields = [
            "id",
            "product",
            "asset",
            "asset_id",
            "image_type",
            "alt_text",
            "caption",
            "order",
            "is_active",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


# ---------------------------------------------------------------------------
# Site-Wide (Public Read)
# ---------------------------------------------------------------------------


class SiteSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = SiteSettings
        fields = [
            "currency_rates",
            "company_phone",
            "company_email",
            "company_address",
            "social_links",
            "default_og_image",
            "google_analytics_id",
            "organization_schema",
            "updated_at",
        ]


class PageMetaSerializer(serializers.ModelSerializer):
    class Meta:
        model = PageMeta
        fields = [
            "id",
            "route",
            "title",
            "description",
            "og_image",
            "canonical_url",
            "is_indexed",
            "structured_data",
            "hreflang_alternates",
            "updated_at",
        ]


# ---------------------------------------------------------------------------
# Page Content (Public Read)
# ---------------------------------------------------------------------------


class HeroSectionSerializer(serializers.ModelSerializer):
    background_image = MediaAssetSerializer(read_only=True)

    class Meta:
        model = HeroSection
        fields = [
            "id",
            "page",
            "headline",
            "subheadline",
            "cta_primary_text",
            "cta_primary_link",
            "cta_secondary_text",
            "cta_secondary_link",
            "background_image",
            "variant",
            "eyebrow",
            "badges",
        ]


class PageBlockSerializer(serializers.ModelSerializer):
    image = MediaAssetSerializer(read_only=True)

    class Meta:
        model = PageBlock
        fields = [
            "id",
            "page",
            "block_type",
            "title",
            "body",
            "image",
            "video_url",
            "icon",
            "link_url",
            "link_text",
            "data",
            "order",
        ]


class NavigationItemSerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()

    class Meta:
        model = NavigationItem
        fields = [
            "id",
            "label",
            "url",
            "parent",
            "location",
            "column",
            "order",
            "is_active",
            "children",
        ]

    def get_children(self, obj):
        children = obj.children.filter(is_active=True).order_by("order")
        return NavigationItemSerializer(children, many=True).data


# ---------------------------------------------------------------------------
# Domain Content (Public Read)
# ---------------------------------------------------------------------------


class ServiceOfferingSerializer(serializers.ModelSerializer):
    image = MediaAssetSerializer(read_only=True)

    class Meta:
        model = ServiceOffering
        fields = [
            "id",
            "title",
            "slug",
            "icon",
            "short_description",
            "problem",
            "process",
            "deliverables",
            "result",
            "image",
            "order",
        ]


class ArcplusModuleSerializer(serializers.ModelSerializer):
    image = MediaAssetSerializer(read_only=True)

    class Meta:
        model = ArcplusModule
        fields = [
            "id",
            "name",
            "slug",
            "tagline",
            "description",
            "icon",
            "features",
            "image",
            "order",
        ]


class PlanFeatureValueSerializer(serializers.ModelSerializer):
    feature_name = serializers.CharField(source="feature.name", read_only=True)
    feature_category = serializers.CharField(source="feature.category", read_only=True)

    class Meta:
        model = PlanFeatureValue
        fields = ["feature", "feature_name", "feature_category", "value", "is_included"]


class PricingPlanSerializer(serializers.ModelSerializer):
    feature_values = PlanFeatureValueSerializer(many=True, read_only=True)

    class Meta:
        model = PricingPlan
        fields = [
            "id",
            "name",
            "slug",
            "tagline",
            "asset_range",
            "price_usd",
            "price_ugx",
            "price_kes",
            "price_monthly_usd",
            "billing_period",
            "is_recommended",
            "cta_text",
            "cta_link",
            "order",
            "feature_values",
        ]


class PlanFeatureSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlanFeature
        fields = ["id", "name", "category", "order"]


class SupportFeatureValueSerializer(serializers.ModelSerializer):
    feature_name = serializers.CharField(source="feature.name", read_only=True)

    class Meta:
        model = SupportFeatureValue
        fields = ["feature", "feature_name", "value"]


class SupportTierSerializer(serializers.ModelSerializer):
    feature_values = SupportFeatureValueSerializer(many=True, read_only=True)

    class Meta:
        model = SupportTier
        fields = [
            "id",
            "name",
            "slug",
            "plan",
            "order",
            "feature_values",
        ]


class SupportFeatureSerializer(serializers.ModelSerializer):
    class Meta:
        model = SupportFeature
        fields = ["id", "name", "order"]


class CaseStudySerializer(serializers.ModelSerializer):
    image = MediaAssetSerializer(read_only=True)

    class Meta:
        model = CaseStudy
        fields = [
            "id",
            "title",
            "slug",
            "client_name",
            "industry",
            "country",
            "challenge",
            "solution",
            "results",
            "quote",
            "quote_author",
            "quote_role",
            "image",
            "order",
        ]


class DocumentationPageSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentationPage
        fields = [
            "id",
            "title",
            "slug",
            "content",
            "order",
        ]


class APIEndpointSerializer(serializers.ModelSerializer):
    class Meta:
        model = APIEndpoint
        fields = ["id", "method", "path", "description", "order"]


class APIEndpointGroupSerializer(serializers.ModelSerializer):
    endpoints = APIEndpointSerializer(many=True, read_only=True)

    class Meta:
        model = APIEndpointGroup
        fields = [
            "id",
            "name",
            "slug",
            "badge_class",
            "order",
            "endpoints",
        ]


# ---------------------------------------------------------------------------
# Admin Serializers (write)
# ---------------------------------------------------------------------------


class PublishableAdminMixin:
    """Include publishable fields in admin serializers."""

    def get_publishable_fields(self):
        return [
            "status",
            "version",
            "created_by",
            "updated_by",
            "approved_by",
            "approved_at",
            "published_at",
            "scheduled_publish_at",
            "created_at",
            "updated_at",
        ]


class HeroSectionAdminSerializer(serializers.ModelSerializer):
    background_image_id = serializers.PrimaryKeyRelatedField(
        queryset=MediaAsset.objects.all(),
        source="background_image",
        write_only=True,
        required=False,
        allow_null=True,
    )
    background_image = MediaAssetSerializer(read_only=True)

    class Meta:
        model = HeroSection
        fields = [
            "id",
            "page",
            "headline",
            "subheadline",
            "cta_primary_text",
            "cta_primary_link",
            "cta_secondary_text",
            "cta_secondary_link",
            "background_image",
            "background_image_id",
            "variant",
            "eyebrow",
            "badges",
            "status",
            "version",
            "created_by",
            "updated_by",
            "approved_by",
            "approved_at",
            "published_at",
            "scheduled_publish_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "version",
            "created_by",
            "approved_by",
            "approved_at",
            "published_at",
            "created_at",
            "updated_at",
        ]


class PageBlockAdminSerializer(serializers.ModelSerializer):
    image_id = serializers.PrimaryKeyRelatedField(
        queryset=MediaAsset.objects.all(),
        source="image",
        write_only=True,
        required=False,
        allow_null=True,
    )
    image = MediaAssetSerializer(read_only=True)

    class Meta:
        model = PageBlock
        fields = [
            "id",
            "page",
            "block_type",
            "title",
            "body",
            "image",
            "image_id",
            "video_url",
            "icon",
            "link_url",
            "link_text",
            "data",
            "order",
            "status",
            "version",
            "created_by",
            "updated_by",
            "approved_by",
            "approved_at",
            "published_at",
            "scheduled_publish_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "version",
            "created_by",
            "approved_by",
            "approved_at",
            "published_at",
            "created_at",
            "updated_at",
        ]


class NavigationItemAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = NavigationItem
        fields = [
            "id",
            "label",
            "url",
            "parent",
            "location",
            "column",
            "order",
            "is_active",
        ]


class ServiceOfferingAdminSerializer(serializers.ModelSerializer):
    image_id = serializers.PrimaryKeyRelatedField(
        queryset=MediaAsset.objects.all(),
        source="image",
        write_only=True,
        required=False,
        allow_null=True,
    )
    image = MediaAssetSerializer(read_only=True)

    class Meta:
        model = ServiceOffering
        fields = [
            "id",
            "title",
            "slug",
            "icon",
            "short_description",
            "problem",
            "process",
            "deliverables",
            "result",
            "image",
            "image_id",
            "order",
            "status",
            "version",
            "created_by",
            "updated_by",
            "published_at",
            "scheduled_publish_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "version",
            "created_by",
            "published_at",
            "created_at",
            "updated_at",
        ]


class ArcplusModuleAdminSerializer(serializers.ModelSerializer):
    image_id = serializers.PrimaryKeyRelatedField(
        queryset=MediaAsset.objects.all(),
        source="image",
        write_only=True,
        required=False,
        allow_null=True,
    )
    image = MediaAssetSerializer(read_only=True)

    class Meta:
        model = ArcplusModule
        fields = [
            "id",
            "name",
            "slug",
            "tagline",
            "description",
            "icon",
            "features",
            "image",
            "image_id",
            "order",
            "status",
            "version",
            "created_by",
            "updated_by",
            "published_at",
            "scheduled_publish_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "version",
            "created_by",
            "published_at",
            "created_at",
            "updated_at",
        ]


class PricingPlanAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = PricingPlan
        fields = [
            "id",
            "name",
            "slug",
            "tagline",
            "asset_range",
            "price_usd",
            "price_ugx",
            "price_kes",
            "price_monthly_usd",
            "billing_period",
            "is_recommended",
            "cta_text",
            "cta_link",
            "order",
            "status",
            "version",
            "created_by",
            "updated_by",
            "published_at",
            "scheduled_publish_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "version",
            "created_by",
            "published_at",
            "created_at",
            "updated_at",
        ]


class PlanFeatureValueAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlanFeatureValue
        fields = ["id", "plan", "feature", "value", "is_included"]


class SupportTierAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = SupportTier
        fields = [
            "id",
            "name",
            "slug",
            "plan",
            "order",
            "status",
            "version",
            "created_by",
            "updated_by",
            "published_at",
            "scheduled_publish_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "version",
            "created_by",
            "published_at",
            "created_at",
            "updated_at",
        ]


class SupportFeatureValueAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = SupportFeatureValue
        fields = ["id", "tier", "feature", "value"]


class CaseStudyAdminSerializer(serializers.ModelSerializer):
    image_id = serializers.PrimaryKeyRelatedField(
        queryset=MediaAsset.objects.all(),
        source="image",
        write_only=True,
        required=False,
        allow_null=True,
    )
    image = MediaAssetSerializer(read_only=True)

    class Meta:
        model = CaseStudy
        fields = [
            "id",
            "title",
            "slug",
            "client_name",
            "industry",
            "country",
            "challenge",
            "solution",
            "results",
            "quote",
            "quote_author",
            "quote_role",
            "image",
            "image_id",
            "order",
            "status",
            "version",
            "created_by",
            "updated_by",
            "published_at",
            "scheduled_publish_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "version",
            "created_by",
            "published_at",
            "created_at",
            "updated_at",
        ]


class ContentRevisionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContentRevision
        fields = [
            "id",
            "content_type",
            "object_id",
            "revision_number",
            "data",
            "status_at_revision",
            "created_by",
            "created_at",
        ]


class SiteSettingsAdminSerializer(serializers.ModelSerializer):
    default_og_image_id = serializers.PrimaryKeyRelatedField(
        queryset=MediaAsset.objects.all(),
        source="default_og_image",
        write_only=True,
        required=False,
        allow_null=True,
    )

    class Meta:
        model = SiteSettings
        fields = [
            "currency_rates",
            "company_phone",
            "company_email",
            "company_address",
            "social_links",
            "default_og_image",
            "default_og_image_id",
            "google_analytics_id",
            "robots_txt_extra",
            "organization_schema",
            "updated_at",
        ]
        read_only_fields = ["updated_at"]


class DocumentationPageAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentationPage
        fields = [
            "id",
            "title",
            "slug",
            "content",
            "order",
            "status",
            "version",
            "created_by",
            "updated_by",
            "published_at",
            "scheduled_publish_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "version",
            "created_by",
            "published_at",
            "created_at",
            "updated_at",
        ]


class APIEndpointGroupAdminSerializer(serializers.ModelSerializer):
    endpoints = APIEndpointSerializer(many=True, read_only=True)

    class Meta:
        model = APIEndpointGroup
        fields = [
            "id",
            "name",
            "slug",
            "badge_class",
            "order",
            "is_active",
            "endpoints",
        ]


# ---------------------------------------------------------------------------
# Phase 4: Blog
# ---------------------------------------------------------------------------


class BlogCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = BlogCategory
        fields = ["id", "name", "slug", "description", "order"]


class BlogPostSerializer(serializers.ModelSerializer):
    featured_image = MediaAssetSerializer(read_only=True)
    author_avatar = MediaAssetSerializer(read_only=True)
    category = BlogCategorySerializer(read_only=True)

    class Meta:
        model = BlogPost
        fields = [
            "id",
            "title",
            "slug",
            "excerpt",
            "body",
            "featured_image",
            "category",
            "author_name",
            "author_avatar",
            "seo_keywords",
            "reading_time_minutes",
            "is_featured",
            "order",
            "published_at",
            "created_at",
        ]


class BlogPostAdminSerializer(serializers.ModelSerializer):
    featured_image_id = serializers.PrimaryKeyRelatedField(
        queryset=MediaAsset.objects.all(),
        source="featured_image",
        write_only=True,
        required=False,
        allow_null=True,
    )
    author_avatar_id = serializers.PrimaryKeyRelatedField(
        queryset=MediaAsset.objects.all(),
        source="author_avatar",
        write_only=True,
        required=False,
        allow_null=True,
    )
    featured_image = MediaAssetSerializer(read_only=True)
    author_avatar = MediaAssetSerializer(read_only=True)
    category = BlogCategorySerializer(read_only=True)

    class Meta:
        model = BlogPost
        fields = [
            "id",
            "title",
            "slug",
            "excerpt",
            "body",
            "featured_image",
            "featured_image_id",
            "category",
            "author_name",
            "author_avatar",
            "author_avatar_id",
            "seo_keywords",
            "reading_time_minutes",
            "is_featured",
            "order",
            "status",
            "version",
            "created_by",
            "updated_by",
            "published_at",
            "scheduled_publish_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "version",
            "created_by",
            "published_at",
            "created_at",
            "updated_at",
        ]


# ---------------------------------------------------------------------------
# Phase 4: Email Templates
# ---------------------------------------------------------------------------


class EmailTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailTemplate
        fields = [
            "id",
            "name",
            "slug",
            "subject",
            "body_html",
            "body_text",
            "trigger_type",
            "available_variables",
            "preview_data",
        ]


class EmailTemplateAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailTemplate
        fields = [
            "id",
            "name",
            "slug",
            "subject",
            "body_html",
            "body_text",
            "trigger_type",
            "available_variables",
            "preview_data",
            "status",
            "version",
            "created_by",
            "updated_by",
            "published_at",
            "scheduled_publish_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "version",
            "created_by",
            "published_at",
            "created_at",
            "updated_at",
        ]


# ---------------------------------------------------------------------------
# Phase 4: Testimonials
# ---------------------------------------------------------------------------


class TestimonialSerializer(serializers.ModelSerializer):
    avatar = MediaAssetSerializer(read_only=True)

    class Meta:
        model = Testimonial
        fields = [
            "id",
            "quote",
            "author_name",
            "author_role",
            "company_name",
            "industry",
            "avatar",
            "rating",
            "placement",
            "order",
        ]


class TestimonialAdminSerializer(serializers.ModelSerializer):
    avatar_id = serializers.PrimaryKeyRelatedField(
        queryset=MediaAsset.objects.all(),
        source="avatar",
        write_only=True,
        required=False,
        allow_null=True,
    )
    avatar = MediaAssetSerializer(read_only=True)

    class Meta:
        model = Testimonial
        fields = [
            "id",
            "quote",
            "author_name",
            "author_role",
            "company_name",
            "industry",
            "avatar",
            "avatar_id",
            "rating",
            "placement",
            "order",
            "status",
            "version",
            "created_by",
            "updated_by",
            "published_at",
            "scheduled_publish_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "version",
            "created_by",
            "published_at",
            "created_at",
            "updated_at",
        ]


# ---------------------------------------------------------------------------
# Phase 4: Regional Variants
# ---------------------------------------------------------------------------


class RegionalVariantSerializer(serializers.ModelSerializer):
    image_override = MediaAssetSerializer(read_only=True)

    class Meta:
        model = RegionalVariant
        fields = [
            "id",
            "content_type",
            "object_id",
            "region",
            "language",
            "title_override",
            "body_override",
            "image_override",
            "cta_link_override",
            "data_override",
        ]


class RegionalVariantAdminSerializer(serializers.ModelSerializer):
    image_override_id = serializers.PrimaryKeyRelatedField(
        queryset=MediaAsset.objects.all(),
        source="image_override",
        write_only=True,
        required=False,
        allow_null=True,
    )
    image_override = MediaAssetSerializer(read_only=True)

    class Meta:
        model = RegionalVariant
        fields = [
            "id",
            "content_type",
            "object_id",
            "region",
            "language",
            "title_override",
            "body_override",
            "image_override",
            "image_override_id",
            "cta_link_override",
            "data_override",
        ]


class APIEndpointAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = APIEndpoint
        fields = ["id", "group", "method", "path", "description", "order"]


# ---------------------------------------------------------------------------
# Tag & Scanner
# ---------------------------------------------------------------------------


class TagCategorySerializer(serializers.ModelSerializer):
    image = MediaAssetSerializer(read_only=True)

    class Meta:
        model = TagCategory
        fields = [
            "id",
            "name",
            "slug",
            "icon",
            "description",
            "environment",
            "range_category",
            "application",
            "image",
            "order",
        ]


class TagCategoryAdminSerializer(serializers.ModelSerializer):
    image = MediaAssetSerializer(read_only=True)
    image_id = serializers.PrimaryKeyRelatedField(
        queryset=MediaAsset.objects.all(),
        source="image",
        write_only=True,
        required=False,
        allow_null=True,
    )

    class Meta:
        model = TagCategory
        fields = [
            "id",
            "name",
            "slug",
            "icon",
            "description",
            "environment",
            "range_category",
            "application",
            "image",
            "image_id",
            "order",
            "status",
            "version",
            "created_by",
            "updated_by",
            "published_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "version",
            "created_by",
            "published_at",
            "created_at",
            "updated_at",
        ]


class ScannerFeatureSerializer(serializers.ModelSerializer):
    image = MediaAssetSerializer(read_only=True)

    class Meta:
        model = ScannerFeature
        fields = [
            "id",
            "title",
            "slug",
            "description",
            "icon",
            "feature_type",
            "specs",
            "image",
            "order",
        ]


class ScannerFeatureAdminSerializer(serializers.ModelSerializer):
    image = MediaAssetSerializer(read_only=True)
    image_id = serializers.PrimaryKeyRelatedField(
        queryset=MediaAsset.objects.all(),
        source="image",
        write_only=True,
        required=False,
        allow_null=True,
    )

    class Meta:
        model = ScannerFeature
        fields = [
            "id",
            "title",
            "slug",
            "description",
            "icon",
            "feature_type",
            "specs",
            "image",
            "image_id",
            "order",
            "status",
            "version",
            "created_by",
            "updated_by",
            "published_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "version",
            "created_by",
            "published_at",
            "created_at",
            "updated_at",
        ]


class PageMetaAdminSerializer(serializers.ModelSerializer):
    og_image_id = serializers.PrimaryKeyRelatedField(
        queryset=MediaAsset.objects.all(),
        source="og_image",
        write_only=True,
        required=False,
        allow_null=True,
    )

    class Meta:
        model = PageMeta
        fields = [
            "id",
            "route",
            "title",
            "description",
            "og_image",
            "og_image_id",
            "canonical_url",
            "is_indexed",
            "structured_data",
            "hreflang_alternates",
            "updated_at",
        ]
        read_only_fields = ["id", "updated_at"]
