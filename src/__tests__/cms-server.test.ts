/**
 * Tests for the server-side CMS fetch layer (cms-server.ts).
 *
 * Validates that each fetch function:
 *  - calls the correct URL with ISR tags
 *  - returns parsed JSON on success
 *  - returns null on 404
 *  - returns null / empty array on non-OK responses
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// We need to mock global fetch before importing the module
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// Import after mocking fetch
import {
    fetchSiteSettings,
    fetchPageMeta,
    fetchHeroSection,
    fetchPageBlocks,
    fetchNavigation,
    fetchServiceOfferings,
    fetchArcplusModules,
    fetchPricingPlans,
    fetchSupportTiers,
    fetchCaseStudies,
    fetchCaseStudy,
} from "@/lib/api/cms-server";

function jsonResponse(data: unknown, status = 200) {
    return {
        ok: status >= 200 && status < 300,
        status,
        json: () => Promise.resolve(data),
    };
}

function notFoundResponse() {
    return { ok: false, status: 404, json: () => Promise.resolve(null) };
}

function errorResponse(status = 500) {
    return { ok: false, status, json: () => Promise.resolve(null) };
}

beforeEach(() => {
    mockFetch.mockReset();
});

/* ------------------------------------------------------------------ */
/*  fetchSiteSettings                                                 */
/* ------------------------------------------------------------------ */
describe("fetchSiteSettings", () => {
    it("returns settings data on success", async () => {
        const data = { company_email: "test@abs.com", company_phone: "+1234" };
        mockFetch.mockResolvedValueOnce(jsonResponse(data));

        const result = await fetchSiteSettings();
        expect(result).toEqual(data);
        expect(mockFetch).toHaveBeenCalledOnce();

        const [url, opts] = mockFetch.mock.calls[0];
        expect(url).toContain("/cms/settings/");
        expect(opts.next.tags).toContain("cms-settings");
        expect(opts.next.revalidate).toBe(600);
    });

    it("returns null on 404", async () => {
        mockFetch.mockResolvedValueOnce(notFoundResponse());
        expect(await fetchSiteSettings()).toBeNull();
    });

    it("returns null on server error", async () => {
        mockFetch.mockResolvedValueOnce(errorResponse());
        expect(await fetchSiteSettings()).toBeNull();
    });
});

/* ------------------------------------------------------------------ */
/*  fetchPageMeta                                                     */
/* ------------------------------------------------------------------ */
describe("fetchPageMeta", () => {
    it("passes route as query param", async () => {
        mockFetch.mockResolvedValueOnce(jsonResponse({ title: "Home" }));
        await fetchPageMeta("/");

        const [url] = mockFetch.mock.calls[0];
        expect(url).toContain("route=%2F");
    });

    it("includes page-specific ISR tag", async () => {
        mockFetch.mockResolvedValueOnce(jsonResponse({ title: "Test" }));
        await fetchPageMeta("/arcplus");

        const [, opts] = mockFetch.mock.calls[0];
        expect(opts.next.tags).toContain("cms-meta");
        expect(opts.next.tags).toContain("cms-meta-/arcplus");
    });
});

/* ------------------------------------------------------------------ */
/*  fetchHeroSection                                                  */
/* ------------------------------------------------------------------ */
describe("fetchHeroSection", () => {
    it("returns hero data for a given page", async () => {
        const hero = { headline: "Hello", subheadline: "World" };
        mockFetch.mockResolvedValueOnce(jsonResponse(hero));

        const result = await fetchHeroSection("home");
        expect(result).toEqual(hero);

        const [url, opts] = mockFetch.mock.calls[0];
        expect(url).toContain("/cms/hero/");
        expect(url).toContain("page=home");
        expect(opts.next.tags).toContain("cms-hero-home");
    });

    it("returns null when no hero exists", async () => {
        mockFetch.mockResolvedValueOnce(notFoundResponse());
        expect(await fetchHeroSection("nonexistent")).toBeNull();
    });
});

/* ------------------------------------------------------------------ */
/*  fetchPageBlocks — returns [] instead of null                      */
/* ------------------------------------------------------------------ */
describe("fetchPageBlocks", () => {
    it("returns blocks array on success", async () => {
        const blocks = [{ id: 1, block_type: "guided_path" }];
        mockFetch.mockResolvedValueOnce(jsonResponse(blocks));

        const result = await fetchPageBlocks("home");
        expect(result).toEqual(blocks);
    });

    it("returns empty array on 404", async () => {
        mockFetch.mockResolvedValueOnce(notFoundResponse());
        expect(await fetchPageBlocks("missing")).toEqual([]);
    });

    it("returns empty array on server error", async () => {
        mockFetch.mockResolvedValueOnce(errorResponse());
        expect(await fetchPageBlocks("broken")).toEqual([]);
    });
});

/* ------------------------------------------------------------------ */
/*  fetchNavigation                                                   */
/* ------------------------------------------------------------------ */
describe("fetchNavigation", () => {
    it("returns nav items for a location", async () => {
        const items = [{ id: 1, label: "Home", url: "/" }];
        mockFetch.mockResolvedValueOnce(jsonResponse(items));

        const result = await fetchNavigation("footer_platform");
        expect(result).toEqual(items);

        const [url] = mockFetch.mock.calls[0];
        expect(url).toContain("location=footer_platform");
    });

    it("returns empty array on failure", async () => {
        mockFetch.mockResolvedValueOnce(errorResponse());
        expect(await fetchNavigation("missing")).toEqual([]);
    });
});

/* ------------------------------------------------------------------ */
/*  fetchServiceOfferings                                             */
/* ------------------------------------------------------------------ */
describe("fetchServiceOfferings", () => {
    it("returns service offerings array", async () => {
        const services = [{ id: 1, title: "PAV" }];
        mockFetch.mockResolvedValueOnce(jsonResponse(services));

        const result = await fetchServiceOfferings();
        expect(result).toEqual(services);

        const [url] = mockFetch.mock.calls[0];
        expect(url).toContain("/cms/services/");
    });

    it("returns empty array on failure", async () => {
        mockFetch.mockResolvedValueOnce(notFoundResponse());
        expect(await fetchServiceOfferings()).toEqual([]);
    });
});

/* ------------------------------------------------------------------ */
/*  fetchArcplusModules                                               */
/* ------------------------------------------------------------------ */
describe("fetchArcplusModules", () => {
    it("returns modules and tags correctly", async () => {
        const modules = [{ id: 1, name: "Registry" }];
        mockFetch.mockResolvedValueOnce(jsonResponse(modules));

        const result = await fetchArcplusModules();
        expect(result).toEqual(modules);

        const [, opts] = mockFetch.mock.calls[0];
        expect(opts.next.tags).toContain("cms-arcplus-modules");
    });
});

/* ------------------------------------------------------------------ */
/*  fetchPricingPlans                                                 */
/* ------------------------------------------------------------------ */
describe("fetchPricingPlans", () => {
    it("returns pricing plans", async () => {
        const plans = [{ id: 1, name: "Starter", slug: "starter" }];
        mockFetch.mockResolvedValueOnce(jsonResponse(plans));

        const result = await fetchPricingPlans();
        expect(result).toEqual(plans);

        const [, opts] = mockFetch.mock.calls[0];
        expect(opts.next.tags).toContain("cms-arcplus-pricing");
    });

    it("returns empty array on failure", async () => {
        mockFetch.mockResolvedValueOnce(errorResponse());
        expect(await fetchPricingPlans()).toEqual([]);
    });
});

/* ------------------------------------------------------------------ */
/*  fetchSupportTiers                                                 */
/* ------------------------------------------------------------------ */
describe("fetchSupportTiers", () => {
    it("returns support tiers", async () => {
        const tiers = [{ id: 1, name: "Starter", slug: "starter" }];
        mockFetch.mockResolvedValueOnce(jsonResponse(tiers));
        expect(await fetchSupportTiers()).toEqual(tiers);
    });

    it("returns empty array on failure", async () => {
        mockFetch.mockResolvedValueOnce(notFoundResponse());
        expect(await fetchSupportTiers()).toEqual([]);
    });
});

/* ------------------------------------------------------------------ */
/*  fetchCaseStudies / fetchCaseStudy                                 */
/* ------------------------------------------------------------------ */
describe("fetchCaseStudies", () => {
    it("returns case studies array", async () => {
        const studies = [{ id: 1, title: "ABC Corp" }];
        mockFetch.mockResolvedValueOnce(jsonResponse(studies));
        expect(await fetchCaseStudies()).toEqual(studies);
    });

    it("returns empty array on failure", async () => {
        mockFetch.mockResolvedValueOnce(errorResponse());
        expect(await fetchCaseStudies()).toEqual([]);
    });
});

describe("fetchCaseStudy", () => {
    it("returns single case study by slug", async () => {
        const study = { id: 1, title: "ABC", slug: "abc" };
        mockFetch.mockResolvedValueOnce(jsonResponse(study));

        const result = await fetchCaseStudy("abc");
        expect(result).toEqual(study);

        const [url, opts] = mockFetch.mock.calls[0];
        expect(url).toContain("/cms/case-studies/abc/");
        expect(opts.next.tags).toContain("cms-case-study-abc");
    });

    it("returns null for unknown slug", async () => {
        mockFetch.mockResolvedValueOnce(notFoundResponse());
        expect(await fetchCaseStudy("unknown")).toBeNull();
    });
});
