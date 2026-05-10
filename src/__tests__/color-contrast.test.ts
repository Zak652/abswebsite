/**
 * Color-contrast policy test (build guide § 3.1).
 *
 * jsdom doesn't compute layout or styles, so axe-core's
 * ``color-contrast`` rule is unreliable in our vitest sweep. This
 * file pins the contrast contract programmatically: for each
 * documented foreground/background pair in the design system,
 * compute the WCAG 2.1 contrast ratio and assert it clears the
 * appropriate threshold.
 *
 * Thresholds (WCAG 2.1 § 1.4.3 AA):
 *   - normal text: 4.5:1
 *   - large text (≥18 pt or ≥14 pt bold): 3:1
 *   - UI component / large-text emphasis: 3:1
 *
 * Why this matters
 * ----------------
 * The Signal Orange brand colour (#F97316) is gorgeous as an icon
 * fill or button background, but it has only ~2.2:1 contrast against
 * the warm-white surface (#FCFBF9). Using it for body text or eyebrow
 * labels was the WCAG-AA failure flagged in the audit. The fix is
 * ``accent-700 (#B5441E)``, which clears 5.2:1 — that's the token
 * developers must reach for when an orange-coloured *text* node sits
 * on a light surface.
 */
import { describe, it, expect } from "vitest";

function hexToRgb(hex: string): [number, number, number] {
    const h = hex.replace("#", "");
    return [
        parseInt(h.slice(0, 2), 16),
        parseInt(h.slice(2, 4), 16),
        parseInt(h.slice(4, 6), 16),
    ];
}

function srgbToLinear(c: number): number {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function relativeLuminance(hex: string): number {
    const [r, g, b] = hexToRgb(hex).map(srgbToLinear) as [
        number,
        number,
        number,
    ];
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(fg: string, bg: string): number {
    const lf = relativeLuminance(fg);
    const lb = relativeLuminance(bg);
    const [light, dark] = lf > lb ? [lf, lb] : [lb, lf];
    return (light + 0.05) / (dark + 0.05);
}

// Source of truth: src/app/globals.css. Keep these in sync.
const PALETTE = {
    primary900: "#0B1F3A",
    accent500: "#F97316",
    accent600: "#E35B2C",
    accent700: "#B5441E",
    surfaceWarmWhite: "#FCFBF9",
    pureWhite: "#FFFFFF",
    neutral500: "#6b7280",
    neutral700: "#374151",
    neutral900: "#111827",
} as const;

describe("WCAG 2.1 AA contrast — text on light surface", () => {
    it("primary-900 navy body text passes AA on warm-white surface", () => {
        const ratio = contrastRatio(PALETTE.primary900, PALETTE.surfaceWarmWhite);
        expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it("neutral-700 secondary text passes AA on warm-white surface", () => {
        const ratio = contrastRatio(PALETTE.neutral700, PALETTE.surfaceWarmWhite);
        expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it("accent-700 (text orange) passes AA on warm-white surface", () => {
        const ratio = contrastRatio(PALETTE.accent700, PALETTE.surfaceWarmWhite);
        expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it("accent-700 also passes AA on pure white", () => {
        const ratio = contrastRatio(PALETTE.accent700, PALETTE.pureWhite);
        expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it("accent-500 (Signal Orange) is documented as decorative-only — it would FAIL AA as text", () => {
        // The point of pinning this is so a future PR that mass-replaces
        // accent-700 → accent-500 in text contexts trips this test.
        const ratio = contrastRatio(PALETTE.accent500, PALETTE.surfaceWarmWhite);
        expect(ratio).toBeLessThan(4.5);
        // The pair is also below the 3:1 large-text bar — so it's not
        // even safe for a 14pt-bold eyebrow on light surfaces.
        expect(ratio).toBeLessThan(3.0);
    });
});

describe("WCAG 2.1 AA contrast — text on dark / branded surface", () => {
    it("white text passes AA on primary-900 navy", () => {
        const ratio = contrastRatio(PALETTE.pureWhite, PALETTE.primary900);
        expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it("accent-500 text passes AA-large (3:1) on primary-900 navy", () => {
        // Footer, dark heroes, and admin sidebar use accent-500 on the
        // dark navy surface — pinning the 3:1 floor for large text.
        const ratio = contrastRatio(PALETTE.accent500, PALETTE.primary900);
        expect(ratio).toBeGreaterThanOrEqual(3.0);
    });

    it("white text on accent-600 (filled CTA bg) passes UI-component 3:1", () => {
        // Policy: filled orange CTAs use ``accent-600`` (#E35B2C) for the
        // background so white text clears 3.6:1 — Signal Orange itself
        // (accent-500) only gets to 2.8:1 with white on top, so it must
        // not be used as a button bg with light foreground.
        const ratio = contrastRatio(PALETTE.pureWhite, PALETTE.accent600);
        expect(ratio).toBeGreaterThanOrEqual(3.0);
    });

    it("white-on-accent-500 fails 3:1 — pin so accent-500 isn't used as filled-CTA bg", () => {
        const ratio = contrastRatio(PALETTE.pureWhite, PALETTE.accent500);
        expect(ratio).toBeLessThan(3.0);
    });
});
