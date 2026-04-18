"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, X, Save, Star } from "lucide-react";
import { CMSStatusBadge } from "@/components/admin/CMSStatusBadge";
import { PublishingActions } from "@/components/admin/PublishingActions";
import type { AdminTestimonialData, TransitionRequest } from "@/types/cms";
import {
    useAdminTestimonials,
    useCreateTestimonial,
    useUpdateTestimonial,
    useDeleteTestimonial,
    useTransitionTestimonial,
} from "@/lib/hooks/useCMSAdmin";

const PLACEMENT_CHOICES = [
    { value: "homepage", label: "Homepage" },
    { value: "arcplus", label: "ARC+" },
    { value: "services", label: "Services" },
    { value: "global", label: "Global" },
];

type FormData = {
    quote: string;
    author_name: string;
    author_role: string;
    company_name: string;
    industry: string;
    rating: number;
    placement: string;
    order: number;
};

const EMPTY: FormData = {
    quote: "",
    author_name: "",
    author_role: "",
    company_name: "",
    industry: "",
    rating: 5,
    placement: "global",
    order: 0,
};

function TestimonialForm({
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
            <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Quote</label>
                <textarea value={form.quote} onChange={(e) => set("quote", e.target.value)} rows={3} className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">Author Name</label>
                    <input value={form.author_name} onChange={(e) => set("author_name", e.target.value)} className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500" />
                </div>
                <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">Role / Title</label>
                    <input value={form.author_role} onChange={(e) => set("author_role", e.target.value)} className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500" />
                </div>
                <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">Company</label>
                    <input value={form.company_name} onChange={(e) => set("company_name", e.target.value)} className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500" />
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">Industry</label>
                    <input value={form.industry} onChange={(e) => set("industry", e.target.value)} className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500" />
                </div>
                <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">Rating (1-5)</label>
                    <input type="number" min={1} max={5} value={form.rating} onChange={(e) => set("rating", parseInt(e.target.value) || 5)} className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500" />
                </div>
                <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">Placement</label>
                    <select value={form.placement} onChange={(e) => set("placement", e.target.value)} className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500">
                        {PLACEMENT_CHOICES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">Order</label>
                    <input type="number" value={form.order} onChange={(e) => set("order", parseInt(e.target.value) || 0)} className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500" />
                </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
                <button onClick={onCancel} className="text-xs px-4 py-2 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition-colors">Cancel</button>
                <button onClick={() => onSubmit(form)} disabled={isPending || !form.quote || !form.author_name || !form.company_name} className="inline-flex items-center gap-1.5 text-xs px-4 py-2 rounded-lg bg-primary-900 text-white hover:bg-primary-800 transition-colors disabled:opacity-50">
                    <Save className="w-3.5 h-3.5" />Save
                </button>
            </div>
        </div>
    );
}

export default function TestimonialsPage() {
    const [creating, setCreating] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
    const [statusFilter, setStatusFilter] = useState("all");

    const { data: testimonials = [], isLoading } = useAdminTestimonials();
    const createTest = useCreateTestimonial();
    const updateTest = useUpdateTestimonial();
    const deleteTest = useDeleteTestimonial();
    const transitionTest = useTransitionTestimonial();

    const filtered = statusFilter === "all" ? testimonials : testimonials.filter((t) => t.status === statusFilter);

    const handleCreate = (data: FormData) => {
        createTest.mutate(data as unknown as Record<string, unknown>, {
            onSuccess: () => setCreating(false),
        });
    };

    const handleUpdate = (id: number, data: FormData) => {
        const t = testimonials.find((x) => x.id === id);
        updateTest.mutate(
            { id, data: { ...data, version: t?.version } as unknown as Record<string, unknown> },
            { onSuccess: () => setEditingId(null) }
        );
    };

    return (
        <div>
            <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-primary-900 font-heading">Testimonials</h1>
                    <p className="text-sm text-neutral-500 mt-1">{testimonials.length} testimonial{testimonials.length !== 1 ? "s" : ""}</p>
                </div>
                <button
                    onClick={() => { setCreating(true); setEditingId(null); }}
                    className="inline-flex items-center gap-1.5 text-xs px-4 py-2 rounded-lg bg-primary-900 text-white hover:bg-primary-800 transition-colors"
                >
                    <Plus className="w-3.5 h-3.5" />New Testimonial
                </button>
            </div>

            <div className="flex flex-wrap gap-2 mb-5">
                {["all", "draft", "review", "approved", "published", "archived"].map((s) => (
                    <button
                        key={s}
                        onClick={() => setStatusFilter(s)}
                        className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${statusFilter === s
                            ? "bg-primary-900 text-white border-primary-900"
                            : "bg-white text-neutral-500 border-neutral-200 hover:border-neutral-400"}`}
                    >
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                ))}
            </div>

            {creating && (
                <div className="mb-5">
                    <TestimonialForm onSubmit={handleCreate} onCancel={() => setCreating(false)} isPending={createTest.isPending} />
                </div>
            )}

            {isLoading && <div className="flex items-center justify-center h-48 text-neutral-400 text-sm">Loading…</div>}

            {!isLoading && (
                <div className="space-y-3">
                    {filtered.map((t: AdminTestimonialData) =>
                        editingId === t.id ? (
                            <TestimonialForm
                                key={t.id}
                                initial={{
                                    quote: t.quote, author_name: t.author_name,
                                    author_role: t.author_role, company_name: t.company_name,
                                    industry: t.industry, rating: t.rating ?? 5,
                                    placement: t.placement, order: t.order,
                                }}
                                onSubmit={(d) => handleUpdate(t.id, d)}
                                onCancel={() => setEditingId(null)}
                                isPending={updateTest.isPending}
                            />
                        ) : (
                            <div key={t.id} className="bg-white rounded-xl border border-neutral-200 p-4 flex items-start justify-between gap-4">
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-semibold text-sm text-primary-900">{t.author_name}</span>
                                        <CMSStatusBadge status={t.status} />
                                        <span className="text-[10px] bg-neutral-100 px-1.5 py-0.5 rounded">{t.placement}</span>
                                    </div>
                                    <p className="text-xs text-neutral-600 mt-1 line-clamp-2 italic">&ldquo;{t.quote}&rdquo;</p>
                                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-neutral-400">
                                        <span>{t.author_role} at {t.company_name}</span>
                                        {t.rating != null && (
                                            <span className="flex items-center gap-0.5">
                                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />{t.rating}/5
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                    <PublishingActions
                                        status={t.status}
                                        version={t.version}
                                        onTransition={(data: TransitionRequest) => transitionTest.mutate({ id: t.id, data })}
                                        isPending={transitionTest.isPending}
                                    />
                                    <button onClick={() => { setEditingId(t.id); setCreating(false); }} className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-primary-700 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                                    {deleteConfirm === t.id ? (
                                        <div className="flex items-center gap-1 ml-1">
                                            <button onClick={() => deleteTest.mutate(t.id, { onSuccess: () => setDeleteConfirm(null) })} className="text-[10px] px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700">Confirm</button>
                                            <button onClick={() => setDeleteConfirm(null)} className="p-1 rounded hover:bg-neutral-100 text-neutral-400"><X className="w-3.5 h-3.5" /></button>
                                        </div>
                                    ) : (
                                        <button onClick={() => setDeleteConfirm(t.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-neutral-400 hover:text-red-600 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                                    )}
                                </div>
                            </div>
                        )
                    )}
                    {filtered.length === 0 && !creating && (
                        <div className="text-center py-12 text-neutral-400 text-sm">
                            {statusFilter === "all" ? "No testimonials yet." : `No ${statusFilter} testimonials.`}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
