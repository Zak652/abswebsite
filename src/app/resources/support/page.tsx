import type { Metadata } from "next";
import { SupportPageClient } from "./SupportPageClient";
import { fetchPageMeta, fetchSupportTiers } from "@/lib/api/cms-server";

const DEFAULT_TITLE = "Support | ABS Platform";
const DEFAULT_DESC = "Get help with the ABS Platform. View support tiers, contact our team, or send us a message.";

export async function generateMetadata(): Promise<Metadata> {
  const meta = await fetchPageMeta("/resources/support");
  return {
    title: meta?.title ?? DEFAULT_TITLE,
    description: meta?.description ?? DEFAULT_DESC,
  };
}

export default async function SupportPage() {
  const cmsTiers = await fetchSupportTiers();
  return <SupportPageClient cmsTiers={cmsTiers} />;
}
