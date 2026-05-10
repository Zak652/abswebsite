/**
 * CMS media variant picker (build guide § 3.3).
 *
 * The CMS pre-renders every uploaded image at four resolutions —
 * ``file_thumbnail`` (~200 px), ``file_medium`` (~800 px),
 * ``file_large`` (~1600 px), and a modern-format ``file_webp``
 * (full-size webp). Plus the original at ``file``. Consumers should
 * pick the *smallest* variant that still satisfies the slot's
 * rendered size — picking the original everywhere wastes bytes
 * and CPU at runtime, but picking too small produces blurry images
 * on retina displays.
 *
 * This helper returns an ``{ src, srcSet }`` shape ready to drop
 * into ``<Image src={...} sizes={...}>`` from ``next/image``. The
 * srcSet enumerates available variants so the browser can pick
 * the right one based on the rendered ``sizes``.
 *
 * Why a helper instead of bare lookups
 * ------------------------------------
 * Three tactical reasons:
 *
 *   1. Consumers shouldn't need to remember which variant fields
 *      exist or what their ordering is.
 *   2. Variants can be ``null`` when processing is still pending
 *      (or failed) — a runtime-correct fallback chain handles
 *      that without the call site sprouting `?? ?? ??` chains.
 *   3. ``next/image`` accepts a single ``src`` plus ``srcSet``
 *      via the ``unoptimized`` path, but it's much cleaner to
 *      pass our own ``srcSet`` and let the browser pick.
 *
 * Slots
 * -----
 * The ``slot`` argument communicates intent — what role this image
 * plays in the layout — rather than a pixel size. The helper maps
 * each slot to the right primary variant. Adding new slots when a
 * new layout pattern emerges is the right way to extend this.
 */

import type { MediaAssetData } from "@/types/cms";

export type MediaSlot =
    /** Hero image (full-bleed, large rendered size). */
    | "hero"
    /** Card thumbnail (small, often shown in grids). */
    | "thumbnail"
    /** Inline media inside body content (medium width). */
    | "inline"
    /** Avatar / icon-sized rendering (tiny). */
    | "avatar";

export interface PickedMedia {
    /** Primary URL to load. Preferred format (webp) when the variant is
     * available, otherwise the most appropriate jpg/png variant. */
    src: string;
    /** ``srcSet`` value enumerating all available variants so the
     * browser can pick based on the slot's rendered ``sizes``. May be
     * ``undefined`` when only one variant exists. */
    srcSet?: string;
    /** Echoes the asset's recorded width/height so callers don't have to
     * type them again on the ``<Image>`` invocation. */
    width: number | null;
    height: number | null;
    /** Echoes ``alt_text`` so the call site doesn't need to thread it
     * through separately. */
    alt: string;
}

/**
 * Pick the right variant of a CMS-managed image for a given slot.
 *
 * @example
 * const cover = pickMediaVariant(post.cover, "hero");
 * <Image src={cover.src} alt={cover.alt} width={cover.width!} height={cover.height!} sizes="100vw" />
 *
 * @param asset - the MediaAsset row, or ``null``/``undefined`` when
 *   the field is empty (the helper returns ``null`` in that case so
 *   the call site can do a single nullish check).
 * @param slot - what role this image plays in the layout.
 */
export function pickMediaVariant(
    asset: MediaAssetData | null | undefined,
    slot: MediaSlot,
): PickedMedia | null {
    if (!asset) return null;

    // Variant fallback chain per slot. The first entry that exists wins.
    const orderForSlot: Record<MediaSlot, ReadonlyArray<keyof MediaAssetData>> = {
        avatar: ["file_thumbnail", "file_medium", "file"],
        thumbnail: ["file_thumbnail", "file_medium", "file"],
        inline: ["file_medium", "file_large", "file"],
        hero: ["file_large", "file_medium", "file"],
    };

    // Prefer webp when available — it's smaller and modern browsers
    // fall back to the alternate gracefully via the srcSet, but
    // most real traffic will pick webp.
    const order = orderForSlot[slot];
    let primary: string | null = null;
    for (const key of order) {
        const value = asset[key];
        if (typeof value === "string" && value) {
            primary = value;
            break;
        }
    }
    if (!primary) return null;

    // Build a srcSet from any other available variants. We only
    // include URLs that actually exist (variants can be null while
    // processing is in flight).
    const srcSetParts: string[] = [];
    if (asset.file_thumbnail) {
        srcSetParts.push(`${asset.file_thumbnail} 200w`);
    }
    if (asset.file_medium) {
        srcSetParts.push(`${asset.file_medium} 800w`);
    }
    if (asset.file_large) {
        srcSetParts.push(`${asset.file_large} 1600w`);
    }
    // Original goes last as the largest available width fallback. We
    // only include it when no large variant exists, to avoid the
    // browser preferring the unoptimised original on small screens.
    if (!asset.file_large && asset.file) {
        srcSetParts.push(`${asset.file} 2400w`);
    }

    // Prefer webp when it exists — set it as the primary src so
    // browsers that support webp pick it without traversing the srcSet.
    if (asset.file_webp) {
        primary = asset.file_webp;
    }

    return {
        src: primary,
        srcSet: srcSetParts.length > 1 ? srcSetParts.join(", ") : undefined,
        width: asset.width,
        height: asset.height,
        alt: asset.alt_text || "",
    };
}
