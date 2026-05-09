/**
 * SEO builder tests (§ 3.2).
 *
 * Goal: prove the JSON-LD shape we hand to crawlers matches schema.org
 * expectations, the CMS organization_schema override path actually
 * overrides, and absoluteUrl makes the right call on a few inputs.
 */
import { describe, it, expect } from "vitest";
import {
    absoluteUrl,
    buildArticleLd,
    buildOrganizationLd,
    buildProductLd,
    SITE_BASE_URL,
} from "@/lib/seo";
import type { BlogPostData, SiteSettingsData } from "@/types/cms";

describe("absoluteUrl", () => {
    it("returns absolute https URLs unchanged", () => {
        expect(absoluteUrl("https://example.com/x")).toBe("https://example.com/x");
    });

    it("returns absolute http URLs unchanged", () => {
        expect(absoluteUrl("http://example.com/x")).toBe("http://example.com/x");
    });

    it("prepends SITE_BASE_URL to a leading-slash path", () => {
        expect(absoluteUrl("/resources/blog/foo")).toBe(
            `${SITE_BASE_URL}/resources/blog/foo`,
        );
    });

    it("prepends SITE_BASE_URL with a slash when input is bare", () => {
        expect(absoluteUrl("foo")).toBe(`${SITE_BASE_URL}/foo`);
    });

    it("returns SITE_BASE_URL for empty input", () => {
        expect(absoluteUrl("")).toBe(SITE_BASE_URL);
    });
});

describe("buildOrganizationLd", () => {
    it("returns the brand-defaults shape when no settings are provided", () => {
        const ld = buildOrganizationLd(null);
        expect(ld["@context"]).toBe("https://schema.org");
        expect(ld["@type"]).toBe("Organization");
        expect(ld.name).toBe("Asset Business Solutions");
        expect(ld.url).toBe(SITE_BASE_URL);
    });

    it("merges contact details from site settings", () => {
        const settings = {
            company_email: "info@absasset.com",
            company_phone: "+256 414 698346",
            company_address: "Plot 2048\nWakiso",
            social_links: { linkedin: "https://linkedin.com/company/abs" },
            organization_schema: {},
            currency_rates: {},
            default_og_image: null,
            google_analytics_id: "",
            updated_at: "2026-05-01T00:00:00Z",
        } satisfies SiteSettingsData;

        const ld = buildOrganizationLd(settings);
        expect(ld.email).toBe("info@absasset.com");
        expect(ld.telephone).toBe("+256 414 698346");
        expect(ld.address).toMatchObject({
            "@type": "PostalAddress",
            streetAddress: "Plot 2048\nWakiso",
        });
        expect(ld.sameAs).toEqual(["https://linkedin.com/company/abs"]);
    });

    it("CMS organization_schema overrides the base shape", () => {
        const settings = {
            company_email: "",
            company_phone: "",
            company_address: "",
            social_links: {},
            organization_schema: {
                name: "Custom Brand Name",
                foundingDate: "2018",
            },
            currency_rates: {},
            default_og_image: null,
            google_analytics_id: "",
            updated_at: "2026-05-01T00:00:00Z",
        } satisfies SiteSettingsData;

        const ld = buildOrganizationLd(settings);
        expect(ld.name).toBe("Custom Brand Name");
        expect(ld.foundingDate).toBe("2018");
        // base fields still present
        expect(ld["@context"]).toBe("https://schema.org");
        expect(ld["@type"]).toBe("Organization");
    });

    it("filters out non-string social_links values", () => {
        const settings = {
            company_email: "",
            company_phone: "",
            company_address: "",
            // Cast intentionally — exercising the runtime guard against
            // a field that the TS type forbids but a CMS payload could
            // still produce if the JSON shape drifts.
            social_links: {
                linkedin: "https://linkedin.com/company/abs",
                x: 42,
            } as unknown as Record<string, string>,
            organization_schema: {},
            currency_rates: {},
            default_og_image: null,
            google_analytics_id: "",
            updated_at: "2026-05-01T00:00:00Z",
        } as SiteSettingsData;
        const ld = buildOrganizationLd(settings);
        expect(ld.sameAs).toEqual(["https://linkedin.com/company/abs"]);
    });
});

describe("buildArticleLd", () => {
    const basePost: BlogPostData = {
        id: 1,
        title: "How RFID Cuts Asset Loss By 80%",
        slug: "how-rfid-cuts-asset-loss",
        excerpt: "A 5-minute read on the impact of RFID in warehousing.",
        body: "<p>full body</p>",
        featured_image: null,
        category: null,
        author_name: "Alice Adams",
        author_avatar: null,
        seo_keywords: "rfid, asset tracking, warehouse",
        reading_time_minutes: 5,
        is_featured: false,
        order: 0,
        published_at: "2026-04-01T12:00:00Z",
        created_at: "2026-04-01T12:00:00Z",
    };

    it("emits the BlogPosting shape with required fields", () => {
        const ld = buildArticleLd(basePost, "/resources/blog/foo");
        expect(ld["@type"]).toBe("BlogPosting");
        expect(ld.headline).toBe("How RFID Cuts Asset Loss By 80%");
        expect(ld.url).toBe(`${SITE_BASE_URL}/resources/blog/foo`);
        expect(ld.author).toMatchObject({ name: "Alice Adams" });
        expect(ld.datePublished).toBe("2026-04-01T12:00:00Z");
        expect(ld.publisher).toMatchObject({ "@type": "Organization" });
    });

    it("truncates the headline at 110 chars per Google's recommendation", () => {
        const long = { ...basePost, title: "x".repeat(200) };
        const ld = buildArticleLd(long, "/resources/blog/long");
        expect((ld.headline as string).length).toBeLessThanOrEqual(110);
    });

    it("includes the featured image as an absolute URL when present", () => {
        const withImage: BlogPostData = {
            ...basePost,
            featured_image: {
                id: "m1",
                file: "/media/blog/cover.jpg",
                file_webp: null,
                file_thumbnail: null,
                file_medium: null,
                file_large: null,
                filename: "cover.jpg",
                alt_text: "",
                caption: "",
                file_size: 0,
                width: 1200,
                height: 630,
                processing_status: "completed",
                usage_count: 0,
                tags: [],
                asset_type: "image",
                created_at: "",
            },
        };
        const ld = buildArticleLd(withImage, "/resources/blog/x");
        expect(ld.image).toEqual([`${SITE_BASE_URL}/media/blog/cover.jpg`]);
    });
});

describe("buildProductLd", () => {
    it("emits the Product shape with quote-only Offer", () => {
        const ld = buildProductLd({
            name: "Handheld Series 700",
            slug: "handheld-series-700",
            description: "Industrial RFID handheld scanner.",
            images: ["/media/scanners/700.jpg"],
            category: "scanner",
        });
        expect(ld["@type"]).toBe("Product");
        expect(ld.url).toBe(`${SITE_BASE_URL}/scanners/handheld-series-700`);
        const offers = ld.offers as Record<string, unknown>;
        expect(offers.availability).toBe("https://schema.org/InStock");
        expect(offers.url).toBe(`${SITE_BASE_URL}/rfq`);
        expect(ld.image).toEqual([`${SITE_BASE_URL}/media/scanners/700.jpg`]);
    });

    it("uses the right URL prefix for tag products", () => {
        const ld = buildProductLd({
            name: "Industrial Tag IT250",
            slug: "industrial-rfid-tag-it250",
            description: "Heat- and chemical-resistant RFID tag.",
            images: [],
            category: "tag",
        });
        expect(ld.url).toBe(`${SITE_BASE_URL}/tags/industrial-rfid-tag-it250`);
    });

    it("falls back to the slug when no SKU is supplied", () => {
        const ld = buildProductLd({
            name: "Test",
            slug: "test-slug",
            description: "test",
            images: [],
            category: "scanner",
        });
        expect(ld.sku).toBe("test-slug");
    });
});
