/**
 * Server-side product API fetcher (build guide § 3.2 Product JSON-LD).
 *
 * Mirrors the lazy SSR pattern in ``cms-server.ts``: native ``fetch``
 * with Next ISR tags, ``null`` on 404, no auth header needed because
 * the catalog endpoints are public.
 *
 * Why a separate module
 * ---------------------
 * `productsService` in ``api/products.ts`` uses the browser-side axios
 * instance (cookies, refresh interceptor). Server components can't
 * use it — there's no browser context, and it would risk hot-pathing
 * auth cookies into SSR responses. Keeping the SSR fetcher distinct
 * also leaves room for the cache strategy to diverge later (e.g. if
 * we add pricing computations, we want SSR to cache differently).
 */

import type { ProductDetail } from "@/types/products";

const PRODUCTS_API_BASE =
    process.env.CMS_API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:8000/api/v1";

async function productsFetch<T>(
    path: string,
    tags: string[],
): Promise<T | null> {
    const url = `${PRODUCTS_API_BASE}/products/${path}`;
    let res: Response;
    try {
        res = await fetch(url, { next: { tags, revalidate: 600 } });
    } catch (err) {
        // Network failures are non-fatal for SSR (e.g. blog post page
        // shouldn't go down because the product API is hiccupping).
        console.error(`products SSR fetch network error: ${url}`, err);
        return null;
    }
    if (res.status === 404) return null;
    if (!res.ok) {
        console.error(`products SSR fetch failed: ${res.status} ${url}`);
        return null;
    }
    return res.json() as Promise<T>;
}

export async function fetchProductBySlug(
    slug: string,
): Promise<ProductDetail | null> {
    return productsFetch<ProductDetail>(`${slug}/`, [
        "products",
        `product:${slug}`,
    ]);
}
