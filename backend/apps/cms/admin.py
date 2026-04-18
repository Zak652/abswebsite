from django.contrib import admin
from django.utils.html import format_html

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
# Inlines
# ---------------------------------------------------------------------------


class PlanFeatureValueInline(admin.TabularInline):
    model = PlanFeatureValue
    extra = 1


class SupportFeatureValueInline(admin.TabularInline):
    model = SupportFeatureValue
    extra = 1


class NavigationChildInline(admin.TabularInline):
    model = NavigationItem
    fk_name = "parent"
    extra = 1
    fields = ["label", "url", "order", "is_active"]


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1
    fields = ["asset", "image_type", "alt_text", "order", "is_active"]


class APIEndpointInline(admin.TabularInline):
    model = APIEndpoint
    extra = 1
    fields = ["method", "path", "description", "order"]


# ---------------------------------------------------------------------------
# Publishable admin mixin
# ---------------------------------------------------------------------------


class PublishableAdmin(admin.ModelAdmin):
    list_filter = ["status"]
    readonly_fields = [
        "version",
        "created_by",
        "updated_by",
        "approved_by",
        "approved_at",
        "published_at",
        "created_at",
        "updated_at",
    ]
    actions = ["publish_selected", "archive_selected"]

    def status_badge(self, obj):
        colors = {
            "draft": "#999",
            "review": "#f0ad4e",
            "approved": "#5bc0de",
            "published": "#5cb85c",
            "archived": "#d9534f",
        }
        color = colors.get(obj.status, "#999")
        return format_html(
            '<span style="background:{}; color:#fff; padding:2px 8px; '
            'border-radius:4px; font-size:11px;">{}</span>',
            color,
            obj.get_status_display(),
        )

    status_badge.short_description = "Status"

    @admin.action(description="Publish selected items")
    def publish_selected(self, request, queryset):
        queryset.filter(status="approved").update(status="published")

    @admin.action(description="Archive selected items")
    def archive_selected(self, request, queryset):
        queryset.update(status="archived")


# ---------------------------------------------------------------------------
# Model Registrations
# ---------------------------------------------------------------------------


@admin.register(SiteSettings)
class SiteSettingsAdmin(admin.ModelAdmin):
    list_display = ["__str__", "updated_at"]

    def has_add_permission(self, request):
        return not SiteSettings.objects.exists()


@admin.register(PageMeta)
class PageMetaAdmin(admin.ModelAdmin):
    list_display = ["route", "title", "is_indexed", "updated_at"]
    search_fields = ["route", "title"]


@admin.register(MediaAsset)
class MediaAssetAdmin(admin.ModelAdmin):
    list_display = [
        "filename",
        "asset_type",
        "processing_status",
        "file_size",
        "usage_count",
        "created_at",
    ]
    list_filter = ["asset_type", "processing_status"]
    search_fields = ["filename", "alt_text"]
    filter_horizontal = ["tags"]


@admin.register(AssetTag)
class AssetTagAdmin(admin.ModelAdmin):
    list_display = ["name", "slug"]
    prepopulated_fields = {"slug": ("name",)}


@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
    list_display = ["product", "image_type", "order", "is_active"]
    list_filter = ["image_type", "is_active"]


@admin.register(HeroSection)
class HeroSectionAdmin(PublishableAdmin):
    list_display = ["page", "headline", "status_badge", "version"]
    search_fields = ["page", "headline"]


@admin.register(PageBlock)
class PageBlockAdmin(PublishableAdmin):
    list_display = ["page", "block_type", "title", "order", "status_badge"]
    list_filter = ["status", "page", "block_type"]
    search_fields = ["page", "title"]


@admin.register(NavigationItem)
class NavigationItemAdmin(admin.ModelAdmin):
    list_display = ["label", "url", "location", "order", "is_active"]
    list_filter = ["location", "is_active"]
    inlines = [NavigationChildInline]


@admin.register(ServiceOffering)
class ServiceOfferingAdmin(PublishableAdmin):
    list_display = ["title", "slug", "order", "status_badge"]
    prepopulated_fields = {"slug": ("title",)}


@admin.register(ArcplusModule)
class ArcplusModuleAdmin(PublishableAdmin):
    list_display = ["name", "slug", "order", "status_badge"]
    prepopulated_fields = {"slug": ("name",)}


@admin.register(PricingPlan)
class PricingPlanAdmin(PublishableAdmin):
    list_display = ["name", "price_usd", "is_recommended", "order", "status_badge"]
    prepopulated_fields = {"slug": ("name",)}
    inlines = [PlanFeatureValueInline]


@admin.register(PlanFeature)
class PlanFeatureAdmin(admin.ModelAdmin):
    list_display = ["name", "category", "order"]


@admin.register(SupportTier)
class SupportTierAdmin(PublishableAdmin):
    list_display = ["name", "slug", "order", "status_badge"]
    prepopulated_fields = {"slug": ("name",)}
    inlines = [SupportFeatureValueInline]


@admin.register(SupportFeature)
class SupportFeatureAdmin(admin.ModelAdmin):
    list_display = ["name", "order"]


@admin.register(CaseStudy)
class CaseStudyAdmin(PublishableAdmin):
    list_display = ["title", "client_name", "industry", "order", "status_badge"]
    prepopulated_fields = {"slug": ("title",)}


@admin.register(TagCategory)
class TagCategoryAdmin(PublishableAdmin):
    list_display = [
        "name",
        "environment",
        "range_category",
        "application",
        "order",
        "status_badge",
    ]
    prepopulated_fields = {"slug": ("name",)}
    list_filter = ["status", "range_category", "environment"]


@admin.register(ScannerFeature)
class ScannerFeatureAdmin(PublishableAdmin):
    list_display = ["title", "feature_type", "order", "status_badge"]
    prepopulated_fields = {"slug": ("title",)}
    list_filter = ["status", "feature_type"]


@admin.register(ContentRevision)
class ContentRevisionAdmin(admin.ModelAdmin):
    list_display = [
        "content_type",
        "object_id",
        "revision_number",
        "status_at_revision",
        "created_by",
        "created_at",
    ]
    list_filter = ["content_type"]
    readonly_fields = ["data"]


@admin.register(DocumentationPage)
class DocumentationPageAdmin(PublishableAdmin):
    list_display = ["title", "slug", "order", "status_badge"]
    prepopulated_fields = {"slug": ("title",)}


@admin.register(APIEndpointGroup)
class APIEndpointGroupAdmin(admin.ModelAdmin):
    list_display = ["name", "slug", "order", "is_active"]
    prepopulated_fields = {"slug": ("name",)}
    inlines = [APIEndpointInline]


# ---------------------------------------------------------------------------
# Phase 4
# ---------------------------------------------------------------------------


@admin.register(BlogCategory)
class BlogCategoryAdmin(admin.ModelAdmin):
    list_display = ["name", "slug", "order"]
    prepopulated_fields = {"slug": ("name",)}


@admin.register(BlogPost)
class BlogPostAdmin(PublishableAdmin):
    list_display = ["title", "slug", "author_name", "is_featured", "status_badge"]
    prepopulated_fields = {"slug": ("title",)}
    list_filter = ["status", "category", "is_featured"]
    search_fields = ["title", "excerpt"]


@admin.register(EmailTemplate)
class EmailTemplateAdmin(PublishableAdmin):
    list_display = ["name", "trigger_type", "subject", "status_badge"]
    list_filter = ["status", "trigger_type"]
    search_fields = ["name", "subject"]


@admin.register(Testimonial)
class TestimonialAdmin(PublishableAdmin):
    list_display = [
        "author_name",
        "company_name",
        "placement",
        "rating",
        "order",
        "status_badge",
    ]
    list_filter = ["status", "placement"]
    search_fields = ["author_name", "company_name"]


@admin.register(RegionalVariant)
class RegionalVariantAdmin(admin.ModelAdmin):
    list_display = ["content_type", "object_id", "region", "language"]
    list_filter = ["region", "language"]
