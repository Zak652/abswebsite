"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, X, Save } from "lucide-react";
import { CMSStatusBadge } from "@/components/admin/CMSStatusBadge";
import { PublishingActions } from "@/components/admin/PublishingActions";
import type { TransitionRequest } from "@/types/cms";
import {
    useAdminServices,
    useCreateService,
    useUpdateService,
    useDeleteService,
    useTransitionService,
} from "@/lib/hooks/useCMSAdmin";
import type { AdminServiceOfferingData } from "@/types/cms";

type FormData = {
    title: string;
    slug: string;
    icon: string;
    short_description: string;
    problem: string;
    process: string;
    deliverables: string;
    result: string;
    order: number;
};

const EMPTY: FormData = {
    title: "",
    slug: "",
    icon: "",
    short_description: "",
    problem: "",
    process: "",
    deliverables: "",
    result: "",
    order: 0,
};

function ServiceForm({
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

    const set = (key: keyof FormData, value: string | number) =>
        setForm((prev) => ({ ...prev, [key]: value }));

    return (
        <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">Title</label>
                    <input
                        value={form.title}
                        onChange={(e) => set("title", e.target.value)}
                        className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500"
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">Slug</label>
                    <input
                        value={form.slug}
                        onChange={(e) => set("slug", e.target.value)}
                        className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500"
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">Order</label>
                    <input
                        type="number"
                        value={form.order}
                        onChange={(e) => set("order", parseInt(e.target.value) || 0)}
                        className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500"
                    />
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">Icon</label>
                    <input
                        value={form.icon}
                        onChange={(e) => set("icon", e.target.value)}
                        placeholder="lucide icon name"
                        className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500"
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">Short Description</label>
                    <input
                        value={form.short_description}
                        onChange={(e) => set("short_description", e.target.value)}
                        className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500"
                    />
                </div>
            </div>
            <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Problem</label>
                <textarea
                    value={form.problem}
                    onChange={(e) => set("problem", e.target.value)}
                    rows={2}
                    className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500"
                />
            </div>
            <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Process</label>
                <textarea
                    value={form.process}
                    onChange={(e) => set("process", e.target.value)}
                    rows={2}
                    className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500"
                />
            </div>
            <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Deliverables (comma-separated)
                </label>
                <input
                    value={form.deliverables}
                    onChange={(e) => set("deliverables", e.target.value)}
                    placeholder="Item 1, Item 2, Item 3"
                    className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500"
                />
            </div>
            <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Result</label>
                <textarea
                    value={form.result}
                    onChange={(e) => set("result", e.target.value)}
                    rows={2}
                    className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500"
                />
            </div>
            <div className="flex justify-end gap-2 pt-2">
                <button
                    onClick={onCancel}
                    className="text-xs px-4 py-2 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition-colors"
                >
                    Cancel
                </button>
                <button
                    onClick={() => onSubmit(form)}
                    disabled={isPending || !form.title || !form.slug}
                    className="inline-flex items-center gap-1.5 text-xs px-4 py-2 rounded-lg bg-primary-900 text-white hover:bg-primary-800 transition-colors disabled:opacity-50"
                >
                    <Save className="w-3.5 h-3.5" />
                    Save
                </button>
            </div>
        </div>
    );
}

export default function ServicesPage() {
    const [creating, setCreating] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
    const [statusFilter, setStatusFilter] = useState<string | undefined>();

    const { data: services = [], isLoading } = useAdminServices();
    const createService = useCreateService();
    const updateService = useUpdateService();
    const deleteService = useDeleteService();
    const transitionService = useTransitionService();

    const filtered = statusFilter
        ? services.filter((s) => s.status === statusFilter)
        : services;

    const toPayload = (data: FormData) => ({
        ...data,
        deliverables: data.deliverables.split(",").map((s) => s.trim()).filter(Boolean),
    });

    const handleCreate = (data: FormData) => {
        createService.mutate(toPayload(data) as unknown as Record<string, unknown>, {
            onSuccess: () => setCreating(false),
        });
    };

    const handleUpdate = (id: number, data: FormData) => {
        const svc = services.find((s) => s.id === id);
        updateService.mutate(
            { id, data: { ...toPayload(data), version: svc?.version } as unknown as Record<string, unknown> },
            { onSuccess: () => setEditingId(null) }
        );
    };

    const handleTransition = (id: number, data: TransitionRequest) => {
        transitionService.mutate({ id, data });
    };

    return (
        <div>
            <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-primary-900 font-heading">Services</h1>
                    <p className="text-sm text-neutral-500 mt-1">
                        {services.length} service offering{services.length !== 1 ? "s" : ""}
                    </p>
                </div>
                <button
                    onClick={() => { setCreating(true); setEditingId(null); }}
                    className="inline-flex items-center gap-1.5 text-xs px-4 py-2 rounded-lg bg-primary-900 text-white hover:bg-primary-800 transition-colors"
                >
                    <Plus className="w-3.5 h-3.5" />
                    New Service
                </button>
            </div>

            <div className="flex gap-2 mb-5 flex-wrap">
                {[undefined, "draft", "review", "approved", "published", "archived"].map((s) => (
                    <button
                        key={s ?? "all"}
                        onClick={() => setStatusFilter(s)}
                        className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${statusFilter === s
                                ? "bg-primary-900 text-white border-primary-900"
                                : "bg-white text-neutral-500 border-neutral-200 hover:border-neutral-400"
                            }`}
                    >
                        {s ? s.charAt(0).toUpperCase() + s.slice(1) : "All"}
                    </button>
                ))}
            </div>

            {creating && (
                <div className="mb-5">
                    <ServiceForm
                        onSubmit={handleCreate}
                        onCancel={() => setCreating(false)}
                        isPending={createService.isPending}
                    />
                </div>
            )}

            {isLoading && (
                <div className="flex items-center justify-center h-48 text-neutral-400 text-sm">Loading…</div>
            )}

            {!isLoading && (
                <div className="space-y-3">
                    {filtered.map((svc: AdminServiceOfferingData) =>
                        editingId === svc.id ? (
                            <ServiceForm
                                key={svc.id}
                                initial={{
                                    title: svc.title,
                                    slug: svc.slug,
                                    icon: svc.icon,
                                    short_description: svc.short_description,
                                    problem: svc.problem,
                                    process: svc.process,
                                    deliverables: svc.deliverables.join(", "),
                                    result: svc.result,
                                    order: svc.order,
                                }}
                                onSubmit={(data) => handleUpdate(svc.id, data)}
                                onCancel={() => setEditingId(null)}
                                isPending={updateService.isPending}
                            />
                        ) : (
                            <div key={svc.id} className="bg-white rounded-xl border border-neutral-200 p-5">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <CMSStatusBadge status={svc.status} />
                                            <span className="text-xs text-neutral-400">#{svc.order}</span>
                                        </div>
                                        <h3 className="font-semibold text-primary-900 text-sm">{svc.title}</h3>
                                        <p className="text-xs text-neutral-500 mt-0.5">{svc.short_description}</p>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <button
                                            onClick={() => { setEditingId(svc.id); setCreating(false); }}
                                            className="p-1.5 rounded-lg text-neutral-400 hover:text-primary-600 hover:bg-neutral-50 transition-colors"
                                        >
                                            <Pencil className="w-3.5 h-3.5" />
                                        </button>
                                        {deleteConfirm === svc.id ? (
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => { deleteService.mutate(svc.id); setDeleteConfirm(null); }}
                                                    className="text-[10px] px-2 py-1 rounded bg-red-500 text-white"
                                                >
                                                    Confirm
                                                </button>
                                                <button onClick={() => setDeleteConfirm(null)} className="p-1 rounded text-neutral-400 hover:text-neutral-600">
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setDeleteConfirm(svc.id)}
                                                className="p-1.5 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="mt-3 pt-3 border-t border-neutral-100">
                                    <PublishingActions
                                        status={svc.status}
                                        version={svc.version}
                                        onTransition={(data) => handleTransition(svc.id, data)}
                                        isPending={transitionService.isPending}
                                    />
                                </div>
                            </div>
                        )
                    )}
                    {filtered.length === 0 && (
                        <p className="text-center text-neutral-400 text-sm py-12">No services found.</p>
                    )}
                </div>
            )}
        </div>
    );
}
