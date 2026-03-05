"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useAdminProducts, useDeleteProduct } from "@/lib/hooks/useAdmin";
import type { Product } from "@/types/products";

const CATEGORY_LABELS: Record<string, string> = {
  scanners: "Scanners",
  tags: "Tags",
  software: "Software",
  accessories: "Accessories",
};

export default function AdminProductsPage() {
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>();
  const { data: products, isLoading } = useAdminProducts(
    categoryFilter ? { category: categoryFilter } : undefined
  );
  const deleteProduct = useDeleteProduct();

  const rows = products ?? [];

  const handleDelete = (product: Product) => {
    if (
      confirm(
        `Delete "${product.name}"? This cannot be undone.`
      )
    ) {
      deleteProduct.mutate(product.id);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primary-900 font-heading">Products</h1>
          <p className="text-sm text-neutral-500 mt-1">
            {rows.length} product{rows.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/admin-portal/products/new"
          className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-primary-900 text-white hover:bg-primary-800 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          New Product
        </Link>
      </div>

      {/* Category filter */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        {([undefined, "scanners", "tags", "software", "accessories"] as (
          | string
          | undefined
        )[]).map((cat) => (
          <button
            key={cat ?? "all"}
            onClick={() => setCategoryFilter(cat)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${categoryFilter === cat
                ? "bg-primary-900 text-white border-primary-900"
                : "bg-white text-neutral-500 border-neutral-200 hover:border-neutral-400"
              }`}
          >
            {cat ? CATEGORY_LABELS[cat] ?? cat : "All"}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-neutral-100 overflow-hidden animate-pulse bg-neutral-50 h-48" />
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-neutral-100 p-8 text-center">
          <p className="text-sm text-neutral-400 mb-3">No products found.</p>
          <Link
            href="/admin-portal/products/new"
            className="text-xs text-primary-500 hover:underline"
          >
            Create your first product →
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl border border-neutral-100 overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 border-b border-neutral-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  Slug
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  Flags
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {rows.map((product) => (
                <tr
                  key={product.id}
                  className="hover:bg-neutral-50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {product.image_hero ? (
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-neutral-100 shrink-0">
                          <Image
                            src={product.image_hero}
                            alt={product.name}
                            width={40}
                            height={40}
                            className="object-cover w-full h-full"
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-neutral-100 shrink-0" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-primary-900">
                          {product.name}
                        </p>
                        <p className="text-xs text-neutral-400 line-clamp-1">
                          {product.short_description}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-neutral-600 capitalize">
                      {product.category?.name ?? "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-neutral-400">
                      {product.slug}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5 flex-wrap">
                      {product.is_active && (
                        <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-green-100 text-green-700">
                          Active
                        </span>
                      )}
                      {product.is_configurable && (
                        <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-blue-100 text-blue-700">
                          Configurable
                        </span>
                      )}
                      {product.is_recommended && (
                        <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-amber-100 text-amber-700">
                          Recommended
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <Link
                        href={`/admin-portal/products/${product.id}`}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-primary-900 hover:bg-neutral-100 transition-colors"
                        aria-label={`Edit ${product.name}`}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        onClick={() => handleDelete(product)}
                        disabled={deleteProduct.isPending}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                        aria-label={`Delete ${product.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
