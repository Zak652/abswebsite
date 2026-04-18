"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, X, Save, ArrowUp, ArrowDown, ImageIcon } from "lucide-react";
import type { ProductImageData } from "@/types/cms";
import {
    useProductGallery,
    useCreateProductImage,
    useUpdateProductImage,
    useDeleteProductImage,
    useReorderProductImages,
    useAdminMedia,
} from "@/lib/hooks/useCMSAdmin";

const IMAGE_TYPES: ProductImageData["image_type"][] = ["hero", "context", "detail", "workflow", "config"];

const TYPE_COLORS: Record<string, string> = {
    hero: "bg-purple-50 text-purple-700",
    context: "bg-blue-50 text-blue-700",
    detail: "bg-green-50 text-green-700",
    workflow: "bg-amber-50 text-amber-700",
    config: "bg-rose-50 text-rose-700",
};

type ImageFormData = {
    asset: string; // MediaAsset ID
    image_type: ProductImageData["image_type"];
    alt_text: string;
    caption: string;
    order: number;
    is_active: boolean;
};

const EMPTY: ImageFormData = {
    asset: "",
    image_type: "hero",
    alt_text: "",
    caption: "",
    order: 0,
    is_active: true,
};

function ImageForm({
    initial,
    onSubmit,
    onCancel,
    isPending,
}: {
    initial?: Partial<ImageFormData>;
    onSubmit: (data: ImageFormData) => void;
    onCancel: () => void;
    isPending: boolean;
}) {
    const [form, setForm] = useState<ImageFormData>({ ...EMPTY, ...initial });
    const { data: mediaAssets = [] } = useAdminMedia();
    const imageAssets = mediaAssets.filter((m) => m.asset_type.startsWith("image"));

    const set = (key: keyof ImageFormData, value: string | number | boolean) =>
        setForm((prev) => ({ ...prev, [key]: value }));

    return (
        <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">Image Type</label>
                    <select value={form.image_type} onChange={(e) => set("image_type", e.target.value)} className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500">
                        {IMAGE_TYPES.map((t) => (
                            <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">Media Asset</label>
                    <select value={form.asset} onChange={(e) => set("asset", e.target.value)} className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500">
                        <option value="">Select an image…</option>
                        {imageAssets.map((a) => (
                            <option key={a.id} value={a.id}>{a.filename}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">Order</label>
                    <input type="number" value={form.order} onChange={(e) => set("order", parseInt(e.target.value) || 0)} className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500" />
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">Alt Text</label>
                    <input value={form.alt_text} onChange={(e) => set("alt_text", e.target.value)} className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500" />
                </div>
                <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">Caption</label>
                    <input value={form.caption} onChange={(e) => set("caption", e.target.value)} className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500" />
                </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_active} onChange={(e) => set("is_active", e.target.checked)} className="rounded border-neutral-300" />
                <span className="text-xs font-medium text-neutral-700">Active</span>
            </label>
            <div className="flex justify-end gap-2 pt-2">
                <button onClick={onCancel} className="text-xs px-4 py-2 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition-colors">Cancel</button>
                <button onClick={() => onSubmit(form)} disabled={isPending || !form.asset} className="inline-flex items-center gap-1.5 text-xs px-4 py-2 rounded-lg bg-primary-900 text-white hover:bg-primary-800 transition-colors disabled:opacity-50">
                    <Save className="w-3.5 h-3.5" />Save
                </button>
            </div>
        </div>
    );
}

export default function GalleriesPage() {
    const [productId, setProductId] = useState("");
    const [creating, setCreating] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
    const [typeFilter, setTypeFilter] = useState<string>("all");

    const { data: images = [], isLoading } = useProductGallery(productId);
    const createImage = useCreateProductImage(productId);
    const updateImage = useUpdateProductImage(productId);
    const deleteImage = useDeleteProductImage(productId);
    const reorderImages = useReorderProductImages(productId);

    const filtered = typeFilter === "all" ? images : images.filter((i) => i.image_type === typeFilter);

    const handleCreate = (data: ImageFormData) => {
        createImage.mutate(data as unknown as Record<string, unknown>, {
            onSuccess: () => setCreating(false),
        });
    };

    const handleUpdate = (id: number, data: ImageFormData) => {
        updateImage.mutate(
            { imageId: id, data: data as unknown as Record<string, unknown> },
            { onSuccess: () => setEditingId(null) }
        );
    };

    const handleReorder = (id: number, direction: "up" | "down") => {
        const idx = filtered.findIndex((i) => i.id === id);
        if (idx < 0) return;
        const swapIdx = direction === "up" ? idx - 1 : idx + 1;
        if (swapIdx < 0 || swapIdx >= filtered.length) return;
        const items = filtered.map((img, i) => ({
            id: img.id,
            order: i === idx ? filtered[swapIdx].order : i === swapIdx ? filtered[idx].order : img.order,
        }));
        reorderImages.mutate(items);
    };

    return (
        <div>
            <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-primary-900 font-heading">Product Galleries</h1>
                    <p className="text-sm text-neutral-500 mt-1">5-layer visual system per product</p>
                </div>
                {productId && (
                    <button
                        onClick={() => { setCreating(true); setEditingId(null); }}
                        className="inline-flex items-center gap-1.5 text-xs px-4 py-2 rounded-lg bg-primary-900 text-white hover:bg-primary-800 transition-colors"
                    >
                        <Plus className="w-3.5 h-3.5" />Add Image
                    </button>
                )}
            </div>

            {/* Product ID input */}
            <div className="mb-5">
                <label className="block text-xs font-medium text-neutral-700 mb-1">Product ID</label>
                <input
                    value={productId}
                    onChange={(e) => { setProductId(e.target.value); setCreating(false); setEditingId(null); }}
                    placeholder="Enter product UUID…"
                    className="max-w-md text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500"
                />
            </div>

            {productId && (
                <>
                    {/* Type filter */}
                    <div className="flex flex-wrap gap-2 mb-5">
                        <button
                            onClick={() => setTypeFilter("all")}
                            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${typeFilter === "all" ? "bg-primary-900 text-white border-primary-900" : "bg-white text-neutral-500 border-neutral-200 hover:border-neutral-400"
                                }`}
                        >
                            All ({images.length})
                        </button>
                        {IMAGE_TYPES.map((t) => {
                            const count = images.filter((i) => i.image_type === t).length;
                            return (
                                <button
                                    key={t}
                                    onClick={() => setTypeFilter(t)}
                                    className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${typeFilter === t ? "bg-primary-900 text-white border-primary-900" : "bg-white text-neutral-500 border-neutral-200 hover:border-neutral-400"
                                        }`}
                                >
                                    {t.charAt(0).toUpperCase() + t.slice(1)} ({count})
                                </button>
                            );
                        })}
                    </div>

                    {creating && (
                        <div className="mb-5">
                            <ImageForm onSubmit={handleCreate} onCancel={() => setCreating(false)} isPending={createImage.isPending} />
                        </div>
                    )}

                    {isLoading && (
                        <div className="flex items-center justify-center h-48 text-neutral-400 text-sm">Loading…</div>
                    )}

                    {!isLoading && (
                        <div className="space-y-3">
                            {filtered.map((img) =>
                                editingId === img.id ? (
                                    <ImageForm
                                        key={img.id}
                                        initial={{
                                            asset: typeof img.asset === "object" ? (img.asset as { id: string }).id : String(img.asset),
                                            image_type: img.image_type,
                                            alt_text: img.alt_text,
                                            caption: img.caption,
                                            order: img.order,
                                            is_active: img.is_active,
                                        }}
                                        onSubmit={(d) => handleUpdate(img.id, d)}
                                        onCancel={() => setEditingId(null)}
                                        isPending={updateImage.isPending}
                                    />
                                ) : (
                                    <div key={img.id} className="bg-white rounded-xl border border-neutral-200 p-4 flex items-center gap-4">
                                        {/* Thumbnail */}
                                        <div className="w-16 h-16 rounded-lg bg-neutral-50 border border-neutral-100 flex items-center justify-center overflow-hidden shrink-0">
                                            {img.asset && typeof img.asset === "object" && (img.asset as { file_thumbnail?: string }).file_thumbnail ? (
                                                <img src={(img.asset as { file_thumbnail: string }).file_thumbnail} alt={img.alt_text} className="w-full h-full object-cover" />
                                            ) : (
                                                <ImageIcon className="w-6 h-6 text-neutral-300" />
                                            )}
                                        </div>
                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${TYPE_COLORS[img.image_type] ?? "bg-neutral-50 text-neutral-600"}`}>
                                                    {img.image_type}
                                                </span>
                                                <span className="text-xs text-neutral-400">#{img.order}</span>
                                                {!img.is_active && <span className="text-[10px] text-red-500">Inactive</span>}
                                            </div>
                                            <p className="text-sm text-primary-900 truncate">{img.alt_text || "No alt text"}</p>
                                            {img.caption && <p className="text-xs text-neutral-400 truncate">{img.caption}</p>}
                                        </div>
                                        {/* Actions */}
                                        <div className="flex items-center gap-1 shrink-0">
                                            <button onClick={() => handleReorder(img.id, "up")} className="p-1 rounded text-neutral-400 hover:text-neutral-600"><ArrowUp className="w-3.5 h-3.5" /></button>
                                            <button onClick={() => handleReorder(img.id, "down")} className="p-1 rounded text-neutral-400 hover:text-neutral-600"><ArrowDown className="w-3.5 h-3.5" /></button>
                                            <button onClick={() => { setEditingId(img.id); setCreating(false); }} className="p-1.5 rounded-lg text-neutral-400 hover:text-primary-600 hover:bg-neutral-50">
                                                <Pencil className="w-3.5 h-3.5" />
                                            </button>
                                            {deleteConfirm === img.id ? (
                                                <div className="flex items-center gap-1">
                                                    <button onClick={() => { deleteImage.mutate(img.id); setDeleteConfirm(null); }} className="text-[10px] px-2 py-1 rounded bg-red-500 text-white">Confirm</button>
                                                    <button onClick={() => setDeleteConfirm(null)} className="p-1 rounded text-neutral-400 hover:text-neutral-600"><X className="w-3 h-3" /></button>
                                                </div>
                                            ) : (
                                                <button onClick={() => setDeleteConfirm(img.id)} className="p-1.5 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )
                            )}
                            {filtered.length === 0 && <p className="text-center text-neutral-400 text-sm py-12">No images for this product{typeFilter !== "all" ? ` (${typeFilter})` : ""}.</p>}
                        </div>
                    )}
                </>
            )}

            {!productId && (
                <p className="text-center text-neutral-400 text-sm py-12">Enter a product ID above to manage its gallery.</p>
            )}
        </div>
    );
}
