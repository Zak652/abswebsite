import type { Metadata } from "next";
import { ComparePageClient } from "./ComparePageClient";
import { fetchPageMeta, fetchPricingPlans } from "@/lib/api/cms-server";

const DEFAULT_TITLE = "Compare Solutions | ABS Platform";
const DEFAULT_DESC =
    "Compare ABS asset management solutions across software, hardware, and services to find the right fit for your organization.";

export async function generateMetadata(): Promise<Metadata> {
    const meta = await fetchPageMeta("/compare");
    return {
        title: meta?.title ?? DEFAULT_TITLE,
        description: meta?.description ?? DEFAULT_DESC,
        openGraph: {
            title: meta?.title ?? DEFAULT_TITLE,
            description: meta?.description ?? DEFAULT_DESC,
            url: "/compare",
        },
    };
}

export default async function ComparePage() {
    const cmsPricingPlans = await fetchPricingPlans();
    return <ComparePageClient cmsPricingPlans={cmsPricingPlans} />;
}
