/**
 * pickMediaVariant (build guide § 3.3).
 *
 * The CMS pre-renders multiple resolutions; consumers should pick the
 * smallest variant that satisfies their slot. This test pins the
 * fallback chain so a regression doesn't silently start serving the
 * full-size original to every avatar.
 */
import { describe, it, expect } from "vitest";
import { pickMediaVariant } from "@/lib/media";
import type { MediaAssetData } from "@/types/cms";

function asset(overrides: Partial<MediaAssetData> = {}): MediaAssetData {
    return {
        id: "1",
        file: "https://cdn.example/orig.jpg",
        asset_type: "image",
        filename: "orig.jpg",
        alt_text: "An example image",
        caption: "",
        file_size: 1234,
        width: 2400,
        height: 1600,
        file_webp: "https://cdn.example/orig.webp",
        file_thumbnail: "https://cdn.example/thumb.jpg",
        file_medium: "https://cdn.example/medium.jpg",
        file_large: "https://cdn.example/large.jpg",
        processing_status: "completed",
        tags: [],
        usage_count: 0,
        created_at: "2026-01-01T00:00:00Z",
        ...overrides,
    };
}

describe("pickMediaVariant", () => {
    it("returns null when the asset is null/undefined", () => {
        expect(pickMediaVariant(null, "hero")).toBeNull();
        expect(pickMediaVariant(undefined, "thumbnail")).toBeNull();
    });

    it("prefers webp as primary src when available", () => {
        const picked = pickMediaVariant(asset(), "hero");
        expect(picked?.src).toBe("https://cdn.example/orig.webp");
    });

    it("falls back to the slot-appropriate variant when webp is missing", () => {
        // hero slot wants `file_large` first, then `file_medium`, then `file`.
        const picked = pickMediaVariant(
            asset({ file_webp: null, file_large: "https://cdn.example/large.jpg" }),
            "hero",
        );
        expect(picked?.src).toBe("https://cdn.example/large.jpg");
    });

    it("avatar slot prefers thumbnail variant when webp is absent", () => {
        const picked = pickMediaVariant(
            asset({ file_webp: null }),
            "avatar",
        );
        // webp absent → fallback chain for avatar is thumbnail → medium → file.
        expect(picked?.src).toBe("https://cdn.example/thumb.jpg");
    });

    it("inline slot prefers medium variant when webp is absent", () => {
        const picked = pickMediaVariant(
            asset({ file_webp: null }),
            "inline",
        );
        expect(picked?.src).toBe("https://cdn.example/medium.jpg");
    });

    it("falls back to the original file when only that exists", () => {
        const picked = pickMediaVariant(
            asset({
                file_webp: null,
                file_thumbnail: null,
                file_medium: null,
                file_large: null,
            }),
            "hero",
        );
        expect(picked?.src).toBe("https://cdn.example/orig.jpg");
    });

    it("includes every available variant in srcSet (with widths)", () => {
        const picked = pickMediaVariant(asset(), "hero");
        expect(picked?.srcSet).toContain("https://cdn.example/thumb.jpg 200w");
        expect(picked?.srcSet).toContain("https://cdn.example/medium.jpg 800w");
        expect(picked?.srcSet).toContain("https://cdn.example/large.jpg 1600w");
    });

    it("does not include the original file in srcSet when a large variant exists", () => {
        // Otherwise small-screen browsers might pick the un-optimised
        // 2400w original over the 1600w optimised file_large.
        const picked = pickMediaVariant(asset(), "hero");
        expect(picked?.srcSet).not.toContain("orig.jpg 2400w");
    });

    it("includes the original file in srcSet only when no large variant exists", () => {
        const picked = pickMediaVariant(
            asset({ file_large: null }),
            "hero",
        );
        expect(picked?.srcSet).toContain("https://cdn.example/orig.jpg 2400w");
    });

    it("omits srcSet when only one variant is available", () => {
        const picked = pickMediaVariant(
            asset({
                file_webp: null,
                file_thumbnail: null,
                file_medium: null,
                file_large: null,
            }),
            "hero",
        );
        expect(picked?.srcSet).toBeUndefined();
    });

    it("echoes width/height/alt from the asset", () => {
        const picked = pickMediaVariant(asset(), "hero");
        expect(picked?.width).toBe(2400);
        expect(picked?.height).toBe(1600);
        expect(picked?.alt).toBe("An example image");
    });

    it("returns empty alt string when the asset has no alt_text (so the call site renders alt=\"\" rather than 'undefined')", () => {
        const picked = pickMediaVariant(asset({ alt_text: "" }), "hero");
        expect(picked?.alt).toBe("");
    });

    it("returns null if the asset has no usable file at all (truly broken row)", () => {
        const picked = pickMediaVariant(
            asset({
                file: "",
                file_webp: null,
                file_thumbnail: null,
                file_medium: null,
                file_large: null,
            }),
            "hero",
        );
        expect(picked).toBeNull();
    });
});
