from django.urls import path

from apps.cms import admin_views as views

urlpatterns = [
    # Site Settings
    path("settings/", views.AdminSiteSettingsView.as_view(), name="admin-cms-settings"),
    # Page Meta
    path("meta/", views.AdminPageMetaListView.as_view(), name="admin-cms-meta-list"),
    path(
        "meta/<int:pk>/",
        views.AdminPageMetaDetailView.as_view(),
        name="admin-cms-meta-detail",
    ),
    # Hero Sections
    path("hero/", views.AdminHeroListView.as_view(), name="admin-cms-hero-list"),
    path(
        "hero/<int:pk>/",
        views.AdminHeroDetailView.as_view(),
        name="admin-cms-hero-detail",
    ),
    path(
        "hero/<int:pk>/transition/",
        views.AdminHeroTransitionView.as_view(),
        name="admin-cms-hero-transition",
    ),
    # Page Blocks
    path("blocks/", views.AdminBlockListView.as_view(), name="admin-cms-block-list"),
    path(
        "blocks/<int:pk>/",
        views.AdminBlockDetailView.as_view(),
        name="admin-cms-block-detail",
    ),
    path(
        "blocks/<int:pk>/transition/",
        views.AdminBlockTransitionView.as_view(),
        name="admin-cms-block-transition",
    ),
    # Navigation
    path(
        "navigation/",
        views.AdminNavigationListView.as_view(),
        name="admin-cms-nav-list",
    ),
    path(
        "navigation/<int:pk>/",
        views.AdminNavigationDetailView.as_view(),
        name="admin-cms-nav-detail",
    ),
    path(
        "navigation/reorder/",
        views.AdminNavigationReorderView.as_view(),
        name="admin-cms-nav-reorder",
    ),
    # Media
    path("media/", views.AdminMediaListView.as_view(), name="admin-cms-media-list"),
    path(
        "media/<uuid:pk>/",
        views.AdminMediaDetailView.as_view(),
        name="admin-cms-media-detail",
    ),
    path(
        "media/tags/",
        views.AdminAssetTagListView.as_view(),
        name="admin-cms-media-tags",
    ),
    # Product Gallery
    path(
        "products/<uuid:product_pk>/gallery/",
        views.AdminProductGalleryListView.as_view(),
        name="admin-cms-gallery-list",
    ),
    path(
        "products/<uuid:product_pk>/gallery/<int:pk>/",
        views.AdminProductGalleryDetailView.as_view(),
        name="admin-cms-gallery-detail",
    ),
    path(
        "products/<uuid:product_pk>/gallery/reorder/",
        views.AdminProductGalleryReorderView.as_view(),
        name="admin-cms-gallery-reorder",
    ),
    # Services
    path(
        "services/", views.AdminServiceListView.as_view(), name="admin-cms-service-list"
    ),
    path(
        "services/<int:pk>/",
        views.AdminServiceDetailView.as_view(),
        name="admin-cms-service-detail",
    ),
    path(
        "services/<int:pk>/transition/",
        views.AdminServiceTransitionView.as_view(),
        name="admin-cms-service-transition",
    ),
    # Arcplus Modules
    path("modules/", views.AdminModuleListView.as_view(), name="admin-cms-module-list"),
    path(
        "modules/<int:pk>/",
        views.AdminModuleDetailView.as_view(),
        name="admin-cms-module-detail",
    ),
    path(
        "modules/<int:pk>/transition/",
        views.AdminModuleTransitionView.as_view(),
        name="admin-cms-module-transition",
    ),
    # Pricing Plans
    path(
        "pricing/", views.AdminPricingListView.as_view(), name="admin-cms-pricing-list"
    ),
    path(
        "pricing/<int:pk>/",
        views.AdminPricingDetailView.as_view(),
        name="admin-cms-pricing-detail",
    ),
    path(
        "pricing/<int:pk>/transition/",
        views.AdminPricingTransitionView.as_view(),
        name="admin-cms-pricing-transition",
    ),
    # Plan Features
    path(
        "plan-features/",
        views.AdminPlanFeatureListView.as_view(),
        name="admin-cms-planfeature-list",
    ),
    path(
        "plan-feature-values/",
        views.AdminPlanFeatureValueListView.as_view(),
        name="admin-cms-planfeaturevalue-list",
    ),
    # Support Tiers
    path(
        "support-tiers/",
        views.AdminSupportTierListView.as_view(),
        name="admin-cms-supporttier-list",
    ),
    path(
        "support-tiers/<int:pk>/",
        views.AdminSupportTierDetailView.as_view(),
        name="admin-cms-supporttier-detail",
    ),
    path(
        "support-tiers/<int:pk>/transition/",
        views.AdminSupportTierTransitionView.as_view(),
        name="admin-cms-supporttier-transition",
    ),
    # Support Features
    path(
        "support-features/",
        views.AdminSupportFeatureListView.as_view(),
        name="admin-cms-supportfeature-list",
    ),
    path(
        "support-feature-values/",
        views.AdminSupportFeatureValueListView.as_view(),
        name="admin-cms-supportfeaturevalue-list",
    ),
    # Case Studies
    path(
        "case-studies/",
        views.AdminCaseStudyListView.as_view(),
        name="admin-cms-casestudy-list",
    ),
    path(
        "case-studies/<int:pk>/",
        views.AdminCaseStudyDetailView.as_view(),
        name="admin-cms-casestudy-detail",
    ),
    path(
        "case-studies/<int:pk>/transition/",
        views.AdminCaseStudyTransitionView.as_view(),
        name="admin-cms-casestudy-transition",
    ),
    # Revisions
    path(
        "revisions/",
        views.AdminRevisionListView.as_view(),
        name="admin-cms-revision-list",
    ),
    path(
        "revisions/<uuid:pk>/rollback/",
        views.AdminRevisionRollbackView.as_view(),
        name="admin-cms-revision-rollback",
    ),
    # Documentation Pages
    path(
        "documentation/",
        views.AdminDocumentationListView.as_view(),
        name="admin-cms-documentation-list",
    ),
    path(
        "documentation/<int:pk>/",
        views.AdminDocumentationDetailView.as_view(),
        name="admin-cms-documentation-detail",
    ),
    path(
        "documentation/<int:pk>/transition/",
        views.AdminDocumentationTransitionView.as_view(),
        name="admin-cms-documentation-transition",
    ),
    # API Endpoint Groups & Endpoints
    path(
        "api-groups/",
        views.AdminAPIEndpointGroupListView.as_view(),
        name="admin-cms-apigroup-list",
    ),
    path(
        "api-groups/<int:pk>/",
        views.AdminAPIEndpointGroupDetailView.as_view(),
        name="admin-cms-apigroup-detail",
    ),
    path(
        "api-endpoints/",
        views.AdminAPIEndpointListView.as_view(),
        name="admin-cms-apiendpoint-list",
    ),
    path(
        "api-endpoints/<int:pk>/",
        views.AdminAPIEndpointDetailView.as_view(),
        name="admin-cms-apiendpoint-detail",
    ),
    # Phase 4: Blog Categories
    path(
        "blog-categories/",
        views.AdminBlogCategoryListView.as_view(),
        name="admin-cms-blogcategory-list",
    ),
    path(
        "blog-categories/<int:pk>/",
        views.AdminBlogCategoryDetailView.as_view(),
        name="admin-cms-blogcategory-detail",
    ),
    # Phase 4: Blog Posts
    path(
        "blog-posts/",
        views.AdminBlogPostListView.as_view(),
        name="admin-cms-blogpost-list",
    ),
    path(
        "blog-posts/<int:pk>/",
        views.AdminBlogPostDetailView.as_view(),
        name="admin-cms-blogpost-detail",
    ),
    path(
        "blog-posts/<int:pk>/transition/",
        views.AdminBlogPostTransitionView.as_view(),
        name="admin-cms-blogpost-transition",
    ),
    # Phase 4: Email Templates
    path(
        "email-templates/",
        views.AdminEmailTemplateListView.as_view(),
        name="admin-cms-emailtemplate-list",
    ),
    path(
        "email-templates/<int:pk>/",
        views.AdminEmailTemplateDetailView.as_view(),
        name="admin-cms-emailtemplate-detail",
    ),
    path(
        "email-templates/<int:pk>/transition/",
        views.AdminEmailTemplateTransitionView.as_view(),
        name="admin-cms-emailtemplate-transition",
    ),
    # Phase 4: Testimonials
    path(
        "testimonials/",
        views.AdminTestimonialListView.as_view(),
        name="admin-cms-testimonial-list",
    ),
    path(
        "testimonials/<int:pk>/",
        views.AdminTestimonialDetailView.as_view(),
        name="admin-cms-testimonial-detail",
    ),
    path(
        "testimonials/<int:pk>/transition/",
        views.AdminTestimonialTransitionView.as_view(),
        name="admin-cms-testimonial-transition",
    ),
    # Tag & Scanner
    path(
        "tag-categories/",
        views.AdminTagCategoryListView.as_view(),
        name="admin-cms-tagcategory-list",
    ),
    path(
        "tag-categories/<int:pk>/",
        views.AdminTagCategoryDetailView.as_view(),
        name="admin-cms-tagcategory-detail",
    ),
    path(
        "tag-categories/<int:pk>/transition/",
        views.AdminTagCategoryTransitionView.as_view(),
        name="admin-cms-tagcategory-transition",
    ),
    path(
        "scanner-features/",
        views.AdminScannerFeatureListView.as_view(),
        name="admin-cms-scannerfeature-list",
    ),
    path(
        "scanner-features/<int:pk>/",
        views.AdminScannerFeatureDetailView.as_view(),
        name="admin-cms-scannerfeature-detail",
    ),
    path(
        "scanner-features/<int:pk>/transition/",
        views.AdminScannerFeatureTransitionView.as_view(),
        name="admin-cms-scannerfeature-transition",
    ),
    # Phase 4: Regional Variants
    path(
        "regional-variants/",
        views.AdminRegionalVariantListView.as_view(),
        name="admin-cms-regionalvariant-list",
    ),
    path(
        "regional-variants/<int:pk>/",
        views.AdminRegionalVariantDetailView.as_view(),
        name="admin-cms-regionalvariant-detail",
    ),
]
