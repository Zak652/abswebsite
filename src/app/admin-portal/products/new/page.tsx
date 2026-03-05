"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ProductForm } from "../_components/ProductForm";

export default function NewProductPage() {
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
        <h1 className="text-2xl font-bold text-primary-900 font-heading">New Product</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Add a new product to the catalogue
        </p>
      </div>

      <ProductForm />
    </div>
  );
}
