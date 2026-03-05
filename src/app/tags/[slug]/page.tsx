import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TagDetailPageClient } from "./TagDetailPageClient";

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
    title: `${title} | RFID Tags | ABS Platform`,
    description: `Technical specifications and use cases for the ${title} RFID tag.`,
    openGraph: {
      title: `${title} | ABS Platform`,
      url: `/tags/${slug}`,
    },
  };
}

export default async function TagDetailPage({ params }: Props) {
  const { slug } = await params;
  if (!slug) notFound();
  return <TagDetailPageClient slug={slug} />;
}
