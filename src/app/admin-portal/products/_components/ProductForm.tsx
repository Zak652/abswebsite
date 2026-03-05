"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { useCreateProduct, useUpdateAdminProduct } from "@/lib/hooks/useAdmin";
import type { Product } from "@/types/products";

type SpecEntry = { key: string; value: string };

interface ProductFormProps {
  initialData?: Partial<Product>;
  productId?: string;
}

export function ProductForm({ initialData, productId }: ProductFormProps) {
  const router = useRouter();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateAdminProduct();

  const isEdit = Boolean(productId);
  const isPending = createProduct.isPending || updateProduct.isPending;

  const [name, setName] = useState(initialData?.name ?? "");
  const [slug, setSlug] = useState(initialData?.slug ?? "");
  const [shortDescription, setShortDescription] = useState(
    initialData?.short_description ?? ""
  );
  const [fullDescription, setFullDescription] = useState(
    initialData?.full_description ?? ""
  );
  const [imageHero, setImageHero] = useState(initialData?.image_hero ?? "");
  const [imageContext, setImageContext] = useState(initialData?.image_context ?? "");
  const [imageDetail, setImageDetail] = useState(initialData?.image_detail ?? "");
  const [imageUsecase, setImageUsecase] = useState(initialData?.image_usecase ?? "");
  const [datasheetUrl, setDatasheetUrl] = useState(initialData?.datasheet_url ?? "");
  const [isConfigurable, setIsConfigurable] = useState(
    initialData?.is_configurable ?? false
  );
  const [isRecommended, setIsRecommended] = useState(
    initialData?.is_recommended ?? false
  );
  const [isActive, setIsActive] = useState(initialData?.is_active ?? true);
  const [order, setOrder] = useState(String(initialData?.order ?? 0));

  // Specs as key-value pairs
  const initSpecs = initialData?.specifications
    ? Object.entries(initialData.specifications).map(([key, value]) => ({ key, value }))
    : [];
  const [specs, setSpecs] = useState<SpecEntry[]>(
    initSpecs.length > 0 ? initSpecs : [{ key: "", value: "" }]
  );

  const addSpec = () => setSpecs([...specs, { key: "", value: "" }]);
  const removeSpec = (i: number) => setSpecs(specs.filter((_, idx) => idx !== i));
  const updateSpec = (i: number, field: "key" | "value", val: string) => {
    setSpecs(specs.map((s, idx) => (idx === i ? { ...s, [field]: val } : s)));
  };

  const buildPayload = () => {
    const specifications: Record<string, string> = {};
    specs.forEach(({ key, value }) => {
      if (key.trim()) specifications[key.trim()] = value;
    });
    return {
      name,
      slug,
      short_description: shortDescription,
      full_description: fullDescription,
      image_hero: imageHero,
      image_context: imageContext,
      image_detail: imageDetail,
      image_usecase: imageUsecase,
      datasheet_url: datasheetUrl,
      is_configurable: isConfigurable,
      is_recommended: isRecommended,
      is_active: isActive,
      order: parseInt(order, 10) || 0,
      specifications,
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = buildPayload();
    if (isEdit && productId) {
      updateProduct.mutate(
        { id: productId, data: payload },
        { onSuccess: () => router.push("/admin-portal/products") }
      );
    } else {
      createProduct.mutate(payload, {
        onSuccess: () => router.push("/admin-portal/products"),
      });
    }
  };

  const inputCls =
    "w-full text-sm border border-neutral-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500";
  const labelCls = "block text-xs font-medium text-neutral-700 mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-3xl">
      {/* Basic Info */}
      <section>
        <h2 className="text-sm font-semibold text-primary-900 mb-4 pb-2 border-b border-neutral-100">
          Basic Information
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className={labelCls}>Product Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputCls}
              placeholder="e.g. Zebra DS9308"
            />
          </div>
          <div>
            <label className={labelCls}>Slug *</label>
            <input
              type="text"
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className={inputCls}
              placeholder="e.g. zebra-ds9308"
            />
          </div>
          <div>
            <label className={labelCls}>Display Order</label>
            <input
              type="number"
              value={order}
              onChange={(e) => setOrder(e.target.value)}
              className={inputCls}
              min={0}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Short Description</label>
            <input
              type="text"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              className={inputCls}
              placeholder="One-line description"
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Full Description</label>
            <textarea
              value={fullDescription}
              onChange={(e) => setFullDescription(e.target.value)}
              rows={4}
              className={`${inputCls} resize-none`}
              placeholder="Detailed product description"
            />
          </div>
        </div>
      </section>

      {/* Images */}
      <section>
        <h2 className="text-sm font-semibold text-primary-900 mb-4 pb-2 border-b border-neutral-100">
          Image URLs
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: "Hero Image", value: imageHero, setter: setImageHero },
            { label: "Context Image", value: imageContext, setter: setImageContext },
            { label: "Detail Image", value: imageDetail, setter: setImageDetail },
            { label: "Use Case Image", value: imageUsecase, setter: setImageUsecase },
          ].map(({ label, value, setter }) => (
            <div key={label}>
              <label className={labelCls}>{label}</label>
              <input
                type="url"
                value={value}
                onChange={(e) => setter(e.target.value)}
                className={inputCls}
                placeholder="https://…"
              />
            </div>
          ))}
          <div className="sm:col-span-2">
            <label className={labelCls}>Datasheet URL</label>
            <input
              type="url"
              value={datasheetUrl}
              onChange={(e) => setDatasheetUrl(e.target.value)}
              className={inputCls}
              placeholder="https://…"
            />
          </div>
        </div>
      </section>

      {/* Specifications */}
      <section>
        <h2 className="text-sm font-semibold text-primary-900 mb-4 pb-2 border-b border-neutral-100">
          Technical Specifications
        </h2>
        <div className="space-y-2.5">
          {specs.map((spec, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="text"
                value={spec.key}
                onChange={(e) => updateSpec(i, "key", e.target.value)}
                placeholder="Field name (e.g. Read Range)"
                className="flex-1 text-sm border border-neutral-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <input
                type="text"
                value={spec.value}
                onChange={(e) => updateSpec(i, "value", e.target.value)}
                placeholder="Value (e.g. 0–30 cm)"
                className="flex-1 text-sm border border-neutral-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <button
                type="button"
                onClick={() => removeSpec(i)}
                disabled={specs.length === 1}
                className="p-2 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-30"
                aria-label="Remove spec"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addSpec}
            className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-primary-900 transition-colors mt-1"
          >
            <Plus className="w-3.5 h-3.5" />
            Add specification
          </button>
        </div>
      </section>

      {/* Flags */}
      <section>
        <h2 className="text-sm font-semibold text-primary-900 mb-4 pb-2 border-b border-neutral-100">
          Flags
        </h2>
        <div className="space-y-3">
          {[
            {
              label: "Active (visible on site)",
              checked: isActive,
              setter: setIsActive,
            },
            {
              label: "Configurable (shows in Configurator)",
              checked: isConfigurable,
              setter: setIsConfigurable,
            },
            {
              label: "Recommended (highlighted)",
              checked: isRecommended,
              setter: setIsRecommended,
            },
          ].map(({ label, checked, setter }) => (
            <label key={label} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => setter(e.target.checked)}
                className="w-4 h-4 rounded border-neutral-300 text-primary-900 focus:ring-primary-500"
              />
              <span className="text-sm text-primary-900">{label}</span>
            </label>
          ))}
        </div>
      </section>

      {/* Submit */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="px-5 py-2.5 bg-primary-900 text-white text-sm font-medium rounded-lg hover:bg-primary-800 transition-colors disabled:opacity-50"
        >
          {isPending ? "Saving…" : isEdit ? "Save Changes" : "Create Product"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin-portal/products")}
          className="px-5 py-2.5 bg-white text-neutral-600 text-sm font-medium rounded-lg border border-neutral-200 hover:border-neutral-400 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
