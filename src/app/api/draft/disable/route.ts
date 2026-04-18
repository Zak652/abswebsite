import { NextResponse } from "next/server";
import { draftMode } from "next/headers";

/**
 * Disable draft mode and redirect home.
 * GET /api/draft/disable
 */
export async function GET() {
    const dm = await draftMode();
    dm.disable();
    return NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"));
}
