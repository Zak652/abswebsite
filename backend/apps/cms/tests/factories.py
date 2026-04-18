"""Factories for CMS models using factory_boy."""

import factory
from django.utils import timezone

from apps.accounts.models import User
from apps.cms.models import (
    AssetTag,
    ArcplusModule,
    CaseStudy,
    HeroSection,
    MediaAsset,
    NavigationItem,
    PageBlock,
    PageMeta,
    PlanFeature,
    PlanFeatureValue,
    PricingPlan,
    ProductImage,
    ServiceOffering,
    SiteSettings,
    SupportFeature,
    SupportFeatureValue,
    SupportTier,
    DocumentationPage,
    APIEndpointGroup,
    APIEndpoint,
)


class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = User

    email = factory.Sequence(lambda n: f"user{n}@test.com")
    full_name = factory.Faker("name")
    role = "admin"
    is_staff = True

    @classmethod
    def _create(cls, model_class, *args, **kwargs):
        manager = cls._get_manager(model_class)
        return manager.create_user(password="testpass123", **kwargs)


class AssetTagFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = AssetTag

    name = factory.Sequence(lambda n: f"Tag {n}")
    slug = factory.Sequence(lambda n: f"tag-{n}")


class MediaAssetFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = MediaAsset

    filename = factory.Sequence(lambda n: f"image_{n}.jpg")
    file = factory.django.FileField(filename="test.jpg")
    asset_type = "image"
    alt_text = "Test image"
    file_size = 1024
    uploaded_by = factory.SubFactory(UserFactory)


class SiteSettingsFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = SiteSettings
        django_get_or_create = ()

    company_email = "info@test.com"
    company_phone = "+1234567890"
    company_address = "123 Test St"
    currency_rates = {"USD": 1, "UGX": 3700, "KES": 130}

    @classmethod
    def _create(cls, model_class, *args, **kwargs):
        # SiteSettings enforces pk=1
        instance, _ = model_class.objects.update_or_create(pk=1, defaults=kwargs)
        return instance


class PageMetaFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = PageMeta

    route = factory.Sequence(lambda n: f"/page-{n}")
    title = factory.Sequence(lambda n: f"Page {n} Title")
    description = "A test page description."


class HeroSectionFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = HeroSection

    page = factory.Sequence(lambda n: f"page-{n}")
    headline = "Test Headline"
    subheadline = "Test subheadline"
    cta_primary_text = "Get Started"
    cta_primary_link = "/start"
    created_by = factory.SubFactory(UserFactory)
    updated_by = factory.LazyAttribute(lambda o: o.created_by)


class PageBlockFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = PageBlock

    page = "home"
    block_type = "feature_grid"
    title = "Test Block"
    order = factory.Sequence(lambda n: n)
    created_by = factory.SubFactory(UserFactory)
    updated_by = factory.LazyAttribute(lambda o: o.created_by)


class NavigationItemFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = NavigationItem

    label = factory.Sequence(lambda n: f"Nav Item {n}")
    url = factory.Sequence(lambda n: f"/nav-{n}")
    location = "header"
    order = factory.Sequence(lambda n: n)


class ServiceOfferingFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = ServiceOffering

    title = factory.Sequence(lambda n: f"Service {n}")
    slug = factory.Sequence(lambda n: f"service-{n}")
    short_description = "Test description"
    problem = "The problem statement"
    process = "The process description"
    result = "The result description"
    deliverables = ["item1", "item2"]
    order = factory.Sequence(lambda n: n)
    created_by = factory.SubFactory(UserFactory)
    updated_by = factory.LazyAttribute(lambda o: o.created_by)


class ArcplusModuleFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = ArcplusModule

    name = factory.Sequence(lambda n: f"Module {n}")
    slug = factory.Sequence(lambda n: f"module-{n}")
    tagline = "Test tagline"
    description = "Test description"
    features = [{"name": "Feature 1"}]
    order = factory.Sequence(lambda n: n)
    created_by = factory.SubFactory(UserFactory)
    updated_by = factory.LazyAttribute(lambda o: o.created_by)


class PricingPlanFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = PricingPlan

    name = factory.Sequence(lambda n: f"Plan {n}")
    slug = factory.Sequence(lambda n: f"plan-{n}")
    tagline = "Test plan"
    price_usd = 99
    price_ugx = 360000
    price_kes = 12000
    billing_period = "month"
    order = factory.Sequence(lambda n: n)
    created_by = factory.SubFactory(UserFactory)
    updated_by = factory.LazyAttribute(lambda o: o.created_by)


class PlanFeatureFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = PlanFeature

    name = factory.Sequence(lambda n: f"Feature {n}")
    category = "core"
    order = factory.Sequence(lambda n: n)


class SupportTierFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = SupportTier

    name = factory.Sequence(lambda n: f"Tier {n}")
    slug = factory.Sequence(lambda n: f"tier-{n}")
    description = "Test tier"
    order = factory.Sequence(lambda n: n)
    created_by = factory.SubFactory(UserFactory)
    updated_by = factory.LazyAttribute(lambda o: o.created_by)


class SupportFeatureFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = SupportFeature

    name = factory.Sequence(lambda n: f"Support Feature {n}")
    order = factory.Sequence(lambda n: n)


class CaseStudyFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = CaseStudy

    title = factory.Sequence(lambda n: f"Case Study {n}")
    slug = factory.Sequence(lambda n: f"case-study-{n}")
    client_name = "Test Client"
    industry = "technology"
    country = "Uganda"
    challenge = "The challenge"
    solution = "The solution"
    results = [{"metric": "50% improvement"}]
    order = factory.Sequence(lambda n: n)
    created_by = factory.SubFactory(UserFactory)
    updated_by = factory.LazyAttribute(lambda o: o.created_by)


class DocumentationPageFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = DocumentationPage

    title = factory.Sequence(lambda n: f"Doc Page {n}")
    slug = factory.Sequence(lambda n: f"doc-page-{n}")
    content = "<p>Documentation content</p>"
    order = factory.Sequence(lambda n: n)
    created_by = factory.SubFactory(UserFactory)
    updated_by = factory.LazyAttribute(lambda o: o.created_by)


class APIEndpointGroupFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = APIEndpointGroup

    name = factory.Sequence(lambda n: f"API Group {n}")
    slug = factory.Sequence(lambda n: f"api-group-{n}")
    badge_class = "bg-blue-50 text-blue-700"
    order = factory.Sequence(lambda n: n)
    is_active = True


class APIEndpointFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = APIEndpoint

    group = factory.SubFactory(APIEndpointGroupFactory)
    method = "GET"
    path = factory.Sequence(lambda n: f"/test/endpoint-{n}")
    description = "Test endpoint description"
    order = factory.Sequence(lambda n: n)
