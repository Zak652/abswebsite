import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { fetchProductBySlug } from "@/lib/api/products-server";
import { buildProductLd } from "@/lib/seo";
import { ScannerDetailPageClient } from "./ScannerDetailPageClient";

interface Props {
  params: Promise<{ slug: string }>;
}

function titleFromSlug(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await fetchProductBySlug(slug);
  const title = product?.name ?? titleFromSlug(slug);
  const description =
    product?.short_description ??
    `Technical specifications, features, and configuration options for the ${title} RFID scanner.`;
  const canonical = `/scanners/${slug}`;
  return {
    title: `${title} | RFID Scanners | ABS Platform`,
    description,
    alternates: { canonical },
    openGraph: {
      title: `${title} | ABS Platform`,
      description,
      url: canonical,
      images: product?.image_hero
        ? [{ url: product.image_hero, alt: product.name }]
        : undefined,
    },
  };
}

export default async function ScannerDetailPage({ params }: Props) {
  const { slug } = await params;
  if (!slug) notFound();

  const product = await fetchProductBySlug(slug);

  return (
    <>
      {product && (
        <JsonLd
          id="ld-product"
          data={buildProductLd({
            name: product.name,
            slug: product.slug,
            description: product.short_description || product.full_description,
            images: [
              product.image_hero,
              product.image_context,
              product.image_detail,
              product.image_usecase,
            ].filter((s): s is string => Boolean(s)),
            category: "scanner",
          })}
        />
      )}
      <ScannerDetailPageClient slug={slug} />
    </>
  );
}
