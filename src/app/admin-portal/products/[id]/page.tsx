"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useAdminProducts } from "@/lib/hooks/useAdmin";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ProductForm } from "../_components/ProductForm";

export default function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: products, isLoading } = useAdminProducts();
  const product = products?.find((p) => p.id === id);

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin-portal/products"
          className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-primary-900 transition-colors mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Products
        </Link>
        <h1 className="text-2xl font-bold text-primary-900 font-heading">Edit Product</h1>
        {product && (
          <p className="text-sm text-neutral-500 mt-1">{product.name}</p>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      ) : !product ? (
        <div className="rounded-2xl border border-neutral-100 p-8 text-center">
          <p className="text-sm text-neutral-400">Product not found.</p>
          <Link
            href="/admin-portal/products"
            className="text-xs text-primary-500 hover:underline mt-2 block"
          >
            ← Back to products
          </Link>
        </div>
      ) : (
        <ProductForm initialData={product} productId={product.id} />
      )}
    </div>
  );
}
