import type { Metadata } from "next";
import { ScannersPageClient } from "./ScannersPageClient";
import { fetchPageMeta, fetchHeroSection } from "@/lib/api/cms-server";

const DEFAULT_TITLE = "RFID Scanners & Readers | ABS Platform";
const DEFAULT_DESC =
    "Industrial-grade RFID scanners, handheld readers, and fixed infrastructure for enterprise asset tracking.";

export async function generateMetadata(): Promise<Metadata> {
    const meta = await fetchPageMeta("/scanners");
    return {
        title: meta?.title ?? DEFAULT_TITLE,
        description: meta?.description ?? DEFAULT_DESC,
        openGraph: {
            title: meta?.title ?? DEFAULT_TITLE,
            description: meta?.description ?? DEFAULT_DESC,
            url: "/scanners",
        },
    };
}

export default async function ScannersPage() {
    const hero = await fetchHeroSection("scanners");
    return <ScannersPageClient hero={hero} />;
}
