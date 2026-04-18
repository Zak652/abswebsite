"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, X, Save } from "lucide-react";
import { CMSStatusBadge } from "@/components/admin/CMSStatusBadge";
import { PublishingActions } from "@/components/admin/PublishingActions";
import type { AdminCaseStudyData, TransitionRequest } from "@/types/cms";
import {
    useAdminCaseStudies,
    useCreateCaseStudy,
    useUpdateCaseStudy,
    useDeleteCaseStudy,
    useTransitionCaseStudy,
} from "@/lib/hooks/useCMSAdmin";

type CaseStudyFormData = {
    title: string;
    slug: string;
    client_name: string;
    industry: string;
    country: string;
    challenge: string;
    solution: string;
    results: string; // JSON text
    quote: string;
    quote_author: string;
    quote_role: string;
    order: number;
};

const EMPTY: CaseStudyFormData = {
    title: "",
    slug: "",
    client_name: "",
    industry: "",
    country: "",
    challenge: "",
    solution: "",
    results: "[]",
    quote: "",
    quote_author: "",
    quote_role: "",
    order: 0,
};

function CaseStudyForm({
    initial,
    onSubmit,
    onCancel,
    isPending,
}: {
    initial?: Partial<CaseStudyFormData>;
    onSubmit: (data: CaseStudyFormData) => void;
    onCancel: () => void;
    isPending: boolean;
}) {
    const [form, setForm] = useState<CaseStudyFormData>({ ...EMPTY, ...initial });
    const [jsonError, setJsonError] = useState(false);
    const set = (key: keyof CaseStudyFormData, value: string | number) =>
        setForm((prev) => ({ ...prev, [key]: value }));

    const handleResultsChange = (val: string) => {
        set("results", val);
        try {
            JSON.parse(val);
            setJsonError(false);
        } catch {
            setJsonError(true);
        }
    };

    return (
        <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">Title</label>
                    <input value={form.title} onChange={(e) => set("title", e.target.value)} className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500" />
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">Client Name</label>
                    <input value={form.client_name} onChange={(e) => set("client_name", e.target.value)} className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500" />
                </div>
                <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">Industry</label>
                    <input value={form.industry} onChange={(e) => set("industry", e.target.value)} className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500" />
                </div>
                <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">Country</label>
                    <input value={form.country} onChange={(e) => set("country", e.target.value)} className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500" />
                </div>
            </div>
            <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Challenge</label>
                <textarea value={form.challenge} onChange={(e) => set("challenge", e.target.value)} rows={3} className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500" />
            </div>
            <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Solution</label>
                <textarea value={form.solution} onChange={(e) => set("solution", e.target.value)} rows={3} className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500" />
            </div>
            <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Results <span className="font-normal text-neutral-400">(JSON array)</span>
                </label>
                <textarea
                    value={form.results}
                    onChange={(e) => handleResultsChange(e.target.value)}
                    rows={3}
                    className={`w-full text-sm border rounded-lg px-3 py-2 focus:outline-none font-mono ${jsonError ? "border-red-400 focus:border-red-500" : "border-neutral-300 focus:border-primary-500"}`}
                />
                {jsonError && <p className="text-[10px] text-red-500 mt-1">Invalid JSON</p>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">Quote</label>
                    <input value={form.quote} onChange={(e) => set("quote", e.target.value)} className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500" />
                </div>
                <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">Quote Author</label>
                    <input value={form.quote_author} onChange={(e) => set("quote_author", e.target.value)} className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500" />
                </div>
                <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">Quote Role</label>
                    <input value={form.quote_role} onChange={(e) => set("quote_role", e.target.value)} className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500" />
                </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
                <button onClick={onCancel} className="text-xs px-4 py-2 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition-colors">Cancel</button>
                <button
                    onClick={() => onSubmit(form)}
                    disabled={isPending || !form.title || !form.slug || jsonError}
                    className="inline-flex items-center gap-1.5 text-xs px-4 py-2 rounded-lg bg-primary-900 text-white hover:bg-primary-800 transition-colors disabled:opacity-50"
                >
                    <Save className="w-3.5 h-3.5" />Save
                </button>
            </div>
        </div>
    );
}

function toPayload(data: CaseStudyFormData) {
    let results: Record<string, unknown>[] = [];
    try {
        results = JSON.parse(data.results);
    } catch {
        // keep empty
    }
    return { ...data, results };
}

export default function CaseStudiesPage() {
    const [creating, setCreating] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
    const [statusFilter, setStatusFilter] = useState<string>("all");

    const { data: studies = [], isLoading } = useAdminCaseStudies();
    const createStudy = useCreateCaseStudy();
    const updateStudy = useUpdateCaseStudy();
    const deleteStudy = useDeleteCaseStudy();
    const transitionStudy = useTransitionCaseStudy();

    const filtered = statusFilter === "all" ? studies : studies.filter((s) => s.status === statusFilter);

    const handleCreate = (data: CaseStudyFormData) => {
        createStudy.mutate(toPayload(data) as unknown as Record<string, unknown>, {
            onSuccess: () => setCreating(false),
        });
    };

    const handleUpdate = (id: number, data: CaseStudyFormData) => {
        const cs = studies.find((s) => s.id === id);
        updateStudy.mutate(
            { id, data: { ...toPayload(data), version: cs?.version } as unknown as Record<string, unknown> },
            { onSuccess: () => setEditingId(null) }
        );
    };

    return (
        <div>
            <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-primary-900 font-heading">Case Studies</h1>
                    <p className="text-sm text-neutral-500 mt-1">{studies.length} case stud{studies.length !== 1 ? "ies" : "y"}</p>
                </div>
                <button
                    onClick={() => { setCreating(true); setEditingId(null); }}
                    className="inline-flex items-center gap-1.5 text-xs px-4 py-2 rounded-lg bg-primary-900 text-white hover:bg-primary-800 transition-colors"
                >
                    <Plus className="w-3.5 h-3.5" />New Case Study
                </button>
            </div>

            <div className="flex flex-wrap gap-2 mb-5">
                {["all", "draft", "review", "approved", "published", "archived"].map((s) => (
                    <button
                        key={s}
                        onClick={() => setStatusFilter(s)}
                        className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${statusFilter === s
                                ? "bg-primary-900 text-white border-primary-900"
                                : "bg-white text-neutral-500 border-neutral-200 hover:border-neutral-400"
                            }`}
                    >
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                ))}
            </div>

            {creating && (
                <div className="mb-5">
                    <CaseStudyForm onSubmit={handleCreate} onCancel={() => setCreating(false)} isPending={createStudy.isPending} />
                </div>
            )}

            {isLoading && (
                <div className="flex items-center justify-center h-48 text-neutral-400 text-sm">Loading…</div>
            )}

            {!isLoading && (
                <div className="space-y-3">
                    {filtered.map((cs: AdminCaseStudyData) =>
                        editingId === cs.id ? (
                            <CaseStudyForm
                                key={cs.id}
                                initial={{
                                    title: cs.title, slug: cs.slug, client_name: cs.client_name,
                                    industry: cs.industry, country: cs.country, challenge: cs.challenge,
                                    solution: cs.solution, results: JSON.stringify(cs.results, null, 2),
                                    quote: cs.quote, quote_author: cs.quote_author, quote_role: cs.quote_role,
                                    order: cs.order,
                                }}
                                onSubmit={(d) => handleUpdate(cs.id, d)}
                                onCancel={() => setEditingId(null)}
                                isPending={updateStudy.isPending}
                            />
                        ) : (
                            <div key={cs.id} className="bg-white rounded-xl border border-neutral-200 p-5">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <CMSStatusBadge status={cs.status} />
                                            <span className="text-xs text-neutral-400 bg-neutral-50 px-2 py-0.5 rounded">{cs.industry}</span>
                                            <span className="text-xs text-neutral-400">{cs.country}</span>
                                        </div>
                                        <h3 className="font-semibold text-primary-900 text-sm">{cs.title}</h3>
                                        <p className="text-xs text-neutral-500 mt-0.5">Client: {cs.client_name}</p>
                                        {cs.challenge && (
                                            <p className="text-xs text-neutral-400 mt-1 line-clamp-2">{cs.challenge}</p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <button onClick={() => { setEditingId(cs.id); setCreating(false); }} className="p-1.5 rounded-lg text-neutral-400 hover:text-primary-600 hover:bg-neutral-50 transition-colors">
                                            <Pencil className="w-3.5 h-3.5" />
                                        </button>
                                        {deleteConfirm === cs.id ? (
                                            <div className="flex items-center gap-1">
                                                <button onClick={() => { deleteStudy.mutate(cs.id); setDeleteConfirm(null); }} className="text-[10px] px-2 py-1 rounded bg-red-500 text-white">Confirm</button>
                                                <button onClick={() => setDeleteConfirm(null)} className="p-1 rounded text-neutral-400 hover:text-neutral-600"><X className="w-3 h-3" /></button>
                                            </div>
                                        ) : (
                                            <button onClick={() => setDeleteConfirm(cs.id)} className="p-1.5 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="mt-3 pt-3 border-t border-neutral-100">
                                    <PublishingActions status={cs.status} version={cs.version} onTransition={(d) => transitionStudy.mutate({ id: cs.id, data: d })} isPending={transitionStudy.isPending} />
                                </div>
                            </div>
                        )
                    )}
                    {filtered.length === 0 && <p className="text-center text-neutral-400 text-sm py-12">No case studies found.</p>}
                </div>
            )}
        </div>
    );
}
