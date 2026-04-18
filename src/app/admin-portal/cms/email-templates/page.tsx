"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, X, Save, Eye } from "lucide-react";
import { CMSStatusBadge } from "@/components/admin/CMSStatusBadge";
import { PublishingActions } from "@/components/admin/PublishingActions";
import type { AdminEmailTemplateData, TransitionRequest } from "@/types/cms";
import {
    useAdminEmailTemplates,
    useCreateEmailTemplate,
    useUpdateEmailTemplate,
    useDeleteEmailTemplate,
    useTransitionEmailTemplate,
} from "@/lib/hooks/useCMSAdmin";

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

const TRIGGER_CHOICES = [
    { value: "rfq_acknowledgment", label: "RFQ Acknowledgment" },
    { value: "trial_signup", label: "Trial Signup" },
    { value: "service_request", label: "Service Request" },
    { value: "trial_day7_reminder", label: "Trial Day-7 Reminder" },
    { value: "trial_day3_reminder", label: "Trial Day-3 Reminder" },
    { value: "trial_expiry", label: "Trial Expiry" },
    { value: "training_confirmation", label: "Training Confirmation" },
    { value: "payment_receipt", label: "Payment Receipt" },
    { value: "subscription_renewal", label: "Subscription Renewal" },
    { value: "general_notification", label: "General Notification" },
];

type FormData = {
    name: string;
    slug: string;
    subject: string;
    body_html: string;
    body_text: string;
    trigger_type: string;
    available_variables: string;
    preview_data: string;
};

const EMPTY: FormData = {
    name: "",
    slug: "",
    subject: "",
    body_html: "",
    body_text: "",
    trigger_type: "general_notification",
    available_variables: "[]",
    preview_data: "{}",
};

/* ------------------------------------------------------------------ */
/*  Preview panel                                                     */
/* ------------------------------------------------------------------ */

function PreviewPanel({ html }: { html: string }) {
    return (
        <div className="bg-white border border-neutral-200 rounded-xl p-4">
            <h3 className="text-xs font-semibold text-neutral-600 mb-3 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" />Preview
            </h3>
            <div
                className="border rounded-lg p-4 text-sm max-h-[400px] overflow-y-auto"
                dangerouslySetInnerHTML={{ __html: html }}
            />
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Form                                                              */
/* ------------------------------------------------------------------ */

function EmailTemplateForm({
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
    const [showPreview, setShowPreview] = useState(false);
    const [jsonError, setJsonError] = useState(false);

    const set = (key: keyof FormData, value: string) =>
        setForm((prev) => ({ ...prev, [key]: value }));

    const handleJsonField = (key: "available_variables" | "preview_data", val: string) => {
        set(key, val);
        try { JSON.parse(val); setJsonError(false); } catch { setJsonError(true); }
    };

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
                    <label className="block text-xs font-medium text-neutral-700 mb-1">Trigger Type</label>
                    <select value={form.trigger_type} onChange={(e) => set("trigger_type", e.target.value)} className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500">
                        {TRIGGER_CHOICES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                </div>
            </div>
            <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Subject</label>
                <input value={form.subject} onChange={(e) => set("subject", e.target.value)} className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500" placeholder="Use {{ variable }} for template variables" />
            </div>
            <div>
                <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-neutral-700">Body HTML</label>
                    <button type="button" onClick={() => setShowPreview(!showPreview)} className="text-[10px] text-primary-600 hover:underline flex items-center gap-1">
                        <Eye className="w-3 h-3" />{showPreview ? "Hide" : "Show"} Preview
                    </button>
                </div>
                <textarea value={form.body_html} onChange={(e) => set("body_html", e.target.value)} rows={10} className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500 font-mono" />
            </div>
            {showPreview && <PreviewPanel html={form.body_html} />}
            <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Body Plain Text</label>
                <textarea value={form.body_text} onChange={(e) => set("body_text", e.target.value)} rows={4} className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500 font-mono" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">Available Variables <span className="font-normal text-neutral-400">(JSON array)</span></label>
                    <textarea value={form.available_variables} onChange={(e) => handleJsonField("available_variables", e.target.value)} rows={2} className={`w-full text-sm border rounded-lg px-3 py-2 focus:outline-none font-mono ${jsonError ? "border-red-400" : "border-neutral-300"}`} />
                </div>
                <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">Preview Data <span className="font-normal text-neutral-400">(JSON object)</span></label>
                    <textarea value={form.preview_data} onChange={(e) => handleJsonField("preview_data", e.target.value)} rows={2} className={`w-full text-sm border rounded-lg px-3 py-2 focus:outline-none font-mono ${jsonError ? "border-red-400" : "border-neutral-300"}`} />
                </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
                <button onClick={onCancel} className="text-xs px-4 py-2 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition-colors">Cancel</button>
                <button onClick={() => onSubmit(form)} disabled={isPending || !form.name || !form.slug || !form.trigger_type || jsonError} className="inline-flex items-center gap-1.5 text-xs px-4 py-2 rounded-lg bg-primary-900 text-white hover:bg-primary-800 transition-colors disabled:opacity-50">
                    <Save className="w-3.5 h-3.5" />Save
                </button>
            </div>
        </div>
    );
}

function toPayload(data: FormData) {
    let available_variables: string[] = [];
    let preview_data: Record<string, string> = {};
    try { available_variables = JSON.parse(data.available_variables); } catch { /* keep default */ }
    try { preview_data = JSON.parse(data.preview_data); } catch { /* keep default */ }
    return { ...data, available_variables, preview_data };
}

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */

export default function EmailTemplatesPage() {
    const [creating, setCreating] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
    const [statusFilter, setStatusFilter] = useState("all");

    const { data: templates = [], isLoading } = useAdminEmailTemplates();
    const createTpl = useCreateEmailTemplate();
    const updateTpl = useUpdateEmailTemplate();
    const deleteTpl = useDeleteEmailTemplate();
    const transitionTpl = useTransitionEmailTemplate();

    const filtered = statusFilter === "all" ? templates : templates.filter((t) => t.status === statusFilter);

    const triggerLabel = (val: string) => TRIGGER_CHOICES.find((t) => t.value === val)?.label ?? val;

    const handleCreate = (data: FormData) => {
        createTpl.mutate(toPayload(data) as unknown as Record<string, unknown>, {
            onSuccess: () => setCreating(false),
        });
    };

    const handleUpdate = (id: number, data: FormData) => {
        const tpl = templates.find((t) => t.id === id);
        updateTpl.mutate(
            { id, data: { ...toPayload(data), version: tpl?.version } as unknown as Record<string, unknown> },
            { onSuccess: () => setEditingId(null) }
        );
    };

    return (
        <div>
            <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-primary-900 font-heading">Email Templates</h1>
                    <p className="text-sm text-neutral-500 mt-1">{templates.length} template{templates.length !== 1 ? "s" : ""}</p>
                </div>
                <button
                    onClick={() => { setCreating(true); setEditingId(null); }}
                    className="inline-flex items-center gap-1.5 text-xs px-4 py-2 rounded-lg bg-primary-900 text-white hover:bg-primary-800 transition-colors"
                >
                    <Plus className="w-3.5 h-3.5" />New Template
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
                    <EmailTemplateForm onSubmit={handleCreate} onCancel={() => setCreating(false)} isPending={createTpl.isPending} />
                </div>
            )}

            {isLoading && <div className="flex items-center justify-center h-48 text-neutral-400 text-sm">Loading…</div>}

            {!isLoading && (
                <div className="space-y-3">
                    {filtered.map((tpl: AdminEmailTemplateData) =>
                        editingId === tpl.id ? (
                            <EmailTemplateForm
                                key={tpl.id}
                                initial={{
                                    name: tpl.name, slug: tpl.slug, subject: tpl.subject,
                                    body_html: tpl.body_html, body_text: tpl.body_text,
                                    trigger_type: tpl.trigger_type,
                                    available_variables: JSON.stringify(tpl.available_variables, null, 2),
                                    preview_data: JSON.stringify(tpl.preview_data, null, 2),
                                }}
                                onSubmit={(d) => handleUpdate(tpl.id, d)}
                                onCancel={() => setEditingId(null)}
                                isPending={updateTpl.isPending}
                            />
                        ) : (
                            <div key={tpl.id} className="bg-white rounded-xl border border-neutral-200 p-4 flex items-start justify-between gap-4">
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-semibold text-sm text-primary-900">{tpl.name}</span>
                                        <CMSStatusBadge status={tpl.status} />
                                    </div>
                                    <p className="text-xs text-neutral-500 mt-1">Subject: {tpl.subject}</p>
                                    <div className="flex items-center gap-3 mt-1 text-[11px] text-neutral-400">
                                        <span className="bg-neutral-100 px-1.5 py-0.5 rounded">{triggerLabel(tpl.trigger_type)}</span>
                                        <span>slug: {tpl.slug}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                    <PublishingActions
                                        status={tpl.status}
                                        version={tpl.version}
                                        onTransition={(data: TransitionRequest) => transitionTpl.mutate({ id: tpl.id, data })}
                                        isPending={transitionTpl.isPending}
                                    />
                                    <button onClick={() => { setEditingId(tpl.id); setCreating(false); }} className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-primary-700 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                                    {deleteConfirm === tpl.id ? (
                                        <div className="flex items-center gap-1 ml-1">
                                            <button onClick={() => deleteTpl.mutate(tpl.id, { onSuccess: () => setDeleteConfirm(null) })} className="text-[10px] px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700">Confirm</button>
                                            <button onClick={() => setDeleteConfirm(null)} className="p-1 rounded hover:bg-neutral-100 text-neutral-400"><X className="w-3.5 h-3.5" /></button>
                                        </div>
                                    ) : (
                                        <button onClick={() => setDeleteConfirm(tpl.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-neutral-400 hover:text-red-600 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                                    )}
                                </div>
                            </div>
                        )
                    )}
                    {filtered.length === 0 && !creating && (
                        <div className="text-center py-12 text-neutral-400 text-sm">
                            {statusFilter === "all" ? "No email templates yet." : `No ${statusFilter} templates.`}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
