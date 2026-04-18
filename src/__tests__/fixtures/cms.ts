/**
 * Shared CMS test fixtures for component tests.
 */
import type {
    HeroSectionData,
    PageBlockData,
    ServiceOfferingData,
    NavigationItemData,
    SiteSettingsData,
    SupportTierData,
    PricingPlanData,
} from "@/types/cms";

export const mockHero: HeroSectionData = {
    id: 1,
    page: "home",
    headline: "CMS Headline",
    subheadline: "CMS Subheadline",
    cta_primary_text: "CMS CTA",
    cta_primary_link: "/cms-link",
    cta_secondary_text: "CMS Secondary",
    cta_secondary_link: "/cms-secondary",
    background_image: null,
    variant: "overlay",
    eyebrow: "",
    badges: [],
};

export const mockGuidedBlock: PageBlockData = {
    id: 10,
    page: "home",
    block_type: "guided_path",
    title: "Guided CMS",
    body: "",
    image: null,
    video_url: "",
    icon: "",
    link_url: "",
    link_text: "",
    data: {
        items: [
            { href: "/test", icon: "Layers", title: "CMS Item", desc: "CMS desc", cta: "CMS CTA" },
        ],
    },
    order: 0,
};

export const mockStatsBlock: PageBlockData = {
    id: 11,
    page: "home",
    block_type: "stats_row",
    title: "Trust Stats",
    body: "",
    image: null,
    video_url: "",
    icon: "",
    link_url: "",
    link_text: "",
    data: {
        stats: [
            { value: "10M+", label: "CMS Assets" },
            { value: "99", label: "CMS Countries" },
        ],
    },
    order: 1,
};

export const mockCtaBlock: PageBlockData = {
    id: 12,
    page: "home",
    block_type: "cta_banner",
    title: "CMS CTA Title",
    body: "",
    image: null,
    video_url: "",
    icon: "",
    link_url: "/cms-cta",
    link_text: "CMS Action",
    data: {},
    order: 2,
};

export const mockService: ServiceOfferingData = {
    id: 1,
    title: "CMS Service",
    slug: "cms-service",
    icon: "ClipboardList",
    short_description: "CMS short desc",
    problem: "CMS problem",
    process: "CMS process",
    deliverables: ["Item 1", "Item 2"],
    result: "CMS result",
    image: null,
    order: 0,
};

export const mockNavItem: NavigationItemData = {
    id: 1,
    label: "CMS Link",
    url: "/cms-page",
    parent: null,
    location: "footer_platform",
    column: "",
    order: 0,
    is_active: true,
    children: [],
};

export const mockSettings: SiteSettingsData = {
    currency_rates: { UGX: 4000, KES: 140 },
    company_phone: "+256 700 000000",
    company_email: "cms@test.com",
    company_address: "CMS Address\nLine 2",
    social_links: {},
    default_og_image: null,
    google_analytics_id: "",
    organization_schema: {},
    updated_at: "2026-01-01T00:00:00Z",
};

export const mockSupportTiers: SupportTierData[] = [
    {
        id: 1,
        name: "Starter",
        slug: "starter",
        plan: "starter",
        order: 0,
        feature_values: [
            { feature: 1, feature_name: "Response Time", value: "48h" },
            { feature: 2, feature_name: "Dedicated AM", value: "false" },
        ],
    },
    {
        id: 2,
        name: "Enterprise",
        slug: "enterprise",
        plan: "enterprise",
        order: 3,
        feature_values: [
            { feature: 1, feature_name: "Response Time", value: "1h" },
            { feature: 2, feature_name: "Dedicated AM", value: "true" },
        ],
    },
];

export const mockPricingPlans: PricingPlanData[] = [
    {
        id: 1,
        name: "Starter",
        slug: "starter",
        tagline: "For small teams",
        asset_range: "Up to 1,000",
        price_usd: 29,
        price_ugx: 107300,
        price_kes: 3770,
        price_monthly_usd: 39,
        billing_period: "annual",
        is_recommended: false,
        cta_text: "Start Free",
        cta_link: "/arcplus/trial",
        order: 0,
        feature_values: [
            { feature: 1, feature_name: "Asset Limit", feature_category: "core", value: "1,000", is_included: true },
            { feature: 2, feature_name: "RFID Support", feature_category: "core", value: "false", is_included: false },
        ],
    },
    {
        id: 2,
        name: "Growth",
        slug: "growth",
        tagline: "For growing orgs",
        asset_range: "Up to 5,000",
        price_usd: 79,
        price_ugx: 292300,
        price_kes: 10270,
        price_monthly_usd: 99,
        billing_period: "annual",
        is_recommended: true,
        cta_text: "Start Free",
        cta_link: "/arcplus/trial",
        order: 1,
        feature_values: [
            { feature: 1, feature_name: "Asset Limit", feature_category: "core", value: "5,000", is_included: true },
            { feature: 2, feature_name: "RFID Support", feature_category: "core", value: "true", is_included: true },
        ],
    },
];
