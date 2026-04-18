"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, X, Save, Eye, EyeOff } from "lucide-react";
import type { PageMetaData } from "@/types/cms";
import {
    useAdminPageMetas,
    useCreatePageMeta,
    useUpdatePageMeta,
    useDeletePageMeta,
} from "@/lib/hooks/useCMSAdmin";

type MetaFormData = {
    route: string;
    title: string;
    description: string;
    og_image: string;
    canonical_url: string;
    is_indexed: boolean;
    structured_data: string; // JSON text
    hreflang_alternates: string; // JSON text
};

const EMPTY: MetaFormData = {
    route: "",
    title: "",
    description: "",
    og_image: "",
    canonical_url: "",
    is_indexed: true,
    structured_data: "{}",
    hreflang_alternates: "{}",
};

function MetaForm({
    initial,
    onSubmit,
    onCancel,
    isPending,
}: {
    initial?: Partial<MetaFormData>;
    onSubmit: (data: MetaFormData) => void;
    onCancel: () => void;
    isPending: boolean;
}) {
    const [form, setForm] = useState<MetaFormData>({ ...EMPTY, ...initial });
    const [sdError, setSdError] = useState(false);
    const [hlError, setHlError] = useState(false);

    const set = (key: keyof MetaFormData, value: string | boolean) =>
        setForm((prev) => ({ ...prev, [key]: value }));

    const handleJsonChange = (
        key: "structured_data" | "hreflang_alternates",
        errorSetter: (v: boolean) => void,
        value: string
    ) => {
        set(key, value);
        try {
            JSON.parse(value);
            errorSetter(false);
        } catch {
            errorSetter(true);
        }
    };

    const titleLen = form.title.length;
    const descLen = form.description.length;

    return (
        <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">Route</label>
                    <input value={form.route} onChange={(e) => set("route", e.target.value)} placeholder="/services" className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500" />
                </div>
                <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">Canonical URL</label>
                    <input value={form.canonical_url} onChange={(e) => set("canonical_url", e.target.value)} className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500" />
                </div>
            </div>
            <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Title <span className={`font-normal ${titleLen > 60 ? "text-red-500" : "text-neutral-400"}`}>({titleLen}/60)</span>
                </label>
                <input value={form.title} onChange={(e) => set("title", e.target.value)} className={`w-full text-sm border rounded-lg px-3 py-2 focus:outline-none ${titleLen > 60 ? "border-red-400 focus:border-red-500" : "border-neutral-300 focus:border-primary-500"}`} />
            </div>
            <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Description <span className={`font-normal ${descLen > 160 ? "text-red-500" : "text-neutral-400"}`}>({descLen}/160)</span>
                </label>
                <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={2} className={`w-full text-sm border rounded-lg px-3 py-2 focus:outline-none ${descLen > 160 ? "border-red-400 focus:border-red-500" : "border-neutral-300 focus:border-primary-500"}`} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">OG Image URL</label>
                    <input value={form.og_image} onChange={(e) => set("og_image", e.target.value)} className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500" />
                </div>
                <label className="flex items-center gap-2 cursor-pointer self-end pb-2">
                    <input type="checkbox" checked={form.is_indexed} onChange={(e) => set("is_indexed", e.target.checked)} className="rounded border-neutral-300" />
                    <span className="text-xs font-medium text-neutral-700">Allow indexing</span>
                </label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">Structured Data (JSON-LD)</label>
                    <textarea
                        value={form.structured_data}
                        onChange={(e) => handleJsonChange("structured_data", setSdError, e.target.value)}
                        rows={3}
                        className={`w-full text-sm border rounded-lg px-3 py-2 focus:outline-none font-mono ${sdError ? "border-red-400 focus:border-red-500" : "border-neutral-300 focus:border-primary-500"}`}
                    />
                    {sdError && <p className="text-[10px] text-red-500 mt-1">Invalid JSON</p>}
                </div>
                <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                        Hreflang Alternates <span className="font-normal text-neutral-400">{`{"en": "/en/page"}`}</span>
                    </label>
                    <textarea
                        value={form.hreflang_alternates}
                        onChange={(e) => handleJsonChange("hreflang_alternates", setHlError, e.target.value)}
                        rows={3}
                        className={`w-full text-sm border rounded-lg px-3 py-2 focus:outline-none font-mono ${hlError ? "border-red-400 focus:border-red-500" : "border-neutral-300 focus:border-primary-500"}`}
                    />
                    {hlError && <p className="text-[10px] text-red-500 mt-1">Invalid JSON</p>}
                </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
                <button onClick={onCancel} className="text-xs px-4 py-2 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition-colors">Cancel</button>
                <button
                    onClick={() => onSubmit(form)}
                    disabled={isPending || !form.route || !form.title || sdError || hlError}
                    className="inline-flex items-center gap-1.5 text-xs px-4 py-2 rounded-lg bg-primary-900 text-white hover:bg-primary-800 transition-colors disabled:opacity-50"
                >
                    <Save className="w-3.5 h-3.5" />Save
                </button>
            </div>
        </div>
    );
}

function toPayload(data: MetaFormData) {
    let structured_data: Record<string, unknown> = {};
    let hreflang_alternates: Record<string, string> = {};
    try { structured_data = JSON.parse(data.structured_data); } catch { /* keep empty */ }
    try { hreflang_alternates = JSON.parse(data.hreflang_alternates); } catch { /* keep empty */ }
    return {
        ...data,
        og_image: data.og_image || null,
        structured_data,
        hreflang_alternates,
    };
}

export default function SEOPage() {
    const [creating, setCreating] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

    const { data: metas = [], isLoading } = useAdminPageMetas();
    const createMeta = useCreatePageMeta();
    const updateMeta = useUpdatePageMeta();
    const deleteMeta = useDeletePageMeta();

    const handleCreate = (data: MetaFormData) => {
        createMeta.mutate(toPayload(data) as unknown as Parameters<typeof createMeta.mutate>[0], {
            onSuccess: () => setCreating(false),
        });
    };

    const handleUpdate = (id: number, data: MetaFormData) => {
        updateMeta.mutate(
            { id, data: toPayload(data) as unknown as Parameters<typeof updateMeta.mutate>[0]["data"] },
            { onSuccess: () => setEditingId(null) }
        );
    };

    return (
        <div>
            <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-primary-900 font-heading">SEO / Page Meta</h1>
                    <p className="text-sm text-neutral-500 mt-1">{metas.length} page{metas.length !== 1 ? "s" : ""} configured</p>
                </div>
                <button
                    onClick={() => { setCreating(true); setEditingId(null); }}
                    className="inline-flex items-center gap-1.5 text-xs px-4 py-2 rounded-lg bg-primary-900 text-white hover:bg-primary-800 transition-colors"
                >
                    <Plus className="w-3.5 h-3.5" />New Page Meta
                </button>
            </div>

            {creating && (
                <div className="mb-5">
                    <MetaForm onSubmit={handleCreate} onCancel={() => setCreating(false)} isPending={createMeta.isPending} />
                </div>
            )}

            {isLoading && (
                <div className="flex items-center justify-center h-48 text-neutral-400 text-sm">Loading…</div>
            )}

            {!isLoading && (
                <div className="space-y-3">
                    {metas.map((meta: PageMetaData) =>
                        editingId === meta.id ? (
                            <MetaForm
                                key={meta.id}
                                initial={{
                                    route: meta.route, title: meta.title, description: meta.description,
                                    og_image: meta.og_image || "", canonical_url: meta.canonical_url,
                                    is_indexed: meta.is_indexed,
                                    structured_data: JSON.stringify(meta.structured_data, null, 2),
                                    hreflang_alternates: JSON.stringify(meta.hreflang_alternates, null, 2),
                                }}
                                onSubmit={(d) => handleUpdate(meta.id, d)}
                                onCancel={() => setEditingId(null)}
                                isPending={updateMeta.isPending}
                            />
                        ) : (
                            <div key={meta.id} className="bg-white rounded-xl border border-neutral-200 p-5">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-mono bg-primary-50 text-primary-700 px-2 py-0.5 rounded">{meta.route}</span>
                                            {meta.is_indexed ? (
                                                <span className="inline-flex items-center gap-1 text-[10px] text-green-600"><Eye className="w-3 h-3" />Indexed</span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-[10px] text-neutral-400"><EyeOff className="w-3 h-3" />No-index</span>
                                            )}
                                        </div>
                                        <h3 className="font-semibold text-primary-900 text-sm">
                                            {meta.title}
                                            {meta.title.length > 60 && <span className="text-red-500 text-[10px] ml-1">({meta.title.length} chars)</span>}
                                        </h3>
                                        {meta.description && (
                                            <p className="text-xs text-neutral-500 mt-0.5 line-clamp-2">
                                                {meta.description}
                                                {meta.description.length > 160 && <span className="text-red-500 ml-1">({meta.description.length} chars)</span>}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <button onClick={() => { setEditingId(meta.id); setCreating(false); }} className="p-1.5 rounded-lg text-neutral-400 hover:text-primary-600 hover:bg-neutral-50 transition-colors">
                                            <Pencil className="w-3.5 h-3.5" />
                                        </button>
                                        {deleteConfirm === meta.id ? (
                                            <div className="flex items-center gap-1">
                                                <button onClick={() => { deleteMeta.mutate(meta.id); setDeleteConfirm(null); }} className="text-[10px] px-2 py-1 rounded bg-red-500 text-white">Confirm</button>
                                                <button onClick={() => setDeleteConfirm(null)} className="p-1 rounded text-neutral-400 hover:text-neutral-600"><X className="w-3 h-3" /></button>
                                            </div>
                                        ) : (
                                            <button onClick={() => setDeleteConfirm(meta.id)} className="p-1.5 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    )}
                    {metas.length === 0 && <p className="text-center text-neutral-400 text-sm py-12">No page meta entries yet.</p>}
                </div>
            )}
        </div>
    );
}
