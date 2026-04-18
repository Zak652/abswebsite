from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.cms.cache import get_cached
from apps.cms.models import (
    SiteSettings,
    PageMeta,
    HeroSection,
    PageBlock,
    NavigationItem,
    ServiceOffering,
    ArcplusModule,
    PricingPlan,
    SupportTier,
    CaseStudy,
    ProductImage,
    DocumentationPage,
    APIEndpointGroup,
    TagCategory,
    ScannerFeature,
    BlogCategory,
    BlogPost,
    Testimonial,
)
from apps.cms.serializers import (
    SiteSettingsSerializer,
    PageMetaSerializer,
    HeroSectionSerializer,
    PageBlockSerializer,
    NavigationItemSerializer,
    ServiceOfferingSerializer,
    ArcplusModuleSerializer,
    PricingPlanSerializer,
    SupportTierSerializer,
    CaseStudySerializer,
    ProductImageSerializer,
    DocumentationPageSerializer,
    APIEndpointGroupSerializer,
    TagCategorySerializer,
    ScannerFeatureSerializer,
    BlogCategorySerializer,
    BlogPostSerializer,
    TestimonialSerializer,
)


CACHE_HEADERS = {
    "Cache-Control": "public, max-age=60, s-maxage=60, stale-while-revalidate=600"
}


class CachedResponseMixin:
    """Add Cache-Control headers to all public CMS responses."""

    def finalize_response(self, request, response, *args, **kwargs):
        response = super().finalize_response(request, response, *args, **kwargs)
        for key, value in CACHE_HEADERS.items():
            response[key] = value
        return response


class SiteSettingsView(CachedResponseMixin, APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        def fetch():
            settings = SiteSettings.objects.get()
            return SiteSettingsSerializer(settings).data

        data = get_cached("settings", fetch)
        return Response(data)


class PageMetaView(CachedResponseMixin, APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        route = request.query_params.get("route", "/")

        def fetch():
            try:
                meta = PageMeta.objects.get(route=route)
                return PageMetaSerializer(meta).data
            except PageMeta.DoesNotExist:
                return None

        data = get_cached("meta", fetch, route=route)
        if data is None:
            return Response(
                {"detail": "No metadata for this route."},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(data)


class HeroSectionView(CachedResponseMixin, APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        page = request.query_params.get("page", "home")

        def fetch():
            try:
                hero = HeroSection.objects.get(page=page, status="published")
                return HeroSectionSerializer(hero).data
            except HeroSection.DoesNotExist:
                return None

        data = get_cached("hero", fetch, page=page)
        if data is None:
            return Response(
                {"detail": "No hero section for this page."},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(data)


class PageBlockListView(CachedResponseMixin, APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        page = request.query_params.get("page", "home")

        def fetch():
            blocks = PageBlock.objects.filter(page=page, status="published").order_by(
                "order"
            )
            return PageBlockSerializer(blocks, many=True).data

        data = get_cached("blocks", fetch, page=page)
        return Response(data)


class NavigationView(CachedResponseMixin, APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        location = request.query_params.get("location", "header")

        def fetch():
            items = NavigationItem.objects.filter(
                location=location, is_active=True, parent__isnull=True
            ).order_by("order")
            return NavigationItemSerializer(items, many=True).data

        data = get_cached("navigation", fetch, location=location)
        return Response(data)


class ServiceOfferingListView(CachedResponseMixin, APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        def fetch():
            services = ServiceOffering.objects.filter(status="published").order_by(
                "order"
            )
            return ServiceOfferingSerializer(services, many=True).data

        data = get_cached("services", fetch)
        return Response(data)


class ArcplusModuleListView(CachedResponseMixin, APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        def fetch():
            modules = ArcplusModule.objects.filter(status="published").order_by("order")
            return ArcplusModuleSerializer(modules, many=True).data

        data = get_cached("arcplus_modules", fetch)
        return Response(data)


class ArcplusPricingView(CachedResponseMixin, APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        def fetch():
            plans = (
                PricingPlan.objects.filter(status="published")
                .prefetch_related("feature_values__feature")
                .order_by("order")
            )
            return PricingPlanSerializer(plans, many=True).data

        data = get_cached("arcplus_pricing", fetch)
        return Response(data)


class SupportTierListView(CachedResponseMixin, APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        def fetch():
            tiers = (
                SupportTier.objects.filter(status="published")
                .prefetch_related("feature_values__feature")
                .order_by("order")
            )
            return SupportTierSerializer(tiers, many=True).data

        data = get_cached("support_tiers", fetch)
        return Response(data)


class CaseStudyListView(CachedResponseMixin, APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        def fetch():
            studies = CaseStudy.objects.filter(status="published").order_by("order")
            return CaseStudySerializer(studies, many=True).data

        data = get_cached("case_studies", fetch)
        return Response(data)


class CaseStudyDetailView(CachedResponseMixin, APIView):
    permission_classes = [AllowAny]

    def get(self, request, slug):
        def fetch():
            try:
                study = CaseStudy.objects.get(slug=slug, status="published")
                return CaseStudySerializer(study).data
            except CaseStudy.DoesNotExist:
                return None

        data = get_cached("case_studies", fetch, slug=slug)
        if data is None:
            return Response(
                {"detail": "Case study not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(data)


class ProductGalleryView(CachedResponseMixin, APIView):
    permission_classes = [AllowAny]

    def get(self, request, slug):
        def fetch():
            images = (
                ProductImage.objects.filter(product__slug=slug, is_active=True)
                .select_related("asset")
                .order_by("image_type", "order")
            )
            return ProductImageSerializer(images, many=True).data

        data = get_cached("product_gallery", fetch, slug=slug)
        return Response(data)


class DocumentationPageListView(CachedResponseMixin, APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        def fetch():
            pages = DocumentationPage.objects.filter(status="published").order_by(
                "order"
            )
            return DocumentationPageSerializer(pages, many=True).data

        data = get_cached("documentation_pages", fetch)
        return Response(data)


class APIEndpointGroupListView(CachedResponseMixin, APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        def fetch():
            groups = (
                APIEndpointGroup.objects.filter(is_active=True)
                .prefetch_related("endpoints")
                .order_by("order")
            )
            return APIEndpointGroupSerializer(groups, many=True).data

        data = get_cached("api_endpoint_groups", fetch)
        return Response(data)


# ---------------------------------------------------------------------------
# Tag & Scanner
# ---------------------------------------------------------------------------


class TagCategoryListView(CachedResponseMixin, APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        def fetch():
            return TagCategorySerializer(
                TagCategory.objects.filter(status="published").order_by("order"),
                many=True,
            ).data

        data = get_cached("tag_categories", fetch)
        return Response(data)


class ScannerFeatureListView(CachedResponseMixin, APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        feature_type = request.query_params.get("type")

        def fetch():
            qs = ScannerFeature.objects.filter(status="published").order_by("order")
            if feature_type:
                qs = qs.filter(feature_type=feature_type)
            return ScannerFeatureSerializer(qs, many=True).data

        data = get_cached("scanner_features", fetch, feature_type=feature_type or "all")
        return Response(data)


# ---------------------------------------------------------------------------
# Phase 4: Blog
# ---------------------------------------------------------------------------


class BlogCategoryListView(CachedResponseMixin, APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        def fetch():
            return BlogCategorySerializer(
                BlogCategory.objects.all().order_by("order"), many=True
            ).data

        data = get_cached("blog_categories", fetch)
        return Response(data)


class BlogPostListView(CachedResponseMixin, APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        category = request.query_params.get("category")

        def fetch():
            qs = (
                BlogPost.objects.filter(status="published")
                .select_related("featured_image", "author_avatar", "category")
                .order_by("-published_at")
            )
            if category:
                qs = qs.filter(category__slug=category)
            return BlogPostSerializer(qs, many=True).data

        data = get_cached("blog_posts", fetch, category=category or "all")
        return Response(data)


class BlogPostDetailView(CachedResponseMixin, APIView):
    permission_classes = [AllowAny]

    def get(self, request, slug):
        def fetch():
            try:
                post = BlogPost.objects.select_related(
                    "featured_image", "author_avatar", "category"
                ).get(slug=slug, status="published")
                return BlogPostSerializer(post).data
            except BlogPost.DoesNotExist:
                return None

        data = get_cached("blog_posts", fetch, slug=slug)
        if data is None:
            return Response(
                {"detail": "Blog post not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(data)


# ---------------------------------------------------------------------------
# Phase 4: Testimonials
# ---------------------------------------------------------------------------


class TestimonialListView(CachedResponseMixin, APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        placement = request.query_params.get("placement")

        def fetch():
            qs = (
                Testimonial.objects.filter(status="published")
                .select_related("avatar")
                .order_by("order")
            )
            if placement:
                qs = qs.filter(placement=placement)
            return TestimonialSerializer(qs, many=True).data

        data = get_cached("testimonials", fetch, placement=placement or "all")
        return Response(data)
