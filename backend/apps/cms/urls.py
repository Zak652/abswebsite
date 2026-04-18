from django.urls import path

from apps.cms import views

urlpatterns = [
    path("settings/", views.SiteSettingsView.as_view(), name="cms-settings"),
    path("meta/", views.PageMetaView.as_view(), name="cms-meta"),
    path("hero/", views.HeroSectionView.as_view(), name="cms-hero"),
    path("blocks/", views.PageBlockListView.as_view(), name="cms-blocks"),
    path("navigation/", views.NavigationView.as_view(), name="cms-navigation"),
    path("services/", views.ServiceOfferingListView.as_view(), name="cms-services"),
    path(
        "arcplus/modules/",
        views.ArcplusModuleListView.as_view(),
        name="cms-arcplus-modules",
    ),
    path(
        "arcplus/pricing/",
        views.ArcplusPricingView.as_view(),
        name="cms-arcplus-pricing",
    ),
    path(
        "support-tiers/",
        views.SupportTierListView.as_view(),
        name="cms-support-tiers",
    ),
    path(
        "case-studies/",
        views.CaseStudyListView.as_view(),
        name="cms-case-studies",
    ),
    path(
        "case-studies/<slug:slug>/",
        views.CaseStudyDetailView.as_view(),
        name="cms-case-study-detail",
    ),
    path(
        "documentation/",
        views.DocumentationPageListView.as_view(),
        name="cms-documentation",
    ),
    path(
        "api-endpoints/",
        views.APIEndpointGroupListView.as_view(),
        name="cms-api-endpoints",
    ),
    # Phase 4: Blog
    path(
        "blog/categories/",
        views.BlogCategoryListView.as_view(),
        name="cms-blog-categories",
    ),
    path("blog/", views.BlogPostListView.as_view(), name="cms-blog-list"),
    path(
        "blog/<slug:slug>/",
        views.BlogPostDetailView.as_view(),
        name="cms-blog-detail",
    ),
    # Tag & Scanner
    path(
        "tag-categories/",
        views.TagCategoryListView.as_view(),
        name="cms-tag-categories",
    ),
    path(
        "scanner-features/",
        views.ScannerFeatureListView.as_view(),
        name="cms-scanner-features",
    ),
    # Phase 4: Testimonials
    path(
        "testimonials/",
        views.TestimonialListView.as_view(),
        name="cms-testimonials",
    ),
]
