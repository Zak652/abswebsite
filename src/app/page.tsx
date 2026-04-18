import type { Metadata } from "next";
import { HomePageClient } from "./HomePageClient";
import {
  fetchPageMeta,
  fetchHeroSection,
  fetchPageBlocks,
} from "@/lib/api/cms-server";

const DEFAULT_TITLE = "ABS Platform | Intelligent Asset Management Solutions";
const DEFAULT_DESC =
  "ABS delivers enterprise asset management infrastructure — Arcplus software, RFID hardware, and field services — for organizations that can't afford uncertainty.";

export async function generateMetadata(): Promise<Metadata> {
  const meta = await fetchPageMeta("/");
  return {
    title: meta?.title ?? DEFAULT_TITLE,
    description: meta?.description ?? DEFAULT_DESC,
    openGraph: {
      title: meta?.title ?? DEFAULT_TITLE,
      description: meta?.description ?? DEFAULT_DESC,
      url: "/",
      ...(meta?.og_image ? { images: [{ url: meta.og_image }] } : {}),
    },
  };
}

export default async function HomePage() {
  const [hero, blocks] = await Promise.all([
    fetchHeroSection("home"),
    fetchPageBlocks("home"),
  ]);

  return <HomePageClient hero={hero} blocks={blocks} />;
}
