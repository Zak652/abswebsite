import type { Metadata } from "next";
import { ServicesPageClient } from "./ServicesPageClient";
import {
    fetchPageMeta,
    fetchHeroSection,
    fetchServiceOfferings,
} from "@/lib/api/cms-server";

const DEFAULT_TITLE = "Field Services | ABS Platform";
const DEFAULT_DESC =
    "Expert physical tagging, asset register building, and RFID deployment by ABS-certified field engineers.";

export async function generateMetadata(): Promise<Metadata> {
    const meta = await fetchPageMeta("/services");
    return {
        title: meta?.title ?? DEFAULT_TITLE,
        description: meta?.description ?? DEFAULT_DESC,
        openGraph: {
            title: meta?.title ?? DEFAULT_TITLE,
            description: meta?.description ?? DEFAULT_DESC,
            url: "/services",
            ...(meta?.og_image ? { images: [{ url: meta.og_image }] } : {}),
        },
    };
}

export default async function ServicesPage() {
    const [hero, cmsServices] = await Promise.all([
        fetchHeroSection("services"),
        fetchServiceOfferings(),
    ]);

    return <ServicesPageClient hero={hero} cmsServices={cmsServices} />;
}
