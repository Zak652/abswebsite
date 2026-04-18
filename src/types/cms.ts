/* ------------------------------------------------------------------ */
/*  CMS API response types — mirrors Django serializers               */
/* ------------------------------------------------------------------ */

export interface MediaAssetData {
    id: string;
    file: string;
    asset_type: string;
    filename: string;
    alt_text: string;
    caption: string;
    file_size: number;
    width: number | null;
    height: number | null;
    file_webp: string | null;
    file_thumbnail: string | null;
    file_medium: string | null;
    file_large: string | null;
    processing_status: "pending" | "processing" | "completed" | "failed";
    tags: AssetTagData[];
    usage_count: number;
    created_at: string;
}

export interface AssetTagData {
    id: number;
    name: string;
    slug: string;
}

export interface SiteSettingsData {
    currency_rates: Record<string, number>;
    company_phone: string;
    company_email: string;
    company_address: string;
    social_links: Record<string, string>;
    default_og_image: string | null;
    google_analytics_id: string;
    organization_schema: Record<string, unknown>;
    updated_at: string;
}

export interface PageMetaData {
    id: number;
    route: string;
    title: string;
    description: string;
    og_image: string | null;
    canonical_url: string;
    is_indexed: boolean;
    structured_data: Record<string, unknown>;
    hreflang_alternates: Record<string, string>;
    updated_at: string;
}

export interface HeroSectionData {
    id: number;
    page: string;
    headline: string;
    subheadline: string;
    cta_primary_text: string;
    cta_primary_link: string;
    cta_secondary_text: string;
    cta_secondary_link: string;
    background_image: MediaAssetData | null;
    variant: "overlay" | "split";
    eyebrow: string;
    badges: string[];
}

export interface PageBlockData {
    id: number;
    page: string;
    block_type: string;
    title: string;
    body: string;
    image: MediaAssetData | null;
    video_url: string;
    icon: string;
    link_url: string;
    link_text: string;
    data: Record<string, unknown>;
    order: number;
}

export interface NavigationItemData {
    id: number;
    label: string;
    url: string;
    parent: number | null;
    location: string;
    column: string;
    order: number;
    is_active: boolean;
    children: NavigationItemData[];
}

export interface ServiceOfferingData {
    id: number;
    title: string;
    slug: string;
    icon: string;
    short_description: string;
    problem: string;
    process: string;
    deliverables: string[];
    result: string;
    image: MediaAssetData | null;
    order: number;
}

export interface ArcplusModuleData {
    id: number;
    name: string;
    slug: string;
    tagline: string;
    description: string;
    icon: string;
    features: Record<string, unknown>[];
    image: MediaAssetData | null;
    order: number;
}

export interface PlanFeatureValueData {
    feature: number;
    feature_name: string;
    feature_category: string;
    value: string;
    is_included: boolean;
}

export interface PricingPlanData {
    id: number;
    name: string;
    slug: string;
    tagline: string;
    asset_range: string;
    price_usd: number;
    price_ugx: number;
    price_kes: number;
    price_monthly_usd: number | null;
    billing_period: string;
    is_recommended: boolean;
    cta_text: string;
    cta_link: string;
    order: number;
    feature_values: PlanFeatureValueData[];
}

export interface PlanFeatureData {
    id: number;
    name: string;
    category: string;
    order: number;
}

export interface SupportFeatureValueData {
    feature: number;
    feature_name: string;
    value: string;
}

export interface SupportTierData {
    id: number;
    name: string;
    slug: string;
    plan: string;
    order: number;
    feature_values: SupportFeatureValueData[];
}

export interface SupportFeatureData {
    id: number;
    name: string;
    order: number;
}

export interface CaseStudyData {
    id: number;
    title: string;
    slug: string;
    client_name: string;
    industry: string;
    country: string;
    challenge: string;
    solution: string;
    results: Record<string, unknown>[];
    quote: string;
    quote_author: string;
    quote_role: string;
    image: MediaAssetData | null;
    order: number;
}

export interface DocumentationPageData {
    id: number;
    title: string;
    slug: string;
    content: string;
    order: number;
}

export interface APIEndpointData {
    id: number;
    method: string;
    path: string;
    description: string;
    order: number;
}

export interface APIEndpointGroupData {
    id: number;
    name: string;
    slug: string;
    badge_class: string;
    order: number;
    endpoints: APIEndpointData[];
}

export interface ContentRevisionData {
    id: string;
    content_type: number;
    object_id: string;
    revision_number: number;
    data: Record<string, unknown>;
    status_at_revision: string;
    created_by: string | null;
    created_at: string;
}

/* ------------------------------------------------------------------ */
/*  Admin write types (includes publishable fields)                   */
/* ------------------------------------------------------------------ */

export interface PublishableFields {
    status: "draft" | "review" | "approved" | "published" | "archived";
    version: number;
    created_by: string | null;
    updated_by: string | null;
    approved_by: string | null;
    approved_at: string | null;
    published_at: string | null;
    scheduled_publish_at: string | null;
    created_at: string;
    updated_at: string;
}

export type AdminHeroSectionData = HeroSectionData & PublishableFields;
export type AdminPageBlockData = PageBlockData & PublishableFields;
export type AdminServiceOfferingData = ServiceOfferingData & PublishableFields;
export type AdminArcplusModuleData = ArcplusModuleData & PublishableFields;
export type AdminPricingPlanData = PricingPlanData & PublishableFields;
export type AdminSupportTierData = SupportTierData & PublishableFields;
export type AdminCaseStudyData = CaseStudyData & PublishableFields;
export type AdminDocumentationPageData = DocumentationPageData & PublishableFields;

export interface TransitionResponse {
    status: string;
    version: number;
}

export interface TransitionRequest {
    action: "submit" | "approve" | "publish" | "archive" | "unpublish";
    scheduled_publish_at?: string;
}

/* ------------------------------------------------------------------ */
/*  Product Gallery                                                   */
/* ------------------------------------------------------------------ */

export interface ProductImageData {
    id: number;
    product: string;
    asset: MediaAssetData;
    image_type: "hero" | "context" | "detail" | "workflow" | "config";
    alt_text: string;
    caption: string;
    order: number;
    is_active: boolean;
    created_at: string;
}

/* ------------------------------------------------------------------ */
/*  Phase 4: Blog                                                     */
/* ------------------------------------------------------------------ */

export interface BlogCategoryData {
    id: number;
    name: string;
    slug: string;
    description: string;
    order: number;
}

export interface BlogPostData {
    id: number;
    title: string;
    slug: string;
    excerpt: string;
    body: string;
    featured_image: MediaAssetData | null;
    category: BlogCategoryData | null;
    author_name: string;
    author_avatar: MediaAssetData | null;
    seo_keywords: string;
    reading_time_minutes: number | null;
    is_featured: boolean;
    order: number;
    published_at: string | null;
    created_at: string;
}

export type AdminBlogPostData = BlogPostData & PublishableFields;

/* ------------------------------------------------------------------ */
/*  Phase 4: Email Templates                                          */
/* ------------------------------------------------------------------ */

export interface EmailTemplateData {
    id: number;
    name: string;
    slug: string;
    subject: string;
    body_html: string;
    body_text: string;
    trigger_type: string;
    available_variables: string[];
    preview_data: Record<string, string>;
}

export type AdminEmailTemplateData = EmailTemplateData & PublishableFields;

/* ------------------------------------------------------------------ */
/*  Phase 4: Testimonials                                             */
/* ------------------------------------------------------------------ */

export interface TestimonialData {
    id: number;
    quote: string;
    author_name: string;
    author_role: string;
    company_name: string;
    industry: string;
    avatar: MediaAssetData | null;
    rating: number | null;
    placement: "homepage" | "arcplus" | "services" | "global";
    order: number;
}

export type AdminTestimonialData = TestimonialData & PublishableFields;

/* ------------------------------------------------------------------ */
/*  Tag & Scanner                                                     */
/* ------------------------------------------------------------------ */

export interface TagCategoryData {
    id: number;
    name: string;
    slug: string;
    icon: string;
    description: string;
    environment: string;
    range_category: "short" | "medium" | "long" | "gps";
    application: string;
    image: MediaAssetData | null;
    order: number;
}

export type AdminTagCategoryData = TagCategoryData & PublishableFields;

export interface ScannerFeatureData {
    id: number;
    title: string;
    slug: string;
    description: string;
    icon: string;
    feature_type: "durability" | "precision" | "validation" | "configurator";
    specs: unknown[];
    image: MediaAssetData | null;
    order: number;
}

export type AdminScannerFeatureData = ScannerFeatureData & PublishableFields;

/* ------------------------------------------------------------------ */
/*  Phase 4: Regional Variants                                        */
/* ------------------------------------------------------------------ */

export interface RegionalVariantData {
    id: number;
    content_type: number;
    object_id: string;
    region: "ug" | "ke" | "global";
    language: "en" | "sw";
    title_override: string;
    body_override: string;
    image_override: MediaAssetData | null;
    cta_link_override: string;
    data_override: Record<string, unknown> | null;
}
