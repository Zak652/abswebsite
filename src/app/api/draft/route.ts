import { NextRequest, NextResponse } from "next/server";
import { draftMode } from "next/headers";

/**
 * Draft Mode enable endpoint.
 *
 * GET /api/draft?secret=<token>&slug=<page>
 *
 * Sets Next.js draft mode cookies and redirects to the target page.
 */
export async function GET(request: NextRequest) {
    const { searchParams } = request.nextUrl;
    const secret = searchParams.get("secret");
    const slug = searchParams.get("slug") ?? "/";

    const expectedSecret = process.env.DRAFT_MODE_SECRET;
    if (!expectedSecret || secret !== expectedSecret) {
        return NextResponse.json({ message: "Invalid secret" }, { status: 401 });
    }

    const dm = await draftMode();
    dm.enable();

    // Redirect to the target page
    const url = new URL(slug, request.nextUrl.origin);
    return NextResponse.redirect(url);
}
