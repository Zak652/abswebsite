import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ScannerDetailPageClient } from "./ScannerDetailPageClient";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const title = slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
  return {
    title: `${title} | RFID Scanners | ABS Platform`,
    description: `Technical specifications, features, and configuration options for the ${title} RFID scanner.`,
    openGraph: {
      title: `${title} | ABS Platform`,
      url: `/scanners/${slug}`,
    },
  };
}

export default async function ScannerDetailPage({ params }: Props) {
  const { slug } = await params;
  if (!slug) notFound();
  return <ScannerDetailPageClient slug={slug} />;
}
