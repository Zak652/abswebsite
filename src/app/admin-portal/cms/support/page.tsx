"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, X, Save } from "lucide-react";
import { CMSStatusBadge } from "@/components/admin/CMSStatusBadge";
import { PublishingActions } from "@/components/admin/PublishingActions";
import type { AdminSupportTierData, TransitionRequest } from "@/types/cms";
import {
    useAdminSupportTiers,
    useCreateSupportTier,
    useUpdateSupportTier,
    useDeleteSupportTier,
    useTransitionSupportTier,
    useAdminSupportFeatures,
} from "@/lib/hooks/useCMSAdmin";

type TierFormData = {
    name: string;
    slug: string;
    plan: string;
    order: number;
};

const EMPTY: TierFormData = { name: "", slug: "", plan: "", order: 0 };

function TierForm({
    initial,
    onSubmit,
    onCancel,
    isPending,
}: {
    initial?: Partial<TierFormData>;
    onSubmit: (data: TierFormData) => void;
    onCancel: () => void;
    isPending: boolean;
}) {
    const [form, setForm] = useState<TierFormData>({ ...EMPTY, ...initial });
    const set = (key: keyof TierFormData, value: string | number) =>
        setForm((prev) => ({ ...prev, [key]: value }));

    return (
        <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">Name</label>
                    <input value={form.name} onChange={(e) => set("name", e.target.value)} className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500" />
                </div>
                <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">Slug</label>
                    <input value={form.slug} onChange={(e) => set("slug", e.target.value)} className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500" />
                </div>
                <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">Plan</label>
                    <input value={form.plan} onChange={(e) => set("plan", e.target.value)} placeholder="Starter, Growth, Enterprise…" className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500" />
                </div>
                <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">Order</label>
                    <input type="number" value={form.order} onChange={(e) => set("order", parseInt(e.target.value) || 0)} className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500" />
                </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
                <button onClick={onCancel} className="text-xs px-4 py-2 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition-colors">Cancel</button>
                <button onClick={() => onSubmit(form)} disabled={isPending || !form.name || !form.slug} className="inline-flex items-center gap-1.5 text-xs px-4 py-2 rounded-lg bg-primary-900 text-white hover:bg-primary-800 transition-colors disabled:opacity-50">
                    <Save className="w-3.5 h-3.5" />Save
                </button>
            </div>
        </div>
    );
}

export default function SupportPage() {
    const [creating, setCreating] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

    const { data: tiers = [], isLoading } = useAdminSupportTiers();
    const { data: features = [] } = useAdminSupportFeatures();
    const createTier = useCreateSupportTier();
    const updateTier = useUpdateSupportTier();
    const deleteTier = useDeleteSupportTier();
    const transitionTier = useTransitionSupportTier();

    const handleCreate = (data: TierFormData) => {
        createTier.mutate(data as unknown as Record<string, unknown>, {
            onSuccess: () => setCreating(false),
        });
    };

    const handleUpdate = (id: number, data: TierFormData) => {
        const tier = tiers.find((t) => t.id === id);
        updateTier.mutate(
            { id, data: { ...data, version: tier?.version } as unknown as Record<string, unknown> },
            { onSuccess: () => setEditingId(null) }
        );
    };

    const handleTransition = (id: number, data: TransitionRequest) => {
        transitionTier.mutate({ id, data });
    };

    return (
        <div>
            <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-primary-900 font-heading">Support Tiers</h1>
                    <p className="text-sm text-neutral-500 mt-1">
                        {tiers.length} tier{tiers.length !== 1 ? "s" : ""} · {features.length} feature{features.length !== 1 ? "s" : ""}
                    </p>
                </div>
                <button
                    onClick={() => { setCreating(true); setEditingId(null); }}
                    className="inline-flex items-center gap-1.5 text-xs px-4 py-2 rounded-lg bg-primary-900 text-white hover:bg-primary-800 transition-colors"
                >
                    <Plus className="w-3.5 h-3.5" />
                    New Tier
                </button>
            </div>

            {creating && (
                <div className="mb-5">
                    <TierForm onSubmit={handleCreate} onCancel={() => setCreating(false)} isPending={createTier.isPending} />
                </div>
            )}

            {isLoading && (
                <div className="flex items-center justify-center h-48 text-neutral-400 text-sm">Loading…</div>
            )}

            {!isLoading && (
                <div className="space-y-3">
                    {tiers.map((tier: AdminSupportTierData) =>
                        editingId === tier.id ? (
                            <TierForm
                                key={tier.id}
                                initial={{ name: tier.name, slug: tier.slug, plan: tier.plan, order: tier.order }}
                                onSubmit={(d) => handleUpdate(tier.id, d)}
                                onCancel={() => setEditingId(null)}
                                isPending={updateTier.isPending}
                            />
                        ) : (
                            <div key={tier.id} className="bg-white rounded-xl border border-neutral-200 p-5">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <CMSStatusBadge status={tier.status} />
                                            <span className="text-xs text-neutral-400">#{tier.order}</span>
                                        </div>
                                        <h3 className="font-semibold text-primary-900 text-sm">{tier.name}</h3>
                                        <p className="text-xs text-neutral-500 mt-0.5">Plan: {tier.plan}</p>
                                        {tier.feature_values.length > 0 && (
                                            <div className="mt-2 flex flex-wrap gap-1">
                                                {tier.feature_values.slice(0, 5).map((fv) => (
                                                    <span key={fv.feature} className="text-[10px] bg-neutral-50 text-neutral-500 px-2 py-0.5 rounded">
                                                        {fv.feature_name}: {fv.value}
                                                    </span>
                                                ))}
                                                {tier.feature_values.length > 5 && (
                                                    <span className="text-[10px] text-neutral-400">
                                                        +{tier.feature_values.length - 5} more
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <button onClick={() => { setEditingId(tier.id); setCreating(false); }} className="p-1.5 rounded-lg text-neutral-400 hover:text-primary-600 hover:bg-neutral-50 transition-colors">
                                            <Pencil className="w-3.5 h-3.5" />
                                        </button>
                                        {deleteConfirm === tier.id ? (
                                            <div className="flex items-center gap-1">
                                                <button onClick={() => { deleteTier.mutate(tier.id); setDeleteConfirm(null); }} className="text-[10px] px-2 py-1 rounded bg-red-500 text-white">Confirm</button>
                                                <button onClick={() => setDeleteConfirm(null)} className="p-1 rounded text-neutral-400 hover:text-neutral-600"><X className="w-3 h-3" /></button>
                                            </div>
                                        ) : (
                                            <button onClick={() => setDeleteConfirm(tier.id)} className="p-1.5 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="mt-3 pt-3 border-t border-neutral-100">
                                    <PublishingActions status={tier.status} version={tier.version} onTransition={(d) => handleTransition(tier.id, d)} isPending={transitionTier.isPending} />
                                </div>
                            </div>
                        )
                    )}
                    {tiers.length === 0 && <p className="text-center text-neutral-400 text-sm py-12">No support tiers yet.</p>}
                </div>
            )}
        </div>
    );
}
