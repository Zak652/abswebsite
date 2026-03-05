import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ServiceDetailPageClient } from "./ServiceDetailPageClient";
import type { ServiceType } from "@/types/services";

const SERVICE_META: Record<
  string,
  { title: string; description: string; serviceType: ServiceType }
> = {
  "asset-register": {
    title: "Asset Register Build | ABS Services",
    description:
      "Our field teams tag, locate, and catalogue your entire fixed asset network — delivering a verified digital register.",
    serviceType: "asset_register",
  },
  verification: {
    title: "Asset Verification | ABS Services",
    description:
      "Physical verification and reconciliation of your asset register against what's actually on the ground.",
    serviceType: "verification",
  },
  disposal: {
    title: "Asset Disposal | ABS Services",
    description:
      "Secure, compliant decommissioning and disposal of end-of-life assets with full audit trail.",
    serviceType: "disposal",
  },
  training: {
    title: "Training Programs | ABS Services",
    description:
      "On-site and virtual Arcplus training for your teams — from basic users to system administrators.",
    serviceType: "training_outsource",
  },
  outsourcing: {
    title: "Full Asset Management Outsource | ABS Services",
    description:
      "Hand over your entire physical asset management function to ABS field engineers and analysts.",
    serviceType: "full_outsource",
  },
};

export async function generateStaticParams() {
  return Object.keys(SERVICE_META).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const meta = SERVICE_META[slug];
  if (!meta) return { title: "Service Not Found | ABS" };
  return {
    title: meta.title,
    description: meta.description,
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: `/services/${slug}`,
    },
  };
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const meta = SERVICE_META[slug];
  if (!meta) notFound();
  return <ServiceDetailPageClient slug={slug} serviceType={meta.serviceType} />;
}
