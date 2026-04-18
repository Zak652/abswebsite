"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import type { DocumentationPageData } from "@/types/cms";

interface DocSection {
    id: string;
    label: string;
    content: string;
}

/* ------------------------------------------------------------------ */
/*  Fallback content (used when CMS returns no data)                  */
/* ------------------------------------------------------------------ */

const FALLBACK_SECTIONS: DocSection[] = [
    {
        id: "getting-started",
        label: "Getting Started",
        content: `<div class="space-y-4">
      <p class="text-primary-900/70 leading-relaxed">Welcome to Arcplus. This guide walks you through onboarding your organisation, inviting your first users, and importing your existing asset register.</p>
      <h3 class="text-lg font-heading font-semibold text-primary-900 pt-2">Prerequisites</h3>
      <ul class="space-y-2 text-sm text-primary-900/70">
        <li class="flex items-start gap-2">An active Arcplus subscription (Starter, Growth, or Professional)</li>
        <li class="flex items-start gap-2">Admin credentials provided in your welcome email</li>
        <li class="flex items-start gap-2">A CSV or Excel export of your existing asset data (optional)</li>
      </ul>
      <h3 class="text-lg font-heading font-semibold text-primary-900 pt-2">First Login</h3>
      <p class="text-sm text-primary-900/70 leading-relaxed">Navigate to your tenant URL (e.g. <code class="font-mono text-xs bg-neutral-100 px-1.5 py-0.5 rounded">yourorg.arcplus.io</code>) and sign in with the credentials from your welcome email. You will be prompted to set a new password on first login.</p>
      <div class="bg-accent-500/5 border border-accent-500/20 rounded-2xl p-4 text-sm text-primary-900/70"><strong class="text-primary-900">Tip:</strong> Enable two-factor authentication immediately from Settings → Security.</div>
    </div>`,
    },
    {
        id: "asset-fields",
        label: "Asset Fields",
        content: `<div class="space-y-4">
      <p class="text-sm text-primary-900/70 leading-relaxed">Each asset record in Arcplus contains the following core fields. All fields marked <strong>Required</strong> must be populated before an asset can be set to Active status.</p>
      <div class="overflow-x-auto"><table class="w-full text-sm border border-neutral-100 rounded-2xl overflow-hidden"><thead><tr class="bg-neutral-50 border-b border-neutral-100"><th class="p-3 text-left font-semibold text-primary-900">Field</th><th class="p-3 text-left font-semibold text-primary-900">Type</th><th class="p-3 text-left font-semibold text-primary-900">Required</th><th class="p-3 text-left font-semibold text-primary-900">Notes</th></tr></thead><tbody class="divide-y divide-neutral-100"><tr><td class="p-3 font-mono text-xs">asset_id</td><td class="p-3">string</td><td class="p-3">Yes</td><td class="p-3 text-sm">Unique identifier, auto-generated</td></tr><tr><td class="p-3 font-mono text-xs">name</td><td class="p-3">string</td><td class="p-3">Yes</td><td class="p-3 text-sm">Descriptive human-readable name</td></tr><tr><td class="p-3 font-mono text-xs">category</td><td class="p-3">enum</td><td class="p-3">Yes</td><td class="p-3 text-sm">Defined in Settings → Categories</td></tr><tr><td class="p-3 font-mono text-xs">location</td><td class="p-3">string</td><td class="p-3">Yes</td><td class="p-3 text-sm">Building or GPS coordinates</td></tr><tr><td class="p-3 font-mono text-xs">status</td><td class="p-3">enum</td><td class="p-3">Yes</td><td class="p-3 text-sm">active | in_maintenance | disposed</td></tr></tbody></table></div>
    </div>`,
    },
    {
        id: "csv-import",
        label: "CSV Import",
        content: `<div class="space-y-4">
      <p class="text-sm text-primary-900/70 leading-relaxed">Arcplus accepts CSV imports to bulk-load assets. Downloads a starter template from <strong>Assets → Import → Download Template</strong>.</p>
      <h3 class="text-lg font-heading font-semibold text-primary-900">Template Format</h3>
      <div class="bg-primary-900 rounded-2xl p-5 overflow-x-auto"><pre class="font-mono text-xs text-neutral-200 whitespace-pre leading-relaxed">asset_id,name,category,location,status,purchase_date,purchase_value,serial_number
,Laptop Dell XPS 15,IT Equipment,HQ Floor 2,active,2023-06-15,1250.00,DLX9823</pre></div>
      <div class="bg-neutral-50 border border-neutral-100 rounded-2xl p-4 space-y-2 text-sm text-primary-900/70"><p><strong class="text-primary-900">Leave asset_id blank</strong> — Arcplus will auto-assign IDs on import.</p><p>Maximum rows per import: <strong>5,000</strong> (Growth), <strong>20,000</strong> (Professional).</p></div>
    </div>`,
    },
    {
        id: "rfid-scanning",
        label: "RFID Scanning",
        content: `<div class="space-y-4">
      <p class="text-sm text-primary-900/70 leading-relaxed">Arcplus integrates with UHF RFID scanners to perform bulk asset verification. Compatible scanners are available through the ABS Hardware catalogue.</p>
      <h3 class="text-lg font-heading font-semibold text-primary-900">Pairing a Scanner</h3>
      <ol class="space-y-3 text-sm text-primary-900/70"><li>1. Download the Arcplus Mobile app (iOS / Android).</li><li>2. Navigate to Settings → Hardware → Add Scanner.</li><li>3. Put the scanner into pairing mode (hold trigger for 5 seconds).</li><li>4. Select the scanner from the Bluetooth device list.</li><li>5. Assign the scanner to a user or leave it unassigned for shared use.</li></ol>
    </div>`,
    },
    {
        id: "depreciation",
        label: "Depreciation",
        content: `<div class="space-y-4">
      <p class="text-sm text-primary-900/70 leading-relaxed">Arcplus Professional includes automated depreciation calculation. Three methods are supported:</p>
      <div class="grid gap-4">
        <div class="rounded-2xl border p-5 border-blue-200 bg-blue-50"><p class="font-semibold text-primary-900 mb-1">Straight Line</p><code class="font-mono text-xs text-primary-900/70 block mb-2">(Cost − Residual Value) / Useful Life</code><p class="text-sm text-primary-900/60">Predictable, even-spread write-downs. Suitable for most assets.</p></div>
        <div class="rounded-2xl border p-5 border-amber-200 bg-amber-50"><p class="font-semibold text-primary-900 mb-1">Declining Balance</p><code class="font-mono text-xs text-primary-900/70 block mb-2">Book Value × Depreciation Rate</code><p class="text-sm text-primary-900/60">Front-loaded write-downs. Good for technology assets.</p></div>
        <div class="rounded-2xl border p-5 border-green-200 bg-green-50"><p class="font-semibold text-primary-900 mb-1">Units of Production</p><code class="font-mono text-xs text-primary-900/70 block mb-2">(Cost − Residual) / Total Units × Units Used</code><p class="text-sm text-primary-900/60">Usage-based. Best for manufacturing equipment.</p></div>
      </div>
    </div>`,
    },
    {
        id: "user-roles",
        label: "User Roles",
        content: `<div class="space-y-4">
      <p class="text-sm text-primary-900/70 leading-relaxed">Arcplus uses role-based access control. Roles are assigned per user from <strong>Admin → Users</strong>.</p>
      <div class="overflow-x-auto"><table class="w-full text-sm border border-neutral-100 rounded-2xl overflow-hidden"><thead><tr class="bg-neutral-50 border-b border-neutral-100"><th class="p-3 text-left font-semibold">Role</th><th class="p-3 text-left font-semibold">View</th><th class="p-3 text-left font-semibold">Edit</th><th class="p-3 text-left font-semibold">Admin</th><th class="p-3 text-left font-semibold">Notes</th></tr></thead><tbody class="divide-y divide-neutral-100"><tr><td class="p-3 font-semibold">Owner</td><td class="p-3">✓</td><td class="p-3">✓</td><td class="p-3">✓</td><td class="p-3 text-sm">Full platform access, billing</td></tr><tr><td class="p-3 font-semibold">Admin</td><td class="p-3">✓</td><td class="p-3">✓</td><td class="p-3">✓</td><td class="p-3 text-sm">All except billing management</td></tr><tr><td class="p-3 font-semibold">Editor</td><td class="p-3">✓</td><td class="p-3">✓</td><td class="p-3">—</td><td class="p-3 text-sm">Can create/edit assets and reports</td></tr><tr><td class="p-3 font-semibold">Viewer</td><td class="p-3">✓</td><td class="p-3">—</td><td class="p-3">—</td><td class="p-3 text-sm">Read-only access</td></tr></tbody></table></div>
    </div>`,
    },
    {
        id: "maintenance-module",
        label: "Maintenance Module",
        content: `<div class="space-y-4">
      <p class="text-sm text-primary-900/70 leading-relaxed">The Maintenance module (Growth and above) allows you to create scheduled and ad-hoc maintenance work orders tied directly to asset records.</p>
      <h3 class="text-lg font-heading font-semibold text-primary-900">Creating a Work Order</h3>
      <ol class="space-y-2 text-sm text-primary-900/70"><li>1. Open an asset record and click the Maintenance tab.</li><li>2. Click New Work Order.</li><li>3. Set type: Preventive, Corrective, or Inspection.</li><li>4. Assign a technician (must have Field Agent or Editor role).</li><li>5. Set a due date. The asset status changes to In Maintenance automatically.</li><li>6. When the technician marks Complete, you are notified and the asset returns to Active.</li></ol>
    </div>`,
    },
    {
        id: "api-access",
        label: "API Access",
        content: `<div class="space-y-4">
      <p class="text-sm text-primary-900/70 leading-relaxed">REST API access is available on Growth and Professional plans. API tokens are generated from <strong>Settings → API → New Token</strong>.</p>
      <p class="text-sm text-primary-900/70">For full endpoint documentation, see the <a href="/resources/api-reference" class="text-accent-500 hover:text-accent-600 underline underline-offset-2">API Reference</a>.</p>
      <div class="bg-neutral-50 border border-neutral-100 rounded-2xl p-4 text-sm text-primary-900/70 space-y-1"><p>Token scopes: <code class="font-mono text-xs bg-neutral-100 px-1 rounded">read</code>, <code class="font-mono text-xs bg-neutral-100 px-1 rounded">write</code>, <code class="font-mono text-xs bg-neutral-100 px-1 rounded">admin</code></p><p>Rate limit: 1,000 requests per minute per token.</p></div>
    </div>`,
    },
];

/* ------------------------------------------------------------------ */
/*  Map CMS data → internal sections                                  */
/* ------------------------------------------------------------------ */

function cmsToSections(pages: DocumentationPageData[]): DocSection[] {
    return pages.map((p) => ({
        id: p.slug,
        label: p.title,
        content: p.content,
    }));
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

interface DocsPageClientProps {
    cmsPages: DocumentationPageData[];
}

export default function DocsPageClient({ cmsPages }: DocsPageClientProps) {
    const sections =
        cmsPages.length > 0 ? cmsToSections(cmsPages) : FALLBACK_SECTIONS;
    const [activeSection, setActiveSection] = useState(sections[0].id);

    const activeContent = sections.find((s) => s.id === activeSection);

    return (
        <div className="min-h-screen bg-surface pt-24 pb-32">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Back */}
                <Link
                    href="/"
                    className="inline-flex items-center text-sm font-medium text-primary-900/60 hover:text-accent-500 transition-colors mb-12"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Link>

                {/* Page Header */}
                <div className="flex items-center gap-4 mb-10">
                    <div className="p-3 rounded-2xl bg-green-50">
                        <FileText className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-heading font-bold text-primary-900">
                            Documentation
                        </h1>
                        <p className="text-primary-900/60 mt-1">
                            Guides, references, and tutorials for Arcplus
                        </p>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-8">
                    {/* Sidebar */}
                    <aside className="md:w-56 shrink-0">
                        <nav className="md:sticky md:top-32 space-y-1">
                            {sections.map((s) => (
                                <button
                                    key={s.id}
                                    onClick={() => setActiveSection(s.id)}
                                    className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${activeSection === s.id
                                            ? "bg-primary-900 text-white"
                                            : "text-primary-900/60 hover:text-primary-900 hover:bg-neutral-100"
                                        }`}
                                >
                                    {s.label}
                                </button>
                            ))}
                        </nav>
                    </aside>

                    {/* Content panel */}
                    <main className="flex-1 min-w-0">
                        <div className="bg-white rounded-3xl border border-neutral-100 shadow-sm p-8">
                            <h2 className="text-2xl font-heading font-bold text-primary-900 mb-6">
                                {activeContent?.label}
                            </h2>
                            {activeContent && (
                                <div
                                    className="cms-content"
                                    dangerouslySetInnerHTML={{
                                        __html: activeContent.content,
                                    }}
                                />
                            )}
                        </div>

                        {/* Prev / Next */}
                        <div className="flex items-center justify-between mt-6 gap-4">
                            {sections.findIndex(
                                (s) => s.id === activeSection
                            ) > 0 ? (
                                <button
                                    onClick={() => {
                                        const idx = sections.findIndex(
                                            (s) => s.id === activeSection
                                        );
                                        setActiveSection(sections[idx - 1].id);
                                    }}
                                    className="inline-flex items-center gap-2 text-sm font-medium text-primary-900/60 hover:text-accent-500 transition-colors"
                                >
                                    ←{" "}
                                    {
                                        sections[
                                            sections.findIndex(
                                                (s) => s.id === activeSection
                                            ) - 1
                                        ]?.label
                                    }
                                </button>
                            ) : (
                                <span />
                            )}
                            {sections.findIndex(
                                (s) => s.id === activeSection
                            ) <
                                sections.length - 1 ? (
                                <button
                                    onClick={() => {
                                        const idx = sections.findIndex(
                                            (s) => s.id === activeSection
                                        );
                                        setActiveSection(sections[idx + 1].id);
                                    }}
                                    className="inline-flex items-center gap-2 text-sm font-medium text-primary-900/60 hover:text-accent-500 transition-colors ml-auto"
                                >
                                    {
                                        sections[
                                            sections.findIndex(
                                                (s) => s.id === activeSection
                                            ) + 1
                                        ]?.label
                                    }{" "}
                                    →
                                </button>
                            ) : (
                                <span />
                            )}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}
