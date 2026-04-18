from rest_framework import serializers


class PublishValidationError(Exception):
    """Raised when content fails validation on publish."""

    def __init__(self, errors):
        self.errors = errors
        super().__init__(str(errors))


def validate_for_publish(instance):
    """Validate content before allowing transition to 'published'.

    Raises PublishValidationError with structured error dict.
    """
    from apps.cms.models import (
        HeroSection,
        ServiceOffering,
        CaseStudy,
        PricingPlan,
        PageMeta,
        DocumentationPage,
        TagCategory,
        ScannerFeature,
        BlogPost,
        EmailTemplate,
        Testimonial,
    )

    errors = {}

    if isinstance(instance, HeroSection):
        if not instance.headline:
            errors["headline"] = "Headline is required for publishing."
        if not instance.cta_primary_text:
            errors["cta_primary_text"] = "Primary CTA text is required."
        if not instance.cta_primary_link:
            errors["cta_primary_link"] = "Primary CTA link is required."

    elif isinstance(instance, ServiceOffering):
        for field in ("problem", "process", "result"):
            if not getattr(instance, field):
                errors[field] = f"{field.title()} is required for publishing."
        if not instance.deliverables:
            errors["deliverables"] = "Deliverables list is required."

    elif isinstance(instance, CaseStudy):
        for field in ("challenge", "solution"):
            if not getattr(instance, field):
                errors[field] = f"{field.title()} is required for publishing."
        if not instance.results:
            errors["results"] = "Results are required for publishing."

    elif isinstance(instance, PricingPlan):
        if instance.price_usd <= 0:
            errors["price_usd"] = "USD price must be greater than 0."

    elif isinstance(instance, PageMeta):
        if len(instance.title) > 60:
            errors["title"] = "SEO title must be ≤ 60 characters."
        if len(instance.description) > 160:
            errors["description"] = "Meta description must be ≤ 160 characters."
        if instance.og_image:
            asset = instance.og_image
            if asset.width and asset.height:
                if asset.width < 1200 or asset.height < 630:
                    errors["og_image"] = "OG image must be at least 1200×630px."

    elif isinstance(instance, DocumentationPage):
        if not instance.content:
            errors["content"] = "Content is required for publishing."

    elif isinstance(instance, BlogPost):
        if not instance.title:
            errors["title"] = "Title is required for publishing."
        if not instance.body:
            errors["body"] = "Body is required for publishing."
        if not instance.excerpt:
            errors["excerpt"] = "Excerpt is required for publishing."
        if not instance.author_name:
            errors["author_name"] = "Author name is required for publishing."

    elif isinstance(instance, EmailTemplate):
        if not instance.subject:
            errors["subject"] = "Subject is required for publishing."
        if not instance.body_html:
            errors["body_html"] = "HTML body is required for publishing."

    elif isinstance(instance, Testimonial):
        if not instance.quote:
            errors["quote"] = "Quote text is required for publishing."
        if not instance.author_name:
            errors["author_name"] = "Author name is required for publishing."
        if not instance.company_name:
            errors["company_name"] = "Company name is required for publishing."

    elif isinstance(instance, TagCategory):
        if not instance.name:
            errors["name"] = "Name is required for publishing."
        if not instance.description:
            errors["description"] = "Description is required for publishing."
        if not instance.environment:
            errors["environment"] = "Environment is required for publishing."
        if not instance.range_category:
            errors["range_category"] = "Range category is required for publishing."

    elif isinstance(instance, ScannerFeature):
        if not instance.title:
            errors["title"] = "Title is required for publishing."
        if not instance.description:
            errors["description"] = "Description is required for publishing."

    if errors:
        raise PublishValidationError(errors)
