import { NextRequest, NextResponse } from "next/server";
import { draftMode } from "next/headers";
import {
    clientIp,
    consumeRateLimit,
    timingSafeStringEqual,
} from "@/lib/api/security";

/**
 * Draft Mode enable endpoint.
 *
 * GET /api/draft?secret=<token>&slug=<page>
 *
 * Sets Next.js draft mode cookies and redirects to the target page.
 *
 * - Constant-time secret compare (§ 2.3.3)
 * - Rate-limited per IP (10/min) to slow brute-force on the secret
 * - `slug` must be an internal absolute path; rejects open-redirect attempts
 */
const SLUG_PATTERN = /^\/[A-Za-z0-9_\-/.]*$/;

export async function GET(request: NextRequest) {
    const ip = clientIp(request);
    if (!consumeRateLimit(`draft:${ip}`, 10, 60_000)) {
        return NextResponse.json(
            { message: "Too many requests" },
            { status: 429 },
        );
    }

    const { searchParams } = request.nextUrl;
    const secret = searchParams.get("secret");
    const slug = searchParams.get("slug") ?? "/";

    const expectedSecret = process.env.DRAFT_MODE_SECRET;
    if (
        !expectedSecret ||
        !secret ||
        !timingSafeStringEqual(secret, expectedSecret)
    ) {
        console.warn("Unauthorised /api/draft attempt from %s", ip);
        return NextResponse.json({ message: "Invalid secret" }, { status: 401 });
    }

    if (!SLUG_PATTERN.test(slug) || slug.startsWith("//")) {
        return NextResponse.json(
            { message: "Invalid slug" },
            { status: 400 },
        );
    }

    const dm = await draftMode();
    dm.enable();

    const url = new URL(slug, request.nextUrl.origin);
    return NextResponse.redirect(url);
}
