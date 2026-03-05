"use client";

import { ProductDetailContent } from "@/components/products/ProductDetailContent";

interface Props {
  slug: string;
}

export function TagDetailPageClient({ slug }: Props) {
  return <ProductDetailContent slug={slug} />;
}
