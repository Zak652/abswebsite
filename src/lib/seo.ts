/**
 * Structured-data (JSON-LD) builders for the SEO surface.
 *
 * Renders schema.org objects that Google's Rich Results Test can read
 * — Article on blog posts, Organization at the site root, Product on
 * hardware detail pages (when wired). Each builder returns a plain
 * object; the ``<JsonLd>`` component handles the actual ``<script>``
 * emission so we never accidentally render via ``dangerouslySetInnerHTML``
 * with un-stringified content.
 *
 * Why builders + a component
 * --------------------------
 * Direct ``<script>`` tags in metadata don't play nicely with Next's
 * Metadata API (the ``other`` field expects scalar values, not
 * markup). Inlining a render at the JSX root of a page works the
 * same for crawlers — Google's Rich Results Test reads any JSON-LD
 * regardless of position in the DOM.
 */

import type { BlogPostData, SiteSettingsData } from "@/types/cms";

export const SITE_BASE_URL =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://absplatform.com";

/**
 * Make an absolute URL from either an already-absolute URL or a
 * site-relative path. Returns the input unchanged if it doesn't
 * parse — falls back to safest behaviour rather than mangling.
 */
export function absoluteUrl(input: string): string {
    if (!input) return SITE_BASE_URL;
    try {
        // If it parses as a URL with a scheme, leave it alone.
        const u = new URL(input);
        if (u.protocol === "http:" || u.protocol === "https:") return input;
    } catch {
        // fall through to relative-path handling
    }
    if (input.startsWith("/")) {
        return `${SITE_BASE_URL.replace(/\/$/, "")}${input}`;
    }
    return `${SITE_BASE_URL.replace(/\/$/, "")}/${input}`;
}

/**
 * schema.org Organization object for the site root.
 *
 * Composes a base shape from the brand constants with whatever the
 * CMS admin has dropped into ``site_settings.organization_schema``,
 * so editors can extend (e.g. add ``sameAs`` social links) without a
 * code deploy. The CMS object always wins on conflict because that's
 * the explicit override mechanism.
 */
export function buildOrganizationLd(
    settings: SiteSettingsData | null | undefined,
): Record<string, unknown> {
    const base: Record<string, unknown> = {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "Asset Business Solutions",
        alternateName: "ABS Platform",
        url: SITE_BASE_URL,
        logo: `${SITE_BASE_URL}/images/abs-logo-white.png`,
    };

    if (settings) {
        if (settings.company_email) {
            base.email = settings.company_email;
        }
        if (settings.company_phone) {
            base.telephone = settings.company_phone;
        }
        if (settings.company_address) {
            base.address = {
                "@type": "PostalAddress",
                streetAddress: settings.company_address,
                addressCountry: "UG",
            };
        }
        if (settings.social_links && Object.keys(settings.social_links).length > 0) {
            base.sameAs = Object.values(settings.social_links).filter(
                (v): v is string => typeof v === "string" && v.length > 0,
            );
        }
        if (
            settings.organization_schema &&
            Object.keys(settings.organization_schema).length > 0
        ) {
            // CMS override wins — admins use this to add fields we
            // haven't modelled yet (founder, foundingDate, etc.)
            return { ...base, ...settings.organization_schema };
        }
    }

    return base;
}

/**
 * schema.org Article (BlogPosting) for a blog post.
 *
 * Maps cleanly off the existing ``BlogPostData`` shape. Headline is
 * truncated at 110 chars per Google's recommendation.
 */
export function buildArticleLd(
    post: BlogPostData,
    pathname: string,
): Record<string, unknown> {
    const url = absoluteUrl(pathname);
    return {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: post.title.slice(0, 110),
        description: post.excerpt || undefined,
        url,
        mainEntityOfPage: { "@type": "WebPage", "@id": url },
        datePublished: post.published_at ?? undefined,
        dateModified: post.published_at ?? undefined,
        author: post.author_name
            ? { "@type": "Person", name: post.author_name }
            : undefined,
        image: post.featured_image
            ? [absoluteUrl(post.featured_image.file)]
            : undefined,
        keywords: post.seo_keywords || undefined,
        publisher: {
            "@type": "Organization",
            name: "Asset Business Solutions",
            logo: {
                "@type": "ImageObject",
                url: `${SITE_BASE_URL}/images/abs-logo-white.png`,
            },
        },
    };
}

/**
 * schema.org Product for a hardware detail page.
 *
 * Currently unused — the scanner/tag detail pages render through a
 * client component that fetches the product after hydration, so
 * there's no SSR object to feed this with yet. Once those pages get
 * a server-side fetch (build guide § 3.2, follow-up), wire this in
 * via ``<JsonLd data={buildProductLd(product, ...)} />``.
 */
export function buildProductLd(args: {
    name: string;
    slug: string;
    description: string;
    images: string[];
    category: "scanner" | "tag";
    sku?: string;
}): Record<string, unknown> {
    const url = absoluteUrl(
        `${args.category === "scanner" ? "/scanners" : "/tags"}/${args.slug}`,
    );
    return {
        "@context": "https://schema.org",
        "@type": "Product",
        name: args.name,
        description: args.description,
        image: args.images.length > 0 ? args.images.map(absoluteUrl) : undefined,
        sku: args.sku || args.slug,
        url,
        brand: { "@type": "Brand", name: "ABS Platform" },
        offers: {
            "@type": "Offer",
            availability: "https://schema.org/InStock",
            url: absoluteUrl("/rfq"),
            priceCurrency: "USD",
            // Quote-only — no advertised price.
            price: "0",
            priceSpecification: {
                "@type": "PriceSpecification",
                priceCurrency: "USD",
                description: "Quote on request",
            },
        },
    };
}
