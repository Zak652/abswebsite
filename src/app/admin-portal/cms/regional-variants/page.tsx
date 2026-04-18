"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, X, Save, Globe } from "lucide-react";
import type { RegionalVariantData } from "@/types/cms";
import {
    useAdminRegionalVariants,
    useCreateRegionalVariant,
    useUpdateRegionalVariant,
    useDeleteRegionalVariant,
} from "@/lib/hooks/useCMSAdmin";

const REGION_CHOICES = [
    { value: "ug", label: "Uganda" },
    { value: "ke", label: "Kenya" },
    { value: "global", label: "Global" },
];

const LANGUAGE_CHOICES = [
    { value: "en", label: "English" },
    { value: "sw", label: "Swahili" },
];

type FormData = {
    content_type: string;
    object_id: string;
    region: string;
    language: string;
    title_override: string;
    body_override: string;
    cta_link_override: string;
    data_override: string;
};

const EMPTY: FormData = {
    content_type: "",
    object_id: "",
    region: "global",
    language: "en",
    title_override: "",
    body_override: "",
    cta_link_override: "",
    data_override: "{}",
};

function RegionalVariantForm({
    initial,
    onSubmit,
    onCancel,
    isPending,
}: {
    initial?: Partial<FormData>;
    onSubmit: (data: FormData) => void;
    onCancel: () => void;
    isPending: boolean;
}) {
    const [form, setForm] = useState<FormData>({ ...EMPTY, ...initial });
    const [jsonError, setJsonError] = useState(false);
    const set = (key: keyof FormData, value: string) =>
        setForm((prev) => ({ ...prev, [key]: value }));

    const handleJson = (val: string) => {
        set("data_override", val);
        try { JSON.parse(val); setJsonError(false); } catch { setJsonError(true); }
    };

    return (
        <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">Content Type ID</label>
                    <input value={form.content_type} onChange={(e) => set("content_type", e.target.value)} className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500" />
                </div>
                <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">Object ID</label>
                    <input value={form.object_id} onChange={(e) => set("object_id", e.target.value)} className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500" />
                </div>
                <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">Region</label>
                    <select value={form.region} onChange={(e) => set("region", e.target.value)} className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500">
                        {REGION_CHOICES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">Language</label>
                    <select value={form.language} onChange={(e) => set("language", e.target.value)} className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500">
                        {LANGUAGE_CHOICES.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
                    </select>
                </div>
            </div>
            <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Title Override</label>
                <input value={form.title_override} onChange={(e) => set("title_override", e.target.value)} className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500" />
            </div>
            <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Body Override</label>
                <textarea value={form.body_override} onChange={(e) => set("body_override", e.target.value)} rows={4} className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500" />
            </div>
            <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">CTA Link Override</label>
                <input value={form.cta_link_override} onChange={(e) => set("cta_link_override", e.target.value)} className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500" />
            </div>
            <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Data Override <span className="font-normal text-neutral-400">(JSON)</span></label>
                <textarea value={form.data_override} onChange={(e) => handleJson(e.target.value)} rows={3} className={`w-full text-sm border rounded-lg px-3 py-2 focus:outline-none font-mono ${jsonError ? "border-red-400" : "border-neutral-300"}`} />
                {jsonError && <p className="text-[10px] text-red-500 mt-1">Invalid JSON</p>}
            </div>
            <div className="flex justify-end gap-2 pt-2">
                <button onClick={onCancel} className="text-xs px-4 py-2 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition-colors">Cancel</button>
                <button onClick={() => onSubmit(form)} disabled={isPending || !form.content_type || !form.object_id || jsonError} className="inline-flex items-center gap-1.5 text-xs px-4 py-2 rounded-lg bg-primary-900 text-white hover:bg-primary-800 transition-colors disabled:opacity-50">
                    <Save className="w-3.5 h-3.5" />Save
                </button>
            </div>
        </div>
    );
}

function toPayload(data: FormData) {
    let data_override: Record<string, unknown> | null = null;
    try { data_override = JSON.parse(data.data_override); } catch { /* keep null */ }
    return {
        content_type: Number(data.content_type),
        object_id: data.object_id,
        region: data.region,
        language: data.language,
        title_override: data.title_override || "",
        body_override: data.body_override || "",
        cta_link_override: data.cta_link_override || "",
        data_override,
    };
}

export default function RegionalVariantsPage() {
    const [creating, setCreating] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

    const { data: variants = [], isLoading } = useAdminRegionalVariants();
    const createVar = useCreateRegionalVariant();
    const updateVar = useUpdateRegionalVariant();
    const deleteVar = useDeleteRegionalVariant();

    const regionLabel = (v: string) => REGION_CHOICES.find((r) => r.value === v)?.label ?? v;
    const langLabel = (v: string) => LANGUAGE_CHOICES.find((l) => l.value === v)?.label ?? v;

    const handleCreate = (data: FormData) => {
        createVar.mutate(toPayload(data) as unknown as Record<string, unknown>, {
            onSuccess: () => setCreating(false),
        });
    };

    const handleUpdate = (id: number, data: FormData) => {
        updateVar.mutate(
            { id, data: toPayload(data) as unknown as Record<string, unknown> },
            { onSuccess: () => setEditingId(null) }
        );
    };

    return (
        <div>
            <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-primary-900 font-heading">Regional Variants</h1>
                    <p className="text-sm text-neutral-500 mt-1">{variants.length} variant{variants.length !== 1 ? "s" : ""}</p>
                </div>
                <button
                    onClick={() => { setCreating(true); setEditingId(null); }}
                    className="inline-flex items-center gap-1.5 text-xs px-4 py-2 rounded-lg bg-primary-900 text-white hover:bg-primary-800 transition-colors"
                >
                    <Plus className="w-3.5 h-3.5" />New Variant
                </button>
            </div>

            {creating && (
                <div className="mb-5">
                    <RegionalVariantForm onSubmit={handleCreate} onCancel={() => setCreating(false)} isPending={createVar.isPending} />
                </div>
            )}

            {isLoading && <div className="flex items-center justify-center h-48 text-neutral-400 text-sm">Loading…</div>}

            {!isLoading && (
                <div className="space-y-3">
                    {variants.map((v: RegionalVariantData) =>
                        editingId === v.id ? (
                            <RegionalVariantForm
                                key={v.id}
                                initial={{
                                    content_type: v.content_type.toString(),
                                    object_id: v.object_id,
                                    region: v.region,
                                    language: v.language,
                                    title_override: v.title_override,
                                    body_override: v.body_override,
                                    cta_link_override: v.cta_link_override,
                                    data_override: JSON.stringify(v.data_override ?? {}, null, 2),
                                }}
                                onSubmit={(d) => handleUpdate(v.id, d)}
                                onCancel={() => setEditingId(null)}
                                isPending={updateVar.isPending}
                            />
                        ) : (
                            <div key={v.id} className="bg-white rounded-xl border border-neutral-200 p-4 flex items-start justify-between gap-4">
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <Globe className="w-4 h-4 text-neutral-400" />
                                        <span className="font-semibold text-sm text-primary-900">
                                            {v.title_override || `CT:${v.content_type} / Obj:${v.object_id}`}
                                        </span>
                                        <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">{regionLabel(v.region)}</span>
                                        <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded">{langLabel(v.language)}</span>
                                    </div>
                                    {v.body_override && <p className="text-xs text-neutral-500 mt-1 line-clamp-1">{v.body_override}</p>}
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                    <button onClick={() => { setEditingId(v.id); setCreating(false); }} className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-primary-700 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                                    {deleteConfirm === v.id ? (
                                        <div className="flex items-center gap-1 ml-1">
                                            <button onClick={() => deleteVar.mutate(v.id, { onSuccess: () => setDeleteConfirm(null) })} className="text-[10px] px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700">Confirm</button>
                                            <button onClick={() => setDeleteConfirm(null)} className="p-1 rounded hover:bg-neutral-100 text-neutral-400"><X className="w-3.5 h-3.5" /></button>
                                        </div>
                                    ) : (
                                        <button onClick={() => setDeleteConfirm(v.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-neutral-400 hover:text-red-600 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                                    )}
                                </div>
                            </div>
                        )
                    )}
                    {variants.length === 0 && !creating && (
                        <div className="text-center py-12 text-neutral-400 text-sm">No regional variants yet.</div>
                    )}
                </div>
            )}
        </div>
    );
}
