/**
 * Server-side CMS data fetching for Next.js RSC pages.
 *
 * Uses native fetch() with Next.js ISR tags for on-demand revalidation.
 * All functions are async and intended for use in Server Components only.
 */

import type {
    SiteSettingsData,
    PageMetaData,
    HeroSectionData,
    PageBlockData,
    NavigationItemData,
    ServiceOfferingData,
    ArcplusModuleData,
    PricingPlanData,
    SupportTierData,
    CaseStudyData,
    DocumentationPageData,
    APIEndpointGroupData,
    BlogCategoryData,
    BlogPostData,
    TestimonialData,
} from "@/types/cms";
import { draftMode } from "next/headers";

const CMS_API_BASE =
    process.env.CMS_API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:8000/api/v1";

/**
 * Internal helper — fetch from Django CMS API with ISR caching.
 * Returns `null` on 404, throws on other errors.
 *
 * When `draft` is true, skips the cache and requests draft content.
 */
async function cmsFetch<T>(
    path: string,
    tags: string[],
    params?: Record<string, string>,
    draft = false
): Promise<T | null> {
    const url = new URL(`${CMS_API_BASE}/cms/${path}`);
    if (params) {
        for (const [k, v] of Object.entries(params)) {
            url.searchParams.set(k, v);
        }
    }
    if (draft) {
        url.searchParams.set("draft", "true");
    }

    const fetchOptions: RequestInit = draft
        ? { cache: "no-store" }
        : { next: { tags, revalidate: 600 } };

    let res: Response;
    try {
        res = await fetch(url.toString(), fetchOptions);
    } catch (err) {
        console.error(`CMS fetch network error for ${url.pathname}:`, err);
        return null;
    }

    if (res.status === 404) return null;

    if (!res.ok) {
        console.error(`CMS fetch failed: ${res.status} ${url.pathname}`);
        return null;
    }

    return res.json() as Promise<T>;
}

/* ------------------------------------------------------------------ */
/*  Public fetch functions                                            */
/* ------------------------------------------------------------------ */

export async function fetchSiteSettings(): Promise<SiteSettingsData | null> {
    return cmsFetch<SiteSettingsData>("settings/", ["cms-settings"]);
}

export async function fetchPageMeta(
    route: string
): Promise<PageMetaData | null> {
    return cmsFetch<PageMetaData>("meta/", ["cms-meta", `cms-meta-${route}`], {
        route,
    });
}

export async function fetchHeroSection(
    page: string
): Promise<HeroSectionData | null> {
    return cmsFetch<HeroSectionData>(
        "hero/",
        ["cms-hero", `cms-hero-${page}`],
        { page }
    );
}

export async function fetchPageBlocks(
    page: string
): Promise<PageBlockData[]> {
    return (
        (await cmsFetch<PageBlockData[]>(
            "blocks/",
            ["cms-blocks", `cms-blocks-${page}`],
            { page }
        )) ?? []
    );
}

export async function fetchNavigation(
    location: string
): Promise<NavigationItemData[]> {
    return (
        (await cmsFetch<NavigationItemData[]>(
            "navigation/",
            ["cms-nav", `cms-nav-${location}`],
            { location }
        )) ?? []
    );
}

export async function fetchServiceOfferings(): Promise<ServiceOfferingData[]> {
    return (
        (await cmsFetch<ServiceOfferingData[]>("services/", ["cms-services"])) ?? []
    );
}

export async function fetchArcplusModules(): Promise<ArcplusModuleData[]> {
    return (
        (await cmsFetch<ArcplusModuleData[]>("arcplus/modules/", [
            "cms-arcplus-modules",
        ])) ?? []
    );
}

export async function fetchPricingPlans(): Promise<PricingPlanData[]> {
    return (
        (await cmsFetch<PricingPlanData[]>("arcplus/pricing/", [
            "cms-arcplus-pricing",
        ])) ?? []
    );
}

export async function fetchSupportTiers(): Promise<SupportTierData[]> {
    return (
        (await cmsFetch<SupportTierData[]>("support-tiers/", [
            "cms-support-tiers",
        ])) ?? []
    );
}

export async function fetchCaseStudies(): Promise<CaseStudyData[]> {
    return (
        (await cmsFetch<CaseStudyData[]>("case-studies/", [
            "cms-case-studies",
        ])) ?? []
    );
}

export async function fetchCaseStudy(
    slug: string
): Promise<CaseStudyData | null> {
    return cmsFetch<CaseStudyData>(`case-studies/${slug}/`, [
        "cms-case-studies",
        `cms-case-study-${slug}`,
    ]);
}

export async function fetchDocumentationPages(): Promise<DocumentationPageData[]> {
    return (
        (await cmsFetch<DocumentationPageData[]>("documentation/", [
            "cms-documentation",
        ])) ?? []
    );
}

export async function fetchAPIEndpointGroups(): Promise<APIEndpointGroupData[]> {
    return (
        (await cmsFetch<APIEndpointGroupData[]>("api-endpoints/", [
            "cms-api-endpoints",
        ])) ?? []
    );
}

/* ------------------------------------------------------------------ */
/*  Blog                                                              */
/* ------------------------------------------------------------------ */

export async function fetchBlogCategories(): Promise<BlogCategoryData[]> {
    return (
        (await cmsFetch<BlogCategoryData[]>("blog/categories/", [
            "cms-blog-categories",
        ])) ?? []
    );
}

export async function fetchBlogPosts(
    category?: string
): Promise<BlogPostData[]> {
    const qs = category ? `?category=${encodeURIComponent(category)}` : "";
    return (
        (await cmsFetch<BlogPostData[]>(`blog/${qs}`, [
            "cms-blog-posts",
        ])) ?? []
    );
}

export async function fetchBlogPost(
    slug: string
): Promise<BlogPostData | null> {
    return cmsFetch<BlogPostData>(`blog/${encodeURIComponent(slug)}/`, [
        "cms-blog-posts",
    ]);
}

/* ------------------------------------------------------------------ */
/*  Testimonials                                                      */
/* ------------------------------------------------------------------ */

export async function fetchTestimonials(
    placement?: string
): Promise<TestimonialData[]> {
    const qs = placement ? `?placement=${encodeURIComponent(placement)}` : "";
    return (
        (await cmsFetch<TestimonialData[]>(`testimonials/${qs}`, [
            "cms-testimonials",
        ])) ?? []
    );
}

/**
 * Check whether Next.js draft mode is active for the current request.
 * Use this in Server Components: `const draft = await isDraftMode();`
 */
export async function isDraftMode(): Promise<boolean> {
    const dm = await draftMode();
    return dm.isEnabled;
}
