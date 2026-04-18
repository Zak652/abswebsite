"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, X, Save } from "lucide-react";
import { CMSStatusBadge } from "@/components/admin/CMSStatusBadge";
import { PublishingActions } from "@/components/admin/PublishingActions";
import type {
    AdminArcplusModuleData,
    AdminPricingPlanData,
    TransitionRequest,
} from "@/types/cms";
import {
    useAdminModules,
    useCreateModule,
    useUpdateModule,
    useDeleteModule,
    useTransitionModule,
    useAdminPricingPlans,
    useCreatePricingPlan,
    useUpdatePricingPlan,
    useDeletePricingPlan,
    useTransitionPricingPlan,
} from "@/lib/hooks/useCMSAdmin";

/* ------------------------------------------------------------------ */
/* Module Form                                                        */
/* ------------------------------------------------------------------ */

type ModuleFormData = {
    name: string;
    slug: string;
    tagline: string;
    description: string;
    icon: string;
    order: number;
};

const EMPTY_MODULE: ModuleFormData = {
    name: "",
    slug: "",
    tagline: "",
    description: "",
    icon: "",
    order: 0,
};

function ModuleForm({
    initial,
    onSubmit,
    onCancel,
    isPending,
}: {
    initial?: Partial<ModuleFormData>;
    onSubmit: (data: ModuleFormData) => void;
    onCancel: () => void;
    isPending: boolean;
}) {
    const [form, setForm] = useState<ModuleFormData>({ ...EMPTY_MODULE, ...initial });
    const set = (key: keyof ModuleFormData, value: string | number) =>
        setForm((prev) => ({ ...prev, [key]: value }));

    return (
        <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">Name</label>
                    <input value={form.name} onChange={(e) => set("name", e.target.value)} className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500" />
                </div>
                <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">Slug</label>
                    <input value={form.slug} onChange={(e) => set("slug", e.target.value)} className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500" />
                </div>
                <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">Order</label>
                    <input type="number" value={form.order} onChange={(e) => set("order", parseInt(e.target.value) || 0)} className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500" />
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">Icon</label>
                    <input value={form.icon} onChange={(e) => set("icon", e.target.value)} className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500" />
                </div>
                <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">Tagline</label>
                    <input value={form.tagline} onChange={(e) => set("tagline", e.target.value)} className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500" />
                </div>
            </div>
            <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Description</label>
                <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500" />
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

/* ------------------------------------------------------------------ */
/* Pricing Plan Form                                                  */
/* ------------------------------------------------------------------ */

type PlanFormData = {
    name: string;
    slug: string;
    tagline: string;
    asset_range: string;
    price_usd: number;
    price_ugx: number;
    price_kes: number;
    billing_period: string;
    is_recommended: boolean;
    cta_text: string;
    cta_link: string;
    order: number;
};

const EMPTY_PLAN: PlanFormData = {
    name: "",
    slug: "",
    tagline: "",
    asset_range: "",
    price_usd: 0,
    price_ugx: 0,
    price_kes: 0,
    billing_period: "annual",
    is_recommended: false,
    cta_text: "",
    cta_link: "",
    order: 0,
};

function PlanForm({
    initial,
    onSubmit,
    onCancel,
    isPending,
}: {
    initial?: Partial<PlanFormData>;
    onSubmit: (data: PlanFormData) => void;
    onCancel: () => void;
    isPending: boolean;
}) {
    const [form, setForm] = useState<PlanFormData>({ ...EMPTY_PLAN, ...initial });
    const set = (key: keyof PlanFormData, value: string | number | boolean) =>
        setForm((prev) => ({ ...prev, [key]: value }));

    return (
        <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">Name</label>
                    <input value={form.name} onChange={(e) => set("name", e.target.value)} className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500" />
                </div>
                <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">Slug</label>
                    <input value={form.slug} onChange={(e) => set("slug", e.target.value)} className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500" />
                </div>
                <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">Order</label>
                    <input type="number" value={form.order} onChange={(e) => set("order", parseInt(e.target.value) || 0)} className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500" />
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">Tagline</label>
                    <input value={form.tagline} onChange={(e) => set("tagline", e.target.value)} className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500" />
                </div>
                <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">Asset Range</label>
                    <input value={form.asset_range} onChange={(e) => set("asset_range", e.target.value)} placeholder="1–500 assets" className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500" />
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">Price USD</label>
                    <input type="number" value={form.price_usd} onChange={(e) => set("price_usd", parseFloat(e.target.value) || 0)} className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500" />
                </div>
                <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">Price UGX</label>
                    <input type="number" value={form.price_ugx} onChange={(e) => set("price_ugx", parseFloat(e.target.value) || 0)} className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500" />
                </div>
                <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">Price KES</label>
                    <input type="number" value={form.price_kes} onChange={(e) => set("price_kes", parseFloat(e.target.value) || 0)} className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500" />
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">Billing Period</label>
                    <select value={form.billing_period} onChange={(e) => set("billing_period", e.target.value)} className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500">
                        <option value="annual">Annual</option>
                        <option value="monthly">Monthly</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">CTA Text</label>
                    <input value={form.cta_text} onChange={(e) => set("cta_text", e.target.value)} className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500" />
                </div>
                <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">CTA Link</label>
                    <input value={form.cta_link} onChange={(e) => set("cta_link", e.target.value)} className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500" />
                </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_recommended} onChange={(e) => set("is_recommended", e.target.checked)} className="rounded border-neutral-300" />
                <span className="text-xs font-medium text-neutral-700">Recommended</span>
            </label>
            <div className="flex justify-end gap-2 pt-2">
                <button onClick={onCancel} className="text-xs px-4 py-2 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition-colors">Cancel</button>
                <button onClick={() => onSubmit(form)} disabled={isPending || !form.name || !form.slug} className="inline-flex items-center gap-1.5 text-xs px-4 py-2 rounded-lg bg-primary-900 text-white hover:bg-primary-800 transition-colors disabled:opacity-50">
                    <Save className="w-3.5 h-3.5" />Save
                </button>
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Main Page                                                          */
/* ------------------------------------------------------------------ */

export default function ArcplusPage() {
    const [tab, setTab] = useState<"modules" | "plans">("modules");
    const [creating, setCreating] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

    const { data: modules = [], isLoading: modulesLoading } = useAdminModules();
    const createModule = useCreateModule();
    const updateModule = useUpdateModule();
    const deleteModule = useDeleteModule();
    const transitionModule = useTransitionModule();

    const { data: plans = [], isLoading: plansLoading } = useAdminPricingPlans();
    const createPlan = useCreatePricingPlan();
    const updatePlan = useUpdatePricingPlan();
    const deletePlan = useDeletePricingPlan();
    const transitionPlan = useTransitionPricingPlan();

    const isLoading = tab === "modules" ? modulesLoading : plansLoading;

    const handleCreateModule = (data: ModuleFormData) => {
        createModule.mutate(data as unknown as Record<string, unknown>, {
            onSuccess: () => setCreating(false),
        });
    };

    const handleUpdateModule = (id: number, data: ModuleFormData) => {
        const mod = modules.find((m) => m.id === id);
        updateModule.mutate(
            { id, data: { ...data, version: mod?.version } as unknown as Record<string, unknown> },
            { onSuccess: () => setEditingId(null) }
        );
    };

    const handleCreatePlan = (data: PlanFormData) => {
        createPlan.mutate(data as unknown as Record<string, unknown>, {
            onSuccess: () => setCreating(false),
        });
    };

    const handleUpdatePlan = (id: number, data: PlanFormData) => {
        const plan = plans.find((p) => p.id === id);
        updatePlan.mutate(
            { id, data: { ...data, version: plan?.version } as unknown as Record<string, unknown> },
            { onSuccess: () => setEditingId(null) }
        );
    };

    return (
        <div>
            <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-primary-900 font-heading">Arcplus</h1>
                    <p className="text-sm text-neutral-500 mt-1">Modules and pricing plans</p>
                </div>
                <button
                    onClick={() => { setCreating(true); setEditingId(null); }}
                    className="inline-flex items-center gap-1.5 text-xs px-4 py-2 rounded-lg bg-primary-900 text-white hover:bg-primary-800 transition-colors"
                >
                    <Plus className="w-3.5 h-3.5" />
                    New {tab === "modules" ? "Module" : "Plan"}
                </button>
            </div>

            <div className="flex gap-2 mb-5">
                {(["modules", "plans"] as const).map((t) => (
                    <button
                        key={t}
                        onClick={() => { setTab(t); setCreating(false); setEditingId(null); }}
                        className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${tab === t
                                ? "bg-primary-900 text-white border-primary-900"
                                : "bg-white text-neutral-500 border-neutral-200 hover:border-neutral-400"
                            }`}
                    >
                        {t === "modules" ? `Modules (${modules.length})` : `Pricing Plans (${plans.length})`}
                    </button>
                ))}
            </div>

            {creating && tab === "modules" && (
                <div className="mb-5">
                    <ModuleForm onSubmit={handleCreateModule} onCancel={() => setCreating(false)} isPending={createModule.isPending} />
                </div>
            )}
            {creating && tab === "plans" && (
                <div className="mb-5">
                    <PlanForm onSubmit={handleCreatePlan} onCancel={() => setCreating(false)} isPending={createPlan.isPending} />
                </div>
            )}

            {isLoading && (
                <div className="flex items-center justify-center h-48 text-neutral-400 text-sm">Loading…</div>
            )}

            {/* Modules */}
            {tab === "modules" && !isLoading && (
                <div className="space-y-3">
                    {modules.map((mod: AdminArcplusModuleData) =>
                        editingId === mod.id ? (
                            <ModuleForm
                                key={mod.id}
                                initial={{ name: mod.name, slug: mod.slug, tagline: mod.tagline, description: mod.description, icon: mod.icon, order: mod.order }}
                                onSubmit={(d) => handleUpdateModule(mod.id, d)}
                                onCancel={() => setEditingId(null)}
                                isPending={updateModule.isPending}
                            />
                        ) : (
                            <div key={mod.id} className="bg-white rounded-xl border border-neutral-200 p-5">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <CMSStatusBadge status={mod.status} />
                                            <span className="text-xs text-neutral-400">#{mod.order}</span>
                                        </div>
                                        <h3 className="font-semibold text-primary-900 text-sm">{mod.name}</h3>
                                        <p className="text-xs text-neutral-500 mt-0.5">{mod.tagline}</p>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <button onClick={() => { setEditingId(mod.id); setCreating(false); }} className="p-1.5 rounded-lg text-neutral-400 hover:text-primary-600 hover:bg-neutral-50 transition-colors">
                                            <Pencil className="w-3.5 h-3.5" />
                                        </button>
                                        {deleteConfirm === mod.id ? (
                                            <div className="flex items-center gap-1">
                                                <button onClick={() => { deleteModule.mutate(mod.id); setDeleteConfirm(null); }} className="text-[10px] px-2 py-1 rounded bg-red-500 text-white">Confirm</button>
                                                <button onClick={() => setDeleteConfirm(null)} className="p-1 rounded text-neutral-400 hover:text-neutral-600"><X className="w-3 h-3" /></button>
                                            </div>
                                        ) : (
                                            <button onClick={() => setDeleteConfirm(mod.id)} className="p-1.5 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="mt-3 pt-3 border-t border-neutral-100">
                                    <PublishingActions status={mod.status} version={mod.version} onTransition={(d) => transitionModule.mutate({ id: mod.id, data: d })} isPending={transitionModule.isPending} />
                                </div>
                            </div>
                        )
                    )}
                    {modules.length === 0 && <p className="text-center text-neutral-400 text-sm py-12">No modules yet.</p>}
                </div>
            )}

            {/* Plans */}
            {tab === "plans" && !isLoading && (
                <div className="space-y-3">
                    {plans.map((plan: AdminPricingPlanData) =>
                        editingId === plan.id ? (
                            <PlanForm
                                key={plan.id}
                                initial={{
                                    name: plan.name, slug: plan.slug, tagline: plan.tagline,
                                    asset_range: plan.asset_range, price_usd: plan.price_usd,
                                    price_ugx: plan.price_ugx, price_kes: plan.price_kes,
                                    billing_period: plan.billing_period, is_recommended: plan.is_recommended,
                                    cta_text: plan.cta_text, cta_link: plan.cta_link, order: plan.order,
                                }}
                                onSubmit={(d) => handleUpdatePlan(plan.id, d)}
                                onCancel={() => setEditingId(null)}
                                isPending={updatePlan.isPending}
                            />
                        ) : (
                            <div key={plan.id} className="bg-white rounded-xl border border-neutral-200 p-5">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <CMSStatusBadge status={plan.status} />
                                            {plan.is_recommended && (
                                                <span className="text-[10px] px-2 py-0.5 bg-accent-50 text-accent-600 rounded-full font-medium">
                                                    Recommended
                                                </span>
                                            )}
                                            <span className="text-xs text-neutral-400">#{plan.order}</span>
                                        </div>
                                        <h3 className="font-semibold text-primary-900 text-sm">{plan.name}</h3>
                                        <p className="text-xs text-neutral-500 mt-0.5">
                                            ${plan.price_usd}/yr — {plan.asset_range}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <button onClick={() => { setEditingId(plan.id); setCreating(false); }} className="p-1.5 rounded-lg text-neutral-400 hover:text-primary-600 hover:bg-neutral-50 transition-colors">
                                            <Pencil className="w-3.5 h-3.5" />
                                        </button>
                                        {deleteConfirm === plan.id ? (
                                            <div className="flex items-center gap-1">
                                                <button onClick={() => { deletePlan.mutate(plan.id); setDeleteConfirm(null); }} className="text-[10px] px-2 py-1 rounded bg-red-500 text-white">Confirm</button>
                                                <button onClick={() => setDeleteConfirm(null)} className="p-1 rounded text-neutral-400 hover:text-neutral-600"><X className="w-3 h-3" /></button>
                                            </div>
                                        ) : (
                                            <button onClick={() => setDeleteConfirm(plan.id)} className="p-1.5 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="mt-3 pt-3 border-t border-neutral-100">
                                    <PublishingActions status={plan.status} version={plan.version} onTransition={(d) => transitionPlan.mutate({ id: plan.id, data: d })} isPending={transitionPlan.isPending} />
                                </div>
                            </div>
                        )
                    )}
                    {plans.length === 0 && <p className="text-center text-neutral-400 text-sm py-12">No pricing plans yet.</p>}
                </div>
            )}
        </div>
    );
}
