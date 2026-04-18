from django.contrib.contenttypes.models import ContentType
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver

from apps.cms.cache import invalidate_model, revalidate_frontend
from apps.cms.mixins import PublishableMixin
from apps.cms.models import (
    ContentRevision,
    MediaAsset,
    HeroSection,
    PageBlock,
    NavigationItem,
    ServiceOffering,
    ArcplusModule,
    PricingPlan,
    SupportTier,
    CaseStudy,
    SiteSettings,
    PageMeta,
    ProductImage,
    DocumentationPage,
    APIEndpointGroup,
    APIEndpoint,
    TagCategory,
    ScannerFeature,
    BlogCategory,
    BlogPost,
    EmailTemplate,
    Testimonial,
)


# ---------------------------------------------------------------------------
# Auto-create ContentRevision on PublishableMixin model save
# ---------------------------------------------------------------------------

PUBLISHABLE_MODELS = [
    HeroSection,
    PageBlock,
    ServiceOffering,
    ArcplusModule,
    PricingPlan,
    SupportTier,
    CaseStudy,
    DocumentationPage,
    TagCategory,
    ScannerFeature,
    BlogPost,
    EmailTemplate,
    Testimonial,
]

MODEL_CACHE_NAMES = {
    HeroSection: "hero",
    PageBlock: "blocks",
    NavigationItem: "navigation",
    ServiceOffering: "services",
    ArcplusModule: "arcplus_modules",
    PricingPlan: "arcplus_pricing",
    SupportTier: "support_tiers",
    CaseStudy: "case_studies",
    SiteSettings: "settings",
    PageMeta: "meta",
    ProductImage: "product_gallery",
    DocumentationPage: "documentation_pages",
    APIEndpointGroup: "api_endpoint_groups",
    APIEndpoint: "api_endpoint_groups",
    TagCategory: "tag_categories",
    ScannerFeature: "scanner_features",
    BlogCategory: "blog_categories",
    BlogPost: "blog_posts",
    EmailTemplate: "email_templates",
    Testimonial: "testimonials",
}


def _create_revision(instance):
    """Snapshot the instance into a ContentRevision."""
    import uuid as uuid_lib
    from django.forms.models import model_to_dict

    ct = ContentType.objects.get_for_model(instance)
    data = model_to_dict(instance)
    # Convert non-serializable values
    for key, value in data.items():
        if isinstance(value, uuid_lib.UUID):
            data[key] = str(value)
        elif hasattr(value, "isoformat"):
            data[key] = value.isoformat()
        elif hasattr(value, "pk"):
            data[key] = str(value.pk)
        elif isinstance(value, list):
            data[key] = value
    # Remove keys that are not serialisable
    data.pop("id", None)

    # instance.version may be an F() expression if save() hasn't refreshed yet;
    # read the actual value from the DB.
    actual_version = (
        type(instance).objects.values_list("version", flat=True).get(pk=instance.pk)
    )
    data["version"] = actual_version

    ContentRevision.objects.create(
        content_type=ct,
        object_id=str(instance.pk),
        revision_number=actual_version,
        data=data,
        status_at_revision=instance.status,
        created_by=instance.updated_by or instance.created_by,
    )


def _invalidate_cache(instance):
    """Clear cache for the model type and trigger Next.js ISR revalidation."""
    cache_name = MODEL_CACHE_NAMES.get(type(instance))
    if cache_name:
        invalidate_model(cache_name)
        revalidate_frontend(cache_name)


@receiver(post_save)
def on_model_save(sender, instance, **kwargs):
    # Create revision for publishable models
    if sender in PUBLISHABLE_MODELS:
        _create_revision(instance)

    # Invalidate cache
    if sender in MODEL_CACHE_NAMES:
        _invalidate_cache(instance)


@receiver(post_delete)
def on_model_delete(sender, instance, **kwargs):
    if sender in MODEL_CACHE_NAMES:
        _invalidate_cache(instance)


# ---------------------------------------------------------------------------
# Trigger image processing on MediaAsset creation
# ---------------------------------------------------------------------------


@receiver(post_save, sender=MediaAsset)
def trigger_image_processing(sender, instance, created, **kwargs):
    if created and instance.asset_type == "image":
        from apps.cms.tasks import process_media_asset

        process_media_asset.delay(str(instance.pk))
