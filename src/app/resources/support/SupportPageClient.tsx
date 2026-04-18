"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, LifeBuoy, Mail, MessageSquare, Phone } from "lucide-react";
import type { SupportTierData } from "@/types/cms";

interface SupportPageClientProps {
    cmsTiers: SupportTierData[];
}

/* Hardcoded fallback tiers (used when CMS is empty) */
const FALLBACK_TIERS = [
    { feature: "Initial response time", starter: "48 hours", growth: "8 hours", professional: "4 hours", enterprise: "1 hour" },
    { feature: "Support channels", starter: "Email", growth: "Email", professional: "Email + Chat", enterprise: "Email + Chat + Phone" },
    { feature: "Dedicated account manager", starter: false, growth: false, professional: false, enterprise: true },
    { feature: "Custom SLA", starter: false, growth: false, professional: false, enterprise: true },
    { feature: "Onboarding assistance", starter: "Self-serve docs", growth: "Guided setup call", professional: "Dedicated onboarding", enterprise: "Full implementation" },
    { feature: "Training sessions included", starter: "0", growth: "1", professional: "3", enterprise: "Unlimited" },
    { feature: "Bug fix priority", starter: "Standard queue", growth: "Standard queue", professional: "Priority queue", enterprise: "Critical escalation" },
];

const PLAN_HEADERS = [
    { key: "starter", label: "Starter" },
    { key: "growth", label: "Growth" },
    { key: "professional", label: "Professional" },
    { key: "enterprise", label: "Enterprise" },
] as const;

type PlanKey = (typeof PLAN_HEADERS)[number]["key"];
type TierRow = Record<PlanKey | "feature", string | boolean>;

function TierCell({ value }: { value: string | boolean }) {
    if (typeof value === "boolean") {
        return value ? (
            <Check className="w-4 h-4 text-green-500 mx-auto" />
        ) : (
            <span className="text-neutral-300 mx-auto block text-center">—</span>
        );
    }
    return <span className="text-sm text-primary-900/70">{value}</span>;
}

function buildTierRows(tiers: SupportTierData[]): TierRow[] {
    if (tiers.length === 0) return FALLBACK_TIERS as TierRow[];

    const featureNames = [...new Set(tiers.flatMap((t) => t.feature_values.map((fv) => fv.feature_name)))];

    return featureNames.map((name) => {
        const row: TierRow = { feature: name, starter: false, growth: false, professional: false, enterprise: false };
        for (const tier of tiers) {
            const slugKey = tier.slug as PlanKey;
            const fv = tier.feature_values.find((f) => f.feature_name === name);
            if (fv && (slugKey in row)) {
                row[slugKey] = fv.value === "true" ? true : fv.value === "false" ? false : fv.value;
            }
        }
        return row;
    });
}

export function SupportPageClient({ cmsTiers }: SupportPageClientProps) {
    const tiers = buildTierRows(cmsTiers);

    const [form, setForm] = useState({ name: "", email: "", company: "", plan: "", message: "" });
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await fetch("/api/v1/rfq/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    company_name: form.company,
                    contact_name: form.name,
                    contact_email: form.email,
                    message: `[Support Request] Plan: ${form.plan || "Unknown"}\n\n${form.message}`,
                    product_interest: "Support",
                }),
            });
        } catch {
            // Fail silently
        }
        setSubmitted(true);
        setSubmitting(false);
    };

    return (
        <div className="min-h-screen bg-surface pt-24 pb-32">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

                <Link href="/" className="inline-flex items-center text-sm font-medium text-primary-900/60 hover:text-accent-500 transition-colors mb-12">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Link>

                <div className="flex items-center gap-4 mb-12">
                    <div className="p-3 rounded-2xl bg-accent-500/10">
                        <LifeBuoy className="w-6 h-6 text-accent-500" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-heading font-bold text-primary-900">Support</h1>
                        <p className="text-primary-900/60 mt-1">We&apos;re here to help</p>
                    </div>
                </div>

                {/* Support Tier Matrix */}
                <div className="mb-12">
                    <h2 className="text-2xl font-heading font-bold text-primary-900 mb-6">Support Tiers</h2>
                    <div className="bg-white rounded-3xl border border-neutral-100 shadow-sm overflow-hidden overflow-x-auto">
                        <table className="w-full min-w-[640px] text-sm text-left">
                            <thead>
                                <tr className="border-b border-neutral-100">
                                    <th className="p-5 w-40 bg-neutral-50 text-xs font-bold uppercase tracking-widest text-primary-900/40">Feature</th>
                                    {PLAN_HEADERS.map((p) => (
                                        <th key={p.key} className="p-5 text-center font-heading font-semibold text-primary-900 border-l border-neutral-100">{p.label}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100">
                                {tiers.map((row, i) => (
                                    <tr key={String(row.feature)} className={`hover:bg-neutral-50 transition-colors ${i % 2 === 0 ? "" : "bg-neutral-50/40"}`}>
                                        <td className="p-5 font-medium text-primary-900 bg-neutral-50 border-r border-neutral-100">{String(row.feature)}</td>
                                        {PLAN_HEADERS.map((p) => (
                                            <td key={p.key} className="p-5 text-center border-l border-neutral-100">
                                                <TierCell value={row[p.key as PlanKey]} />
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <p className="text-xs text-primary-900/40 mt-3 text-right">Response times apply during East Africa business hours (Mon – Fri, 08:00 – 18:00 EAT).</p>
                </div>

                {/* Contact Cards */}
                <div className="grid sm:grid-cols-3 gap-6 mb-12">
                    <a href="mailto:support@absplatform.com" className="bg-white rounded-2xl border border-neutral-100 p-6 hover:border-accent-500 transition-colors group shadow-sm">
                        <Mail className="w-6 h-6 text-accent-500 mb-4" />
                        <p className="font-semibold text-primary-900 mb-1 group-hover:text-accent-500 transition-colors">Email Support</p>
                        <p className="text-sm text-primary-900/60">support@absplatform.com</p>
                        <p className="text-xs text-neutral-400 mt-2">Response within 4 business hours</p>
                    </a>
                    <a href="mailto:sales@absplatform.com" className="bg-white rounded-2xl border border-neutral-100 p-6 hover:border-accent-500 transition-colors group shadow-sm">
                        <MessageSquare className="w-6 h-6 text-primary-500 mb-4" />
                        <p className="font-semibold text-primary-900 mb-1 group-hover:text-accent-500 transition-colors">Sales Enquiries</p>
                        <p className="text-sm text-primary-900/60">sales@absplatform.com</p>
                        <p className="text-xs text-neutral-400 mt-2">For quotes and commercial questions</p>
                    </a>
                    <div className="bg-white rounded-2xl border border-neutral-100 p-6 shadow-sm">
                        <Phone className="w-6 h-6 text-green-500 mb-4" />
                        <p className="font-semibold text-primary-900 mb-1">Phone Support</p>
                        <p className="text-sm text-primary-900/60">Available to Enterprise plan customers</p>
                        <p className="text-xs text-neutral-400 mt-2">Contact your account manager for number</p>
                    </div>
                </div>

                {/* Contact Form */}
                <div className="bg-white rounded-3xl border border-neutral-100 shadow-sm p-8 mb-12">
                    <h2 className="text-2xl font-heading font-bold text-primary-900 mb-2">Send us a message</h2>
                    <p className="text-sm text-primary-900/60 mb-8">Describe your issue or question and we will get back to you promptly.</p>

                    {submitted ? (
                        <div className="text-center py-10">
                            <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                                <Check className="w-7 h-7 text-green-500" />
                            </div>
                            <p className="text-lg font-heading font-semibold text-primary-900 mb-2">Message received</p>
                            <p className="text-sm text-primary-900/60 max-w-sm mx-auto">
                                We will respond to <strong>{form.email}</strong> within your plan&apos;s SLA window.
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="grid sm:grid-cols-2 gap-5">
                                <div>
                                    <label className="text-xs font-medium text-primary-900/60 mb-1.5 block">Full name <span className="text-accent-500">*</span></label>
                                    <input required type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-900/20 focus:border-primary-900 transition-colors" placeholder="Jane Mwangi" />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-primary-900/60 mb-1.5 block">Work email <span className="text-accent-500">*</span></label>
                                    <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-900/20 focus:border-primary-900 transition-colors" placeholder="jane@yourorg.com" />
                                </div>
                            </div>
                            <div className="grid sm:grid-cols-2 gap-5">
                                <div>
                                    <label className="text-xs font-medium text-primary-900/60 mb-1.5 block">Company</label>
                                    <input type="text" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-900/20 focus:border-primary-900 transition-colors" placeholder="Your Organisation" />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-primary-900/60 mb-1.5 block">Current Arcplus plan</label>
                                    <select value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })} className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-900/20 focus:border-primary-900 transition-colors bg-white">
                                        <option value="">Select plan (optional)</option>
                                        <option value="Starter">Starter</option>
                                        <option value="Growth">Growth</option>
                                        <option value="Professional">Professional</option>
                                        <option value="Enterprise">Enterprise</option>
                                        <option value="Trial">Trial</option>
                                        <option value="None">Not yet a customer</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-primary-900/60 mb-1.5 block">Message <span className="text-accent-500">*</span></label>
                                <textarea required rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-900/20 focus:border-primary-900 transition-colors resize-none" placeholder="Describe your issue, question, or request..." />
                            </div>
                            <button type="submit" disabled={submitting} className="w-full sm:w-auto bg-primary-900 text-white px-8 py-3.5 rounded-xl font-medium hover:bg-accent-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
                                {submitting ? "Sending…" : "Send Message"}
                            </button>
                        </form>
                    )}
                </div>

                {/* Urgent CTA */}
                <div className="bg-primary-900 rounded-3xl p-8 text-center">
                    <p className="text-xl font-heading font-bold text-white mb-3">Need urgent help?</p>
                    <p className="text-white/70 mb-6 max-w-md mx-auto">For critical production issues, include &ldquo;URGENT&rdquo; in your email subject line and we will prioritize your ticket.</p>
                    <a href="mailto:support@absplatform.com?subject=URGENT: " className="inline-flex items-center gap-2 bg-accent-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-accent-600 transition-colors">Send Urgent Request</a>
                </div>
            </div>
        </div>
    );
}
