"use client";

import type { ReactNode } from "react";
import { HeroSection } from "@/components/patterns/HeroSection";
import type { HeroSectionData } from "@/types/cms";

interface CMSHeroProps {
    hero: HeroSectionData | null;
    /** Fallback heading used when no CMS hero exists. */
    fallbackHeading: ReactNode;
    fallbackSubheading?: string;
    fallbackEyebrow?: string;
    /** Fallback hero image when no CMS background_image is set. */
    fallbackImageSrc?: string;
    fallbackImageAlt?: string;
    /** Fallback CTAs used when CMS hero has no CTA fields populated. */
    fallbackCtas?: { label: string; href: string; variant?: "primary" | "secondary" | "ghost" }[];
    /** Force a variant, ignoring the CMS choice. Optional. */
    variant?: "overlay" | "split";
    /** Suppress all CTAs (CMS + fallback). Use when the page renders its own CTA row. */
    hideCtas?: boolean;
    /** Pass-through visual props. */
    minHeight?: string;
    overlay?: boolean;
    className?: string;
    /** Set ``true`` only on the page where this hero is the LCP image
     * (i.e. the homepage). Defaulting to true regresses Lighthouse on
     * every other page that uses CMSHero. */
    priority?: boolean;
}

interface CMSBadge {
    text?: unknown;
    variant?: unknown;
}

function parseBadges(raw: unknown): { text: string; variant?: "default" | "accent" | "outline" }[] | undefined {
    if (!Array.isArray(raw) || raw.length === 0) return undefined;
    const out: { text: string; variant?: "default" | "accent" | "outline" }[] = [];
    for (const item of raw as CMSBadge[]) {
        if (item && typeof item.text === "string" && item.text.trim()) {
            const v = item.variant;
            const variant: "default" | "accent" | "outline" | undefined =
                v === "accent" || v === "outline" || v === "default" ? v : undefined;
            out.push({ text: item.text, ...(variant ? { variant } : {}) });
        }
    }
    return out.length > 0 ? out : undefined;
}

export function CMSHero({
    hero,
    fallbackHeading,
    fallbackSubheading,
    fallbackEyebrow,
    fallbackImageSrc,
    fallbackImageAlt,
    fallbackCtas,
    variant: forcedVariant,
    hideCtas = false,
    minHeight,
    overlay = true,
    className,
    priority = false,
}: CMSHeroProps) {
    const variant: "overlay" | "split" = forcedVariant ?? (hero?.variant === "split" ? "split" : "overlay");

    const headingText = hero?.headline ?? null;
    const heading: ReactNode = headingText
        ? headingText.split("\n").map((line, i, arr) => (
            <span key={i}>
                <span>{line}</span>
                {i < arr.length - 1 && <br />}
            </span>
        ))
        : fallbackHeading;

    const subheading = hero?.subheadline || fallbackSubheading;
    const eyebrow = hero?.eyebrow || fallbackEyebrow;
    const imageSrc = hero?.background_image?.file ?? fallbackImageSrc;
    const imageAlt = hero?.background_image?.alt_text ?? fallbackImageAlt ?? "Hero image";

    const cmsCtas: { label: string; href: string; variant?: "primary" | "secondary" | "ghost" }[] = [];
    if (hero?.cta_primary_text) {
        cmsCtas.push({
            label: hero.cta_primary_text,
            href: hero.cta_primary_link || "#",
            variant: "primary",
        });
    }
    if (hero?.cta_secondary_text) {
        cmsCtas.push({
            label: hero.cta_secondary_text,
            href: hero.cta_secondary_link || "#",
            variant: variant === "split" ? "secondary" : "ghost",
        });
    }
    const ctas = hideCtas ? undefined : (cmsCtas.length > 0 ? cmsCtas : fallbackCtas);

    const badges = parseBadges(hero?.badges);

    return (
        <HeroSection
            variant={variant}
            heading={heading}
            {...(subheading ? { subheading } : {})}
            {...(eyebrow ? { eyebrow } : {})}
            {...(imageSrc ? { imageSrc } : {})}
            {...(imageAlt ? { imageAlt } : {})}
            {...(ctas && ctas.length > 0 ? { ctas } : {})}
            {...(badges ? { badges } : {})}
            {...(minHeight ? { minHeight } : {})}
            overlay={overlay}
            {...(className ? { className } : {})}
            priority={priority}
        />
    );
}
