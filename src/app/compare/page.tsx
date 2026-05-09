import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { fetchPageMeta, fetchPricingPlans } from "@/lib/api/cms-server";

// Heavy interactive client — lazy-load so the comparison chunk
// doesn't ship to every page (§ 3.3).
const ComparePageClient = dynamic(
    () => import("./ComparePageClient").then((m) => m.ComparePageClient),
    {
        loading: () => (
            <div className="min-h-screen bg-surface flex items-center justify-center">
                <div className="text-sm text-neutral-500">Loading comparison…</div>
            </div>
        ),
    },
);

const DEFAULT_TITLE = "Compare Solutions | ABS Platform";
const DEFAULT_DESC =
    "Compare ABS asset management solutions across software, hardware, and services to find the right fit for your organization.";

export async function generateMetadata(): Promise<Metadata> {
    const meta = await fetchPageMeta("/compare");
    return {
        title: meta?.title ?? DEFAULT_TITLE,
        description: meta?.description ?? DEFAULT_DESC,
        alternates: { canonical: "/compare" },
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
