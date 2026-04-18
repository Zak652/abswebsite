import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

const REVALIDATION_SECRET = process.env.REVALIDATION_SECRET;

export async function POST(request: NextRequest) {
    const body = await request.json();
    const { secret, tags } = body as { secret?: string; tags?: string[] };

    if (!REVALIDATION_SECRET || secret !== REVALIDATION_SECRET) {
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
