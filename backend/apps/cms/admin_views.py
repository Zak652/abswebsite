from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.admin_views import IsAdmin
from apps.cms.admin_mixins import AuditedAdminMixin
from apps.cms.cache import invalidate_model
from apps.cms.validators import validate_for_publish, PublishValidationError
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
    BlogCategory,
    BlogPost,
    EmailTemplate,
    TagCategory,
    ScannerFeature,
    Testimonial,
    RegionalVariant,
    TrainingPageSettings,
)
from apps.cms.serializers import (
    ContentRevisionSerializer,
    MediaAssetSerializer,
    MediaAssetUploadSerializer,
    AssetTagSerializer,
    ProductImageSerializer,
    SiteSettingsAdminSerializer,
    TrainingPageSettingsAdminSerializer,
    PageMetaAdminSerializer,
    HeroSectionAdminSerializer,
    PageBlockAdminSerializer,
    NavigationItemAdminSerializer,
    ServiceOfferingAdminSerializer,
    ArcplusModuleAdminSerializer,
    PricingPlanAdminSerializer,
    PlanFeatureSerializer,
    PlanFeatureValueAdminSerializer,
    SupportTierAdminSerializer,
    SupportFeatureSerializer,
    SupportFeatureValueAdminSerializer,
    CaseStudyAdminSerializer,
    DocumentationPageAdminSerializer,
    APIEndpointGroupAdminSerializer,
    APIEndpointAdminSerializer,
    BlogCategorySerializer,
    BlogPostAdminSerializer,
    EmailTemplateAdminSerializer,
    TagCategoryAdminSerializer,
    ScannerFeatureAdminSerializer,
    TestimonialAdminSerializer,
    RegionalVariantAdminSerializer,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _check_version(request, instance):
    """Optimistic locking: if 'version' is in the request body, validate it."""
    version = request.data.get("version")
    if version is not None and int(version) != instance.version:
        return Response(
            {
                "detail": "Conflict: this record was modified by another user.",
                "current_version": instance.version,
            },
            status=status.HTTP_409_CONFLICT,
        )
    return None


ACTION_MAP = {
    "submit": "review",
    "approve": "approved",
    "publish": "published",
    "archive": "archived",
    "unpublish": "draft",
}


class PublishableTransitionView(AuditedAdminMixin, APIView):
    """Generic transition view for any publishable model.

    POST body: {"action": "submit" | "approve" | "publish" | "archive" | "unpublish"}
    """

    permission_classes = [IsAdmin]
    model = None

    def post(self, request, pk):
        try:
            instance = self.model.objects.get(pk=pk)
        except self.model.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        action = request.data.get("action")
        if action not in ACTION_MAP:
            return Response(
                {"detail": f"Invalid action. Choose from: {list(ACTION_MAP.keys())}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        new_status = ACTION_MAP[action]

        # Validate content before publishing
        if new_status == "published":
            try:
                validate_for_publish(instance)
            except PublishValidationError as e:
                return Response(
                    {"detail": "Validation failed", "errors": e.errors},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        try:
            instance.transition_to(new_status, user=request.user)
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        self.audit(f"cms_{action}", instance.pk, {"status": new_status})

        return Response({"status": instance.status, "version": instance.version})


# ---------------------------------------------------------------------------
# Site Settings (singleton)
# ---------------------------------------------------------------------------


class AdminSiteSettingsView(AuditedAdminMixin, APIView):
    permission_classes = [IsAdmin]
    audit_resource_type = "SiteSettings"

    def get(self, request):
        settings = SiteSettings.objects.get()
        return Response(SiteSettingsAdminSerializer(settings).data)

    def patch(self, request):
        settings = SiteSettings.objects.get()
        serializer = SiteSettingsAdminSerializer(
            settings, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save(updated_by=request.user)
        self.audit("cms_settings_update", "1", request.data)
        return Response(serializer.data)


# ---------------------------------------------------------------------------
# Page Meta
# ---------------------------------------------------------------------------


class AdminPageMetaListView(AuditedAdminMixin, APIView):
    permission_classes = [IsAdmin]
    audit_resource_type = "PageMeta"
    audit_action_prefix = "meta"

    def get(self, request):
        metas = PageMeta.objects.all()
        return Response(PageMetaAdminSerializer(metas, many=True).data)

    def post(self, request):
        serializer = PageMetaAdminSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        self.audit_create(serializer.instance, request.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class AdminPageMetaDetailView(AuditedAdminMixin, APIView):
    permission_classes = [IsAdmin]
    audit_resource_type = "PageMeta"
    audit_action_prefix = "meta"

    def patch(self, request, pk):
        try:
            meta = PageMeta.objects.get(pk=pk)
        except PageMeta.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        serializer = PageMetaAdminSerializer(meta, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        self.audit_update(pk, request.data)
        return Response(serializer.data)

    def delete(self, request, pk):
        try:
            meta = PageMeta.objects.get(pk=pk)
        except PageMeta.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        meta.delete()
        self.audit_delete(pk)
        return Response(status=status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------------------
# Generic CRUD mixin for Publishable models
# ---------------------------------------------------------------------------


class PublishableCRUDListView(AuditedAdminMixin, APIView):
    """List and create for publishable models."""

    permission_classes = [IsAdmin]
    model = None
    serializer_class = None
    audit_action_prefix = ""

    def get(self, request):
        qs = self.model.objects.all().order_by("-created_at")
        page_filter = request.query_params.get("page")
        if page_filter and hasattr(self.model, "page"):
            qs = qs.filter(page=page_filter)
        return Response(self.serializer_class(qs, many=True).data)

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(created_by=request.user, updated_by=request.user)
        self.audit_create(serializer.instance, request.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class PublishableCRUDDetailView(AuditedAdminMixin, APIView):
    """Update and delete for publishable models."""

    permission_classes = [IsAdmin]
    model = None
    serializer_class = None
    audit_action_prefix = ""

    def get_object(self, pk):
        try:
            return self.model.objects.get(pk=pk)
        except self.model.DoesNotExist:
            return None

    def patch(self, request, pk):
        instance = self.get_object(pk)
        if instance is None:
            return Response(status=status.HTTP_404_NOT_FOUND)

        conflict = _check_version(request, instance)
        if conflict:
            return conflict

        serializer = self.serializer_class(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save(updated_by=request.user)
        self.audit_update(pk, request.data)
        return Response(serializer.data)

    def delete(self, request, pk):
        instance = self.get_object(pk)
        if instance is None:
            return Response(status=status.HTTP_404_NOT_FOUND)
        instance.delete()
        self.audit_delete(pk)
        return Response(status=status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------------------
# Hero Sections
# ---------------------------------------------------------------------------


class AdminHeroListView(PublishableCRUDListView):
    model = HeroSection
    serializer_class = HeroSectionAdminSerializer
    audit_action_prefix = "hero"


class AdminHeroDetailView(PublishableCRUDDetailView):
    model = HeroSection
    serializer_class = HeroSectionAdminSerializer
    audit_action_prefix = "hero"


class AdminHeroTransitionView(PublishableTransitionView):
    model = HeroSection


# ---------------------------------------------------------------------------
# Page Blocks
# ---------------------------------------------------------------------------


class AdminBlockListView(PublishableCRUDListView):
    model = PageBlock
    serializer_class = PageBlockAdminSerializer
    audit_action_prefix = "block"


class AdminBlockDetailView(PublishableCRUDDetailView):
    model = PageBlock
    serializer_class = PageBlockAdminSerializer
    audit_action_prefix = "block"


class AdminBlockTransitionView(PublishableTransitionView):
    model = PageBlock


# ---------------------------------------------------------------------------
# Navigation
# ---------------------------------------------------------------------------


class AdminNavigationListView(AuditedAdminMixin, APIView):
    permission_classes = [IsAdmin]
    audit_resource_type = "NavigationItem"
    audit_action_prefix = "nav"

    def get(self, request):
        items = NavigationItem.objects.all().order_by("location", "order")
        return Response(NavigationItemAdminSerializer(items, many=True).data)

    def post(self, request):
        serializer = NavigationItemAdminSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        self.audit_create(serializer.instance, request.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class AdminNavigationDetailView(AuditedAdminMixin, APIView):
    permission_classes = [IsAdmin]
    audit_resource_type = "NavigationItem"
    audit_action_prefix = "nav"

    def patch(self, request, pk):
        try:
            item = NavigationItem.objects.get(pk=pk)
        except NavigationItem.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        serializer = NavigationItemAdminSerializer(
            item, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        self.audit_update(pk, request.data)
        return Response(serializer.data)

    def delete(self, request, pk):
        try:
            item = NavigationItem.objects.get(pk=pk)
        except NavigationItem.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        item.delete()
        self.audit_delete(pk)
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminNavigationReorderView(AuditedAdminMixin, APIView):
    permission_classes = [IsAdmin]
    audit_resource_type = "NavigationItem"

    def post(self, request):
        items = request.data
        if not isinstance(items, list):
            return Response(
                {"detail": "Expected a list of {id, order} objects."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        for item in items:
            NavigationItem.objects.filter(pk=item["id"]).update(order=item["order"])
        invalidate_model("navigation")
        self.audit("cms_nav_reorder", "*", {"count": len(items)})
        return Response({"detail": "Reordered successfully."})


# ---------------------------------------------------------------------------
# Media Assets
# ---------------------------------------------------------------------------


class AdminMediaListView(AuditedAdminMixin, APIView):
    permission_classes = [IsAdmin]
    parser_classes = [MultiPartParser, FormParser]
    audit_resource_type = "MediaAsset"

    def get(self, request):
        qs = MediaAsset.objects.all()
        asset_type = request.query_params.get("asset_type")
        if asset_type:
            qs = qs.filter(asset_type=asset_type)
        tag = request.query_params.get("tag")
        if tag:
            qs = qs.filter(tags__slug=tag)
        return Response(MediaAssetSerializer(qs[:100], many=True).data)

    def post(self, request):
        serializer = MediaAssetUploadSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        asset = serializer.save()
        self.audit("cms_media_upload", asset.pk, {"filename": asset.filename})
        return Response(
            MediaAssetSerializer(asset).data, status=status.HTTP_201_CREATED
        )


class AdminMediaDetailView(AuditedAdminMixin, APIView):
    permission_classes = [IsAdmin]
    audit_resource_type = "MediaAsset"

    def get(self, request, pk):
        try:
            asset = MediaAsset.objects.get(pk=pk)
        except MediaAsset.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(MediaAssetSerializer(asset).data)

    def patch(self, request, pk):
        try:
            asset = MediaAsset.objects.get(pk=pk)
        except MediaAsset.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        for field in ("alt_text", "caption", "asset_type"):
            if field in request.data:
                setattr(asset, field, request.data[field])
        asset.save()
        tag_ids = request.data.get("tag_ids")
        if tag_ids is not None:
            asset.tags.set(tag_ids)
        self.audit("cms_media_update", pk, request.data)
        return Response(MediaAssetSerializer(asset).data)

    def delete(self, request, pk):
        try:
            asset = MediaAsset.objects.get(pk=pk)
        except MediaAsset.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        if asset.usage_count > 0:
            return Response(
                {
                    "detail": f"Asset is referenced {asset.usage_count} time(s). Remove references first.",
                    "usage_count": asset.usage_count,
                },
                status=status.HTTP_409_CONFLICT,
            )
        asset.delete()
        self.audit("cms_media_delete", pk)
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminAssetTagListView(AuditedAdminMixin, APIView):
    permission_classes = [IsAdmin]
    audit_resource_type = "AssetTag"

    def get(self, request):
        return Response(AssetTagSerializer(AssetTag.objects.all(), many=True).data)

    def post(self, request):
        serializer = AssetTagSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        self.audit(
            "cms_asset_tag_create",
            serializer.instance.pk,
            request.data,
        )
        return Response(serializer.data, status=status.HTTP_201_CREATED)


# ---------------------------------------------------------------------------
# Product Gallery
# ---------------------------------------------------------------------------


class AdminProductGalleryListView(AuditedAdminMixin, APIView):
    permission_classes = [IsAdmin]
    audit_resource_type = "ProductImage"

    def get(self, request, product_pk):
        images = ProductImage.objects.filter(product_id=product_pk).select_related(
            "asset"
        )
        return Response(ProductImageSerializer(images, many=True).data)

    def post(self, request, product_pk):
        data = request.data.copy()
        data["product"] = product_pk
        serializer = ProductImageSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        self.audit(
            "cms_gallery_add",
            serializer.instance.pk,
            {"product": str(product_pk)},
        )
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class AdminProductGalleryDetailView(AuditedAdminMixin, APIView):
    permission_classes = [IsAdmin]
    audit_resource_type = "ProductImage"

    def patch(self, request, product_pk, pk):
        try:
            image = ProductImage.objects.get(pk=pk, product_id=product_pk)
        except ProductImage.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        serializer = ProductImageSerializer(image, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        self.audit("cms_gallery_update", pk, request.data)
        return Response(serializer.data)

    def delete(self, request, product_pk, pk):
        try:
            image = ProductImage.objects.get(pk=pk, product_id=product_pk)
        except ProductImage.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        image.delete()
        self.audit("cms_gallery_delete", pk)
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminProductGalleryReorderView(AuditedAdminMixin, APIView):
    permission_classes = [IsAdmin]
    audit_resource_type = "ProductImage"

    def post(self, request, product_pk):
        items = request.data
        if not isinstance(items, list):
            return Response(
                {"detail": "Expected a list of {id, order} objects."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        for item in items:
            ProductImage.objects.filter(pk=item["id"], product_id=product_pk).update(
                order=item["order"]
            )
        self.audit(
            "cms_gallery_reorder",
            str(product_pk),
            {"count": len(items)},
        )
        return Response({"detail": "Reordered successfully."})


# ---------------------------------------------------------------------------
# Services
# ---------------------------------------------------------------------------


class AdminServiceListView(PublishableCRUDListView):
    model = ServiceOffering
    serializer_class = ServiceOfferingAdminSerializer
    audit_action_prefix = "service"


class AdminServiceDetailView(PublishableCRUDDetailView):
    model = ServiceOffering
    serializer_class = ServiceOfferingAdminSerializer
    audit_action_prefix = "service"


class AdminServiceTransitionView(PublishableTransitionView):
    model = ServiceOffering


# ---------------------------------------------------------------------------
# Arcplus Modules
# ---------------------------------------------------------------------------


class AdminModuleListView(PublishableCRUDListView):
    model = ArcplusModule
    serializer_class = ArcplusModuleAdminSerializer
    audit_action_prefix = "module"


class AdminModuleDetailView(PublishableCRUDDetailView):
    model = ArcplusModule
    serializer_class = ArcplusModuleAdminSerializer
    audit_action_prefix = "module"


class AdminModuleTransitionView(PublishableTransitionView):
    model = ArcplusModule


# ---------------------------------------------------------------------------
# Pricing Plans
# ---------------------------------------------------------------------------


class AdminPricingListView(PublishableCRUDListView):
    model = PricingPlan
    serializer_class = PricingPlanAdminSerializer
    audit_action_prefix = "pricing"


class AdminPricingDetailView(PublishableCRUDDetailView):
    model = PricingPlan
    serializer_class = PricingPlanAdminSerializer
    audit_action_prefix = "pricing"


class AdminPricingTransitionView(PublishableTransitionView):
    model = PricingPlan


# ---------------------------------------------------------------------------
# Plan Features & Values
# ---------------------------------------------------------------------------


class AdminPlanFeatureListView(AuditedAdminMixin, APIView):
    permission_classes = [IsAdmin]
    audit_resource_type = "PlanFeature"

    def get(self, request):
        return Response(
            PlanFeatureSerializer(PlanFeature.objects.all(), many=True).data
        )

    def post(self, request):
        serializer = PlanFeatureSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        self.audit(
            "cms_plan_feature_create",
            serializer.instance.pk,
            request.data,
        )
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class AdminPlanFeatureValueListView(AuditedAdminMixin, APIView):
    permission_classes = [IsAdmin]
    audit_resource_type = "PlanFeatureValue"

    def get(self, request):
        plan_id = request.query_params.get("plan")
        qs = PlanFeatureValue.objects.all()
        if plan_id:
            qs = qs.filter(plan_id=plan_id)
        return Response(PlanFeatureValueAdminSerializer(qs, many=True).data)

    def post(self, request):
        serializer = PlanFeatureValueAdminSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        self.audit(
            "cms_plan_feature_value_set",
            serializer.instance.pk,
            request.data,
        )
        return Response(serializer.data, status=status.HTTP_201_CREATED)


# ---------------------------------------------------------------------------
# Support Tiers
# ---------------------------------------------------------------------------


class AdminSupportTierListView(PublishableCRUDListView):
    model = SupportTier
    serializer_class = SupportTierAdminSerializer
    audit_action_prefix = "support_tier"


class AdminSupportTierDetailView(PublishableCRUDDetailView):
    model = SupportTier
    serializer_class = SupportTierAdminSerializer
    audit_action_prefix = "support_tier"


class AdminSupportTierTransitionView(PublishableTransitionView):
    model = SupportTier


class AdminSupportFeatureListView(AuditedAdminMixin, APIView):
    permission_classes = [IsAdmin]
    audit_resource_type = "SupportFeature"

    def get(self, request):
        return Response(
            SupportFeatureSerializer(SupportFeature.objects.all(), many=True).data
        )

    def post(self, request):
        serializer = SupportFeatureSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        self.audit(
            "cms_support_feature_create",
            serializer.instance.pk,
            request.data,
        )
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class AdminSupportFeatureValueListView(AuditedAdminMixin, APIView):
    permission_classes = [IsAdmin]
    audit_resource_type = "SupportFeatureValue"

    def get(self, request):
        tier_id = request.query_params.get("tier")
        qs = SupportFeatureValue.objects.all()
        if tier_id:
            qs = qs.filter(tier_id=tier_id)
        return Response(SupportFeatureValueAdminSerializer(qs, many=True).data)

    def post(self, request):
        serializer = SupportFeatureValueAdminSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        self.audit(
            "cms_support_feature_value_set",
            serializer.instance.pk,
            request.data,
        )
        return Response(serializer.data, status=status.HTTP_201_CREATED)


# ---------------------------------------------------------------------------
# Case Studies
# ---------------------------------------------------------------------------


class AdminCaseStudyListView(PublishableCRUDListView):
    model = CaseStudy
    serializer_class = CaseStudyAdminSerializer
    audit_action_prefix = "case_study"


class AdminCaseStudyDetailView(PublishableCRUDDetailView):
    model = CaseStudy
    serializer_class = CaseStudyAdminSerializer
    audit_action_prefix = "case_study"


class AdminCaseStudyTransitionView(PublishableTransitionView):
    model = CaseStudy


# ---------------------------------------------------------------------------
# Content Revisions
# ---------------------------------------------------------------------------


class AdminRevisionListView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        ct_id = request.query_params.get("content_type")
        object_id = request.query_params.get("object_id")
        if not ct_id or not object_id:
            return Response(
                {"detail": "content_type and object_id are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        revisions = ContentRevision.objects.filter(
            content_type_id=ct_id, object_id=object_id
        )
        return Response(ContentRevisionSerializer(revisions, many=True).data)


class AdminRevisionRollbackView(AuditedAdminMixin, APIView):
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        try:
            revision = ContentRevision.objects.get(pk=pk)
        except ContentRevision.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        model_class = revision.content_type.model_class()
        try:
            instance = model_class.objects.get(pk=revision.object_id)
        except model_class.DoesNotExist:
            return Response(
                {"detail": "Original content object not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        data = revision.data
        for field_name, value in data.items():
            if hasattr(instance, field_name) and field_name not in (
                "id",
                "pk",
                "created_at",
                "updated_at",
                "version",
                "created_by",
                "updated_by",
                "approved_by",
            ):
                try:
                    setattr(instance, field_name, value)
                except (ValueError, TypeError):
                    continue

        instance.updated_by = request.user
        instance.save()

        self.audit(
            "cms_rollback",
            instance.pk,
            {"rolled_back_to_revision": revision.revision_number},
            resource_type=model_class.__name__,
        )

        return Response(
            {
                "detail": f"Rolled back to revision {revision.revision_number}.",
                "version": instance.version,
            }
        )


# ---------------------------------------------------------------------------
# Documentation Pages
# ---------------------------------------------------------------------------


class AdminDocumentationListView(PublishableCRUDListView):
    model = DocumentationPage
    serializer_class = DocumentationPageAdminSerializer
    audit_action_prefix = "documentation"


class AdminDocumentationDetailView(PublishableCRUDDetailView):
    model = DocumentationPage
    serializer_class = DocumentationPageAdminSerializer
    audit_action_prefix = "documentation"


class AdminDocumentationTransitionView(PublishableTransitionView):
    model = DocumentationPage


# ---------------------------------------------------------------------------
# API Endpoint Groups & Endpoints
# ---------------------------------------------------------------------------


class AdminAPIEndpointGroupListView(AuditedAdminMixin, APIView):
    permission_classes = [IsAdmin]
    audit_resource_type = "APIEndpointGroup"
    audit_action_prefix = "api_group"

    def get(self, request):
        groups = APIEndpointGroup.objects.prefetch_related("endpoints").order_by(
            "order"
        )
        return Response(APIEndpointGroupAdminSerializer(groups, many=True).data)

    def post(self, request):
        serializer = APIEndpointGroupAdminSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        self.audit_create(serializer.instance, request.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class AdminAPIEndpointGroupDetailView(AuditedAdminMixin, APIView):
    permission_classes = [IsAdmin]
    audit_resource_type = "APIEndpointGroup"
    audit_action_prefix = "api_group"

    def patch(self, request, pk):
        try:
            group = APIEndpointGroup.objects.get(pk=pk)
        except APIEndpointGroup.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        serializer = APIEndpointGroupAdminSerializer(
            group, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        self.audit_update(pk, request.data)
        return Response(serializer.data)

    def delete(self, request, pk):
        try:
            group = APIEndpointGroup.objects.get(pk=pk)
        except APIEndpointGroup.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        group.delete()
        self.audit_delete(pk)
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminAPIEndpointListView(AuditedAdminMixin, APIView):
    permission_classes = [IsAdmin]
    audit_resource_type = "APIEndpoint"
    audit_action_prefix = "api_endpoint"

    def get(self, request):
        group_id = request.query_params.get("group")
        qs = APIEndpoint.objects.all()
        if group_id:
            qs = qs.filter(group_id=group_id)
        return Response(APIEndpointAdminSerializer(qs, many=True).data)

    def post(self, request):
        serializer = APIEndpointAdminSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        self.audit_create(serializer.instance, request.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class AdminAPIEndpointDetailView(AuditedAdminMixin, APIView):
    permission_classes = [IsAdmin]
    audit_resource_type = "APIEndpoint"
    audit_action_prefix = "api_endpoint"

    def patch(self, request, pk):
        try:
            endpoint = APIEndpoint.objects.get(pk=pk)
        except APIEndpoint.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        serializer = APIEndpointAdminSerializer(
            endpoint, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        self.audit_update(pk, request.data)
        return Response(serializer.data)

    def delete(self, request, pk):
        try:
            endpoint = APIEndpoint.objects.get(pk=pk)
        except APIEndpoint.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        endpoint.delete()
        self.audit_delete(pk)
        return Response(status=status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------------------
# Phase 4: Blog Categories
# ---------------------------------------------------------------------------


class AdminBlogCategoryListView(AuditedAdminMixin, APIView):
    permission_classes = [IsAdmin]
    audit_resource_type = "BlogCategory"
    audit_action_prefix = "blog_category"

    def get(self, request):
        return Response(
            BlogCategorySerializer(
                BlogCategory.objects.all().order_by("order"), many=True
            ).data
        )

    def post(self, request):
        serializer = BlogCategorySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        self.audit_create(serializer.instance, request.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class AdminBlogCategoryDetailView(AuditedAdminMixin, APIView):
    permission_classes = [IsAdmin]
    audit_resource_type = "BlogCategory"
    audit_action_prefix = "blog_category"

    def patch(self, request, pk):
        try:
            cat = BlogCategory.objects.get(pk=pk)
        except BlogCategory.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        serializer = BlogCategorySerializer(cat, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        self.audit_update(pk, request.data)
        return Response(serializer.data)

    def delete(self, request, pk):
        try:
            cat = BlogCategory.objects.get(pk=pk)
        except BlogCategory.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        cat.delete()
        self.audit_delete(pk)
        return Response(status=status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------------------
# Phase 4: Blog Posts
# ---------------------------------------------------------------------------


class AdminBlogPostListView(PublishableCRUDListView):
    model = BlogPost
    serializer_class = BlogPostAdminSerializer
    audit_action_prefix = "blog_post"


class AdminBlogPostDetailView(PublishableCRUDDetailView):
    model = BlogPost
    serializer_class = BlogPostAdminSerializer
    audit_action_prefix = "blog_post"


class AdminBlogPostTransitionView(PublishableTransitionView):
    model = BlogPost


# ---------------------------------------------------------------------------
# Phase 4: Email Templates
# ---------------------------------------------------------------------------


class AdminEmailTemplateListView(PublishableCRUDListView):
    model = EmailTemplate
    serializer_class = EmailTemplateAdminSerializer
    audit_action_prefix = "email_template"


class AdminEmailTemplateDetailView(PublishableCRUDDetailView):
    model = EmailTemplate
    serializer_class = EmailTemplateAdminSerializer
    audit_action_prefix = "email_template"


class AdminEmailTemplateTransitionView(PublishableTransitionView):
    model = EmailTemplate


# ---------------------------------------------------------------------------
# Phase 4: Testimonials
# ---------------------------------------------------------------------------


class AdminTestimonialListView(PublishableCRUDListView):
    model = Testimonial
    serializer_class = TestimonialAdminSerializer
    audit_action_prefix = "testimonial"


class AdminTestimonialDetailView(PublishableCRUDDetailView):
    model = Testimonial
    serializer_class = TestimonialAdminSerializer
    audit_action_prefix = "testimonial"


class AdminTestimonialTransitionView(PublishableTransitionView):
    model = Testimonial


# ---------------------------------------------------------------------------
# Phase 4: Regional Variants
# ---------------------------------------------------------------------------


class AdminRegionalVariantListView(AuditedAdminMixin, APIView):
    permission_classes = [IsAdmin]
    audit_resource_type = "RegionalVariant"
    audit_action_prefix = "regional_variant"

    def get(self, request):
        qs = RegionalVariant.objects.all()
        ct = request.query_params.get("content_type")
        oid = request.query_params.get("object_id")
        if ct:
            qs = qs.filter(content_type_id=ct)
        if oid:
            qs = qs.filter(object_id=oid)
        return Response(RegionalVariantAdminSerializer(qs, many=True).data)

    def post(self, request):
        serializer = RegionalVariantAdminSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        self.audit_create(serializer.instance, request.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class AdminRegionalVariantDetailView(AuditedAdminMixin, APIView):
    permission_classes = [IsAdmin]
    audit_resource_type = "RegionalVariant"
    audit_action_prefix = "regional_variant"

    def patch(self, request, pk):
        try:
            variant = RegionalVariant.objects.get(pk=pk)
        except RegionalVariant.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        serializer = RegionalVariantAdminSerializer(
            variant, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        self.audit_update(pk, request.data)
        return Response(serializer.data)

    def delete(self, request, pk):
        try:
            variant = RegionalVariant.objects.get(pk=pk)
        except RegionalVariant.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        variant.delete()
        self.audit_delete(pk)
        return Response(status=status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------------------
# Tag & Scanner Admin Views
# ---------------------------------------------------------------------------


class AdminTagCategoryListView(PublishableCRUDListView):
    model = TagCategory
    serializer_class = TagCategoryAdminSerializer
    audit_action_prefix = "tag_category"


class AdminTagCategoryDetailView(PublishableCRUDDetailView):
    model = TagCategory
    serializer_class = TagCategoryAdminSerializer
    audit_action_prefix = "tag_category"


class AdminTagCategoryTransitionView(PublishableTransitionView):
    model = TagCategory


class AdminScannerFeatureListView(PublishableCRUDListView):
    model = ScannerFeature
    serializer_class = ScannerFeatureAdminSerializer
    audit_action_prefix = "scanner_feature"


class AdminScannerFeatureDetailView(PublishableCRUDDetailView):
    model = ScannerFeature
    serializer_class = ScannerFeatureAdminSerializer
    audit_action_prefix = "scanner_feature"


class AdminScannerFeatureTransitionView(PublishableTransitionView):
    model = ScannerFeature


class AdminTrainingPageSettingsView(AuditedAdminMixin, APIView):
    permission_classes = [IsAdmin]
    audit_resource_type = "TrainingPageSettings"

    def get(self, request):
        obj = TrainingPageSettings.objects.get()
        return Response(TrainingPageSettingsAdminSerializer(obj).data)

    def patch(self, request):
        obj = TrainingPageSettings.objects.get()
        serializer = TrainingPageSettingsAdminSerializer(
            obj, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save(updated_by=request.user)
        invalidate_model("training_page_settings")
        self.audit("cms_training_settings_update", "1", request.data)
        return Response(serializer.data)
