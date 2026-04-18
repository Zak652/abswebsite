import uuid

from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models

from apps.cms.mixins import PublishableMixin


# ---------------------------------------------------------------------------
# Core Infrastructure
# ---------------------------------------------------------------------------


class ContentRevision(models.Model):
    """Auto-snapshot of any PublishableMixin model on save."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.CharField(max_length=255)
    content_object = GenericForeignKey("content_type", "object_id")
    revision_number = models.IntegerField()
    data = models.JSONField()
    status_at_revision = models.CharField(max_length=20)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "cms_content_revision"
        ordering = ["-revision_number"]
        indexes = [
            models.Index(fields=["content_type", "object_id"]),
        ]

    def __str__(self):
        return f"Rev {self.revision_number} of {self.content_type} #{self.object_id}"


class AssetTag(models.Model):
    """Tags for organising media assets."""

    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(unique=True)

    class Meta:
        db_table = "cms_asset_tag"
        ordering = ["name"]

    def __str__(self):
        return self.name


class MediaAsset(models.Model):
    """Centralised media library."""

    ASSET_TYPE_CHOICES = [
        ("image", "Image"),
        ("video", "Video"),
        ("document", "Document"),
        ("diagram", "Diagram"),
    ]
    PROCESSING_STATUS_CHOICES = [
        ("pending", "Pending"),
        ("processing", "Processing"),
        ("completed", "Completed"),
        ("failed", "Failed"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    file = models.FileField(upload_to="media_assets/%Y/%m/")
    asset_type = models.CharField(max_length=20, choices=ASSET_TYPE_CHOICES)
    filename = models.CharField(max_length=255)
    alt_text = models.CharField(max_length=255, blank=True)
    caption = models.CharField(max_length=500, blank=True)
    file_size = models.IntegerField(default=0)
    width = models.IntegerField(null=True, blank=True)
    height = models.IntegerField(null=True, blank=True)
    file_webp = models.FileField(upload_to="media_assets/%Y/%m/webp/", blank=True)
    file_thumbnail = models.FileField(upload_to="media_assets/%Y/%m/thumb/", blank=True)
    file_medium = models.FileField(upload_to="media_assets/%Y/%m/medium/", blank=True)
    file_large = models.FileField(upload_to="media_assets/%Y/%m/large/", blank=True)
    processing_status = models.CharField(
        max_length=20, choices=PROCESSING_STATUS_CHOICES, default="pending"
    )
    tags = models.ManyToManyField(AssetTag, blank=True, related_name="assets")
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="media_assets"
    )
    usage_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "cms_media_asset"
        ordering = ["-created_at"]

    def __str__(self):
        return self.filename


class ProductImage(models.Model):
    """Multi-image galleries per product (5-layer visual system)."""

    IMAGE_TYPE_CHOICES = [
        ("hero", "Hero"),
        ("context", "Context"),
        ("detail", "Detail"),
        ("workflow", "Workflow"),
        ("config", "Configuration"),
    ]

    product = models.ForeignKey(
        "products.Product", on_delete=models.CASCADE, related_name="gallery_images"
    )
    asset = models.ForeignKey(MediaAsset, on_delete=models.PROTECT)
    image_type = models.CharField(max_length=20, choices=IMAGE_TYPE_CHOICES)
    alt_text = models.CharField(max_length=255)
    caption = models.CharField(max_length=500, blank=True)
    order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "cms_product_image"
        ordering = ["image_type", "order"]

    def __str__(self):
        return f"{self.product.name} — {self.image_type} #{self.order}"


# ---------------------------------------------------------------------------
# Site-Wide Models
# ---------------------------------------------------------------------------


class SiteSettingsManager(models.Manager):
    def get(self, **kwargs):
        obj, _ = self.get_or_create(pk=1)
        return obj


class SiteSettings(models.Model):
    """Singleton for site-wide configuration."""

    currency_rates = models.JSONField(
        default=dict, help_text='e.g. {"USD": 1, "UGX": 3700, "KES": 130}'
    )
    company_phone = models.CharField(max_length=50, blank=True)
    company_email = models.CharField(max_length=255, blank=True)
    company_address = models.TextField(blank=True)
    social_links = models.JSONField(default=dict)
    default_og_image = models.ForeignKey(
        MediaAsset,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",
    )
    google_analytics_id = models.CharField(max_length=50, blank=True)
    robots_txt_extra = models.TextField(blank=True)
    organization_schema = models.JSONField(default=dict, blank=True)
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",
    )
    updated_at = models.DateTimeField(auto_now=True)

    objects = SiteSettingsManager()

    class Meta:
        db_table = "cms_site_settings"
        verbose_name = "site settings"
        verbose_name_plural = "site settings"

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    def __str__(self):
        return "Site Settings"


class PageMeta(models.Model):
    """SEO metadata per route."""

    route = models.CharField(max_length=255, unique=True)
    title = models.CharField(max_length=60)
    description = models.TextField(max_length=160)
    og_image = models.ForeignKey(
        MediaAsset,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",
    )
    canonical_url = models.CharField(max_length=500, blank=True)
    is_indexed = models.BooleanField(default=True)
    structured_data = models.JSONField(default=dict, blank=True)
    hreflang_alternates = models.JSONField(default=dict, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "cms_page_meta"
        ordering = ["route"]

    def __str__(self):
        return f"Meta: {self.route}"


# ---------------------------------------------------------------------------
# Page Content Models (Publishable)
# ---------------------------------------------------------------------------


class HeroSection(PublishableMixin):
    """One hero section per page."""

    VARIANT_CHOICES = [
        ("overlay", "Overlay"),
        ("split", "Split"),
    ]

    page = models.CharField(max_length=100, unique=True)
    headline = models.CharField(max_length=255)
    subheadline = models.TextField()
    cta_primary_text = models.CharField(max_length=100)
    cta_primary_link = models.CharField(max_length=500)
    cta_secondary_text = models.CharField(max_length=100, blank=True)
    cta_secondary_link = models.CharField(max_length=500, blank=True)
    background_image = models.ForeignKey(
        MediaAsset,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",
    )
    variant = models.CharField(
        max_length=20, choices=VARIANT_CHOICES, default="overlay"
    )
    eyebrow = models.CharField(max_length=255, blank=True)
    badges = models.JSONField(default=list, blank=True)

    class Meta:
        db_table = "cms_hero_section"
        verbose_name = "hero section"

    def __str__(self):
        return f"Hero: {self.page}"


class PageBlock(PublishableMixin):
    """Flexible content blocks, multiple per page."""

    BLOCK_TYPE_CHOICES = [
        ("hero", "Hero"),
        ("feature_grid", "Feature Grid"),
        ("guided_path", "Guided Path"),
        ("workflow", "Workflow"),
        ("pricing", "Pricing"),
        ("text", "Text"),
        ("cta_banner", "CTA Banner"),
        ("stats_row", "Stats Row"),
        ("image_text", "Image + Text"),
        ("video", "Video"),
    ]

    page = models.CharField(max_length=100, db_index=True)
    block_type = models.CharField(max_length=30, choices=BLOCK_TYPE_CHOICES)
    title = models.CharField(max_length=255, blank=True)
    body = models.TextField(blank=True)
    image = models.ForeignKey(
        MediaAsset,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",
    )
    video_url = models.CharField(max_length=500, blank=True)
    icon = models.CharField(max_length=100, blank=True)
    link_url = models.CharField(max_length=500, blank=True)
    link_text = models.CharField(max_length=100, blank=True)
    data = models.JSONField(default=dict, blank=True)
    order = models.IntegerField(default=0)

    class Meta:
        db_table = "cms_page_block"
        ordering = ["page", "order"]

    def __str__(self):
        return f"Block: {self.page} — {self.block_type} #{self.order}"


class NavigationItem(models.Model):
    """Header/footer navigation links."""

    LOCATION_CHOICES = [
        ("header_main", "Header — Main"),
        ("footer_platform", "Footer — Platform"),
        ("footer_resources", "Footer — Resources"),
    ]

    label = models.CharField(max_length=100)
    url = models.CharField(max_length=500)
    parent = models.ForeignKey(
        "self",
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="children",
    )
    location = models.CharField(max_length=20, choices=LOCATION_CHOICES)
    column = models.CharField(max_length=100, blank=True)
    order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "cms_navigation_item"
        ordering = ["location", "order"]

    def __str__(self):
        return f"{self.location}: {self.label}"


# ---------------------------------------------------------------------------
# Domain Content Models (Publishable)
# ---------------------------------------------------------------------------


class ServiceOffering(PublishableMixin):
    """Marketing service cards (independent of ServiceRequest.service_type)."""

    title = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    icon = models.CharField(max_length=100)
    short_description = models.TextField()
    problem = models.TextField()
    process = models.TextField()
    deliverables = models.JSONField(default=list)
    result = models.TextField()
    image = models.ForeignKey(
        MediaAsset,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",
    )
    order = models.IntegerField(default=0)

    class Meta:
        db_table = "cms_service_offering"
        ordering = ["order"]

    def __str__(self):
        return self.title


class ArcplusModule(PublishableMixin):
    """Arcplus platform modules."""

    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    tagline = models.CharField(max_length=255)
    description = models.TextField()
    icon = models.CharField(max_length=100)
    features = models.JSONField(default=list)
    image = models.ForeignKey(
        MediaAsset,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",
    )
    order = models.IntegerField(default=0)

    class Meta:
        db_table = "cms_arcplus_module"
        ordering = ["order"]

    def __str__(self):
        return self.name


class PricingPlan(PublishableMixin):
    """Arcplus pricing plans."""

    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    tagline = models.CharField(max_length=255)
    asset_range = models.CharField(max_length=100)
    price_usd = models.DecimalField(max_digits=10, decimal_places=2)
    price_ugx = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True
    )
    price_kes = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True
    )
    price_monthly_usd = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    billing_period = models.CharField(max_length=20, default="year")
    is_recommended = models.BooleanField(default=False)
    cta_text = models.CharField(max_length=100)
    cta_link = models.CharField(max_length=500)
    order = models.IntegerField(default=0)

    class Meta:
        db_table = "cms_pricing_plan"
        ordering = ["order"]

    def __str__(self):
        return self.name


class PlanFeature(models.Model):
    """Feature rows for the pricing comparison matrix."""

    name = models.CharField(max_length=255)
    category = models.CharField(max_length=100, blank=True)
    order = models.IntegerField(default=0)

    class Meta:
        db_table = "cms_plan_feature"
        ordering = ["order"]

    def __str__(self):
        return self.name


class PlanFeatureValue(models.Model):
    """Through table: feature value per plan."""

    plan = models.ForeignKey(
        PricingPlan, on_delete=models.CASCADE, related_name="feature_values"
    )
    feature = models.ForeignKey(
        PlanFeature, on_delete=models.CASCADE, related_name="plan_values"
    )
    value = models.CharField(max_length=255)
    is_included = models.BooleanField(default=True)

    class Meta:
        db_table = "cms_plan_feature_value"
        unique_together = [("plan", "feature")]

    def __str__(self):
        return f"{self.plan.name} — {self.feature.name}: {self.value}"


class SupportTier(PublishableMixin):
    """Support tier comparison (Starter, Growth, Professional, Enterprise)."""

    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    plan = models.ForeignKey(
        PricingPlan,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="support_tiers",
    )
    order = models.IntegerField(default=0)

    class Meta:
        db_table = "cms_support_tier"
        ordering = ["order"]

    def __str__(self):
        return self.name


class SupportFeature(models.Model):
    """Support feature rows (First Response Time, Support Channels, etc.)."""

    name = models.CharField(max_length=255)
    order = models.IntegerField(default=0)

    class Meta:
        db_table = "cms_support_feature"
        ordering = ["order"]

    def __str__(self):
        return self.name


class SupportFeatureValue(models.Model):
    """Through table: support feature value per tier."""

    tier = models.ForeignKey(
        SupportTier, on_delete=models.CASCADE, related_name="feature_values"
    )
    feature = models.ForeignKey(
        SupportFeature, on_delete=models.CASCADE, related_name="tier_values"
    )
    value = models.CharField(max_length=255)

    class Meta:
        db_table = "cms_support_feature_value"
        unique_together = [("tier", "feature")]

    def __str__(self):
        return f"{self.tier.name} — {self.feature.name}: {self.value}"


class CaseStudy(PublishableMixin):
    """Customer case studies."""

    title = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    client_name = models.CharField(max_length=255)
    industry = models.CharField(max_length=100)
    country = models.CharField(max_length=100, blank=True)
    challenge = models.TextField()
    solution = models.TextField()
    results = models.JSONField(default=list)
    quote = models.TextField(blank=True)
    quote_author = models.CharField(max_length=255, blank=True)
    quote_role = models.CharField(max_length=255, blank=True)
    image = models.ForeignKey(
        MediaAsset,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",
    )
    order = models.IntegerField(default=0)

    class Meta:
        db_table = "cms_case_study"
        ordering = ["order"]
        verbose_name_plural = "case studies"

    def __str__(self):
        return self.title


class DocumentationPage(PublishableMixin):
    """Documentation section (Getting Started, Asset Fields, etc.)."""

    title = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    content = models.TextField(help_text="HTML content for the documentation section.")
    order = models.IntegerField(default=0)

    class Meta:
        db_table = "cms_documentation_page"
        ordering = ["order"]

    def __str__(self):
        return self.title


class APIEndpointGroup(models.Model):
    """API reference endpoint group (Products, Services, etc.)."""

    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    badge_class = models.CharField(
        max_length=200,
        blank=True,
        help_text="CSS classes for the group badge.",
    )
    order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "cms_api_endpoint_group"
        ordering = ["order"]

    def __str__(self):
        return self.name


class APIEndpoint(models.Model):
    """Individual API endpoint within a group."""

    group = models.ForeignKey(
        APIEndpointGroup,
        on_delete=models.CASCADE,
        related_name="endpoints",
    )
    method = models.CharField(max_length=10)
    path = models.CharField(max_length=255)
    description = models.CharField(max_length=500)
    order = models.IntegerField(default=0)

    class Meta:
        db_table = "cms_api_endpoint"
        ordering = ["order"]

    def __str__(self):
        return f"{self.method} {self.path}"


# ---------------------------------------------------------------------------
# Tag & Scanner Dedicated Models
# ---------------------------------------------------------------------------


class TagCategory(PublishableMixin, models.Model):
    """Dedicated model for asset tag types with filterable metadata."""

    RANGE_CHOICES = [
        ("short", "Short"),
        ("medium", "Medium"),
        ("long", "Long"),
        ("gps", "GPS"),
    ]

    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    icon = models.CharField(max_length=50, blank=True)
    description = models.TextField(blank=True)
    environment = models.CharField(max_length=100, blank=True)
    range_category = models.CharField(max_length=20, choices=RANGE_CHOICES, blank=True)
    application = models.CharField(max_length=100, blank=True)
    image = models.ForeignKey(
        MediaAsset,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="tag_categories",
    )
    order = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "cms_tag_category"
        ordering = ["order"]
        verbose_name_plural = "tag categories"

    def __str__(self):
        return self.name


class ScannerFeature(PublishableMixin, models.Model):
    """Dedicated model for scanner capability highlights."""

    FEATURE_TYPE_CHOICES = [
        ("durability", "Durability"),
        ("precision", "Precision"),
        ("validation", "Validation"),
        ("configurator", "Configurator"),
    ]

    title = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=50, blank=True)
    feature_type = models.CharField(
        max_length=30, choices=FEATURE_TYPE_CHOICES, blank=True
    )
    specs = models.JSONField(default=list, blank=True)
    image = models.ForeignKey(
        MediaAsset,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="scanner_features",
    )
    order = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "cms_scanner_feature"
        ordering = ["order"]

    def __str__(self):
        return self.title


# ---------------------------------------------------------------------------
# Phase 4: Extended Content Types
# ---------------------------------------------------------------------------


class BlogCategory(models.Model):
    """Blog post category."""

    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    order = models.IntegerField(default=0)

    class Meta:
        db_table = "cms_blog_category"
        ordering = ["order"]
        verbose_name_plural = "blog categories"

    def __str__(self):
        return self.name


class BlogPost(PublishableMixin):
    """Blog article / news post."""

    title = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    excerpt = models.TextField(help_text="Short preview text for listings.")
    body = models.TextField(help_text="Full article content.")
    featured_image = models.ForeignKey(
        MediaAsset,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="+",
    )
    category = models.ForeignKey(
        BlogCategory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="posts",
    )
    author_name = models.CharField(max_length=150)
    author_avatar = models.ForeignKey(
        MediaAsset,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="+",
    )
    seo_keywords = models.CharField(max_length=500, blank=True)
    reading_time_minutes = models.IntegerField(null=True, blank=True)
    is_featured = models.BooleanField(default=False)
    order = models.IntegerField(default=0)

    class Meta:
        db_table = "cms_blog_post"
        ordering = ["-created_at"]

    def __str__(self):
        return self.title


class EmailTemplate(PublishableMixin):
    """CMS-managed email template with variable substitution."""

    TRIGGER_CHOICES = [
        ("trial_welcome", "Trial Welcome"),
        ("trial_reminder_7d", "Trial Reminder (7 days)"),
        ("trial_reminder_3d", "Trial Reminder (3 days)"),
        ("trial_expired", "Trial Expired"),
        ("quote_received", "Quote Received"),
        ("quote_received_admin", "Quote Received (Admin)"),
        ("quote_response", "Quote Response"),
        ("training_confirmation", "Training Confirmation"),
        ("service_request", "Service Request"),
        ("payment_receipt", "Payment Receipt"),
    ]

    name = models.CharField(max_length=150)
    slug = models.SlugField(unique=True)
    subject = models.CharField(max_length=255)
    body_html = models.TextField(
        help_text="HTML email body with {{variable}} placeholders."
    )
    body_text = models.TextField(blank=True, help_text="Plain text fallback.")
    trigger_type = models.CharField(max_length=30, choices=TRIGGER_CHOICES, unique=True)
    available_variables = models.JSONField(
        default=list,
        help_text='List of available variables, e.g. ["{{user.full_name}}", "{{trial.expiry_date}}"]',
    )
    preview_data = models.JSONField(
        default=dict,
        help_text="Sample data for admin preview rendering.",
    )

    class Meta:
        db_table = "cms_email_template"
        ordering = ["name"]

    def __str__(self):
        return self.name


class Testimonial(PublishableMixin):
    """Customer testimonial / social proof quote."""

    PLACEMENT_CHOICES = [
        ("homepage", "Homepage"),
        ("arcplus", "Arcplus"),
        ("services", "Services"),
        ("global", "Global (all pages)"),
    ]

    quote = models.TextField()
    author_name = models.CharField(max_length=150)
    author_role = models.CharField(max_length=150, blank=True)
    company_name = models.CharField(max_length=150)
    industry = models.CharField(max_length=100, blank=True)
    avatar = models.ForeignKey(
        MediaAsset,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="+",
    )
    rating = models.IntegerField(null=True, blank=True, help_text="1-5 stars")
    placement = models.CharField(
        max_length=20, choices=PLACEMENT_CHOICES, default="global"
    )
    order = models.IntegerField(default=0)

    class Meta:
        db_table = "cms_testimonial"
        ordering = ["order"]

    def __str__(self):
        return f"{self.author_name} — {self.company_name}"


class RegionalVariant(models.Model):
    """Region/language-specific content override via generic relation."""

    REGION_CHOICES = [
        ("ug", "Uganda"),
        ("ke", "Kenya"),
        ("global", "Global"),
    ]
    LANGUAGE_CHOICES = [
        ("en", "English"),
        ("sw", "Swahili"),
    ]

    content_type = models.ForeignKey(
        "contenttypes.ContentType",
        on_delete=models.CASCADE,
    )
    object_id = models.CharField(max_length=255)
    region = models.CharField(max_length=10, choices=REGION_CHOICES)
    language = models.CharField(max_length=5, choices=LANGUAGE_CHOICES, default="en")
    title_override = models.CharField(max_length=255, blank=True)
    body_override = models.TextField(blank=True)
    image_override = models.ForeignKey(
        MediaAsset,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="+",
    )
    cta_link_override = models.CharField(max_length=500, blank=True)
    data_override = models.JSONField(
        null=True, blank=True, help_text="Arbitrary override data."
    )

    class Meta:
        db_table = "cms_regional_variant"
        unique_together = ["content_type", "object_id", "region", "language"]

    def __str__(self):
        return f"{self.content_type} #{self.object_id} ({self.region}/{self.language})"
