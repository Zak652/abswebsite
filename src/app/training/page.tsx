import type { Metadata } from "next";
import { TrainingPageClient } from "./TrainingPageClient";
import { fetchPageMeta, fetchSiteSettings } from "@/lib/api/cms-server";

const DEFAULT_TITLE = "Training Academy | ABS Platform";
const DEFAULT_DESC =
    "Get certified in Arcplus asset management and RFID deployment. Live virtual and in-person sessions led by ABS-certified instructors.";

export async function generateMetadata(): Promise<Metadata> {
    const meta = await fetchPageMeta("/training");
    return {
        title: meta?.title ?? DEFAULT_TITLE,
        description: meta?.description ?? DEFAULT_DESC,
        openGraph: {
            title: meta?.title ?? DEFAULT_TITLE,
            description: meta?.description ?? DEFAULT_DESC,
            url: "/training",
        },
    };
}

export default async function TrainingPage() {
    const settings = await fetchSiteSettings();
    const currencyRates = settings?.currency_rates ?? null;
    return <TrainingPageClient currencyRates={currencyRates} />;
}
