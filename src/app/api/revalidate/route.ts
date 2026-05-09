import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import {
    clientIp,
    consumeRateLimit,
    timingSafeStringEqual,
} from "@/lib/api/security";

const REVALIDATION_SECRET = process.env.REVALIDATION_SECRET;

export async function POST(request: NextRequest) {
    const ip = clientIp(request);
    if (!consumeRateLimit(`revalidate:${ip}`, 30, 60_000)) {
        return NextResponse.json(
            { message: "Too many requests" },
            { status: 429 },
        );
    }

    const body = await request.json();
    const { secret, tags } = body as { secret?: string; tags?: string[] };

    if (
        !REVALIDATION_SECRET ||
        !secret ||
        !timingSafeStringEqual(secret, REVALIDATION_SECRET)
    ) {
        console.warn("Unauthorised /api/revalidate attempt from %s", ip);
        return NextResponse.json({ message: "Invalid secret" }, { status: 401 });
    }

    if (!tags || !Array.isArray(tags) || tags.length === 0) {
        return NextResponse.json(
            { message: "tags array is required" },
            { status: 400 }
        );
    }

    for (const tag of tags) {
        revalidateTag(tag, "default");
    }

    return NextResponse.json({ revalidated: true, tags });
}
