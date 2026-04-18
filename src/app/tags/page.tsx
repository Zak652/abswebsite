import type { Metadata } from "next";
import { TagsPageClient } from "./TagsPageClient";
import { fetchPageMeta, fetchHeroSection } from "@/lib/api/cms-server";

const DEFAULT_TITLE = "RFID & Barcode Tags | ABS Platform";
const DEFAULT_DESC =
    "High-durability RFID and barcode tags engineered for harsh industrial environments.";

export async function generateMetadata(): Promise<Metadata> {
    const meta = await fetchPageMeta("/tags");
    return {
        title: meta?.title ?? DEFAULT_TITLE,
        description: meta?.description ?? DEFAULT_DESC,
        openGraph: {
            title: meta?.title ?? DEFAULT_TITLE,
            description: meta?.description ?? DEFAULT_DESC,
            url: "/tags",
        },
    };
}

export default async function TagsPage() {
    const hero = await fetchHeroSection("tags");
    return <TagsPageClient hero={hero} />;
}
