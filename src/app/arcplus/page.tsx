import type { Metadata } from "next";
import { ArcplusPageClient } from "./ArcplusPageClient";
import {
    fetchPageMeta,
    fetchHeroSection,
    fetchArcplusModules,
    fetchPricingPlans,
    fetchPageBlocks,
    fetchSiteSettings,
} from "@/lib/api/cms-server";

const DEFAULT_TITLE = "Arcplus Asset Management Platform | ABS";
const DEFAULT_DESC =
    "Enterprise asset lifecycle management — register, operate, maintain, depreciate, and dispose of assets in one unified platform. Start your free trial today.";

export async function generateMetadata(): Promise<Metadata> {
    const meta = await fetchPageMeta("/arcplus");
    return {
        title: meta?.title ?? DEFAULT_TITLE,
        description: meta?.description ?? DEFAULT_DESC,
        openGraph: {
            title: meta?.title ?? "Arcplus Asset Management Platform",
            description:
                meta?.description ??
                "Eight powerful modules for complete asset lifecycle management. Trusted by enterprises across Africa.",
            url: "/arcplus",
            ...(meta?.og_image ? { images: [{ url: meta.og_image }] } : {}),
        },
    };
}

export default async function ArcplusPage() {
    const [hero, cmsModules, pricingPlans, blocks, settings] = await Promise.all([
        fetchHeroSection("arcplus"),
        fetchArcplusModules(),
        fetchPricingPlans(),
        fetchPageBlocks("arcplus"),
        fetchSiteSettings(),
    ]);

    const currencyRates = settings?.currency_rates ?? null;

    return (
        <ArcplusPageClient
            hero={hero}
            cmsModules={cmsModules}
            cmsPricingPlans={pricingPlans}
            blocks={blocks}
            currencyRates={currencyRates}
        />
    );
}
