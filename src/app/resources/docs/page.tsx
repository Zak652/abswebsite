"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, FileText, ChevronRight } from "lucide-react";

const SECTIONS = [
  {
    id: "getting-started",
    label: "Getting Started",
    content: (
      <div className="space-y-4">
        <p className="text-primary-900/70 leading-relaxed">
          Welcome to Arcplus. This guide walks you through onboarding your
          organisation, inviting your first users, and importing your existing
          asset register.
        </p>
        <h3 className="text-lg font-heading font-semibold text-primary-900 pt-2">
          Prerequisites
        </h3>
        <ul className="space-y-2 text-sm text-primary-900/70">
          <li className="flex items-start gap-2">
            <ChevronRight className="w-4 h-4 text-accent-500 mt-0.5 shrink-0" />
            An active Arcplus subscription (Starter, Growth, or Professional)
          </li>
          <li className="flex items-start gap-2">
            <ChevronRight className="w-4 h-4 text-accent-500 mt-0.5 shrink-0" />
            Admin credentials provided in your welcome email
          </li>
          <li className="flex items-start gap-2">
            <ChevronRight className="w-4 h-4 text-accent-500 mt-0.5 shrink-0" />
            A CSV or Excel export of your existing asset data (optional)
          </li>
        </ul>
        <h3 className="text-lg font-heading font-semibold text-primary-900 pt-2">
          First Login
        </h3>
        <p className="text-sm text-primary-900/70 leading-relaxed">
          Navigate to your tenant URL (e.g.{" "}
          <code className="font-mono text-xs bg-neutral-100 px-1.5 py-0.5 rounded">
            yourorg.arcplus.io
          </code>
          ) and sign in with the credentials from your welcome email. You will
          be prompted to set a new password on first login.
        </p>
        <div className="bg-accent-500/5 border border-accent-500/20 rounded-2xl p-4 text-sm text-primary-900/70">
          <strong className="text-primary-900">Tip:</strong> Enable two-factor
          authentication immediately from Settings → Security. Admin accounts
          without 2FA are flagged in the platform audit log.
        </div>
      </div>
    ),
  },
  {
    id: "asset-fields",
    label: "Asset Fields",
    content: (
      <div className="space-y-4">
        <p className="text-sm text-primary-900/70 leading-relaxed">
          Each asset record in Arcplus contains the following core fields. All
          fields marked <strong>Required</strong> must be populated before an
          asset can be set to Active status.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-neutral-100 rounded-2xl overflow-hidden">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-100">
                <th className="p-3 text-left font-semibold text-primary-900">Field</th>
                <th className="p-3 text-left font-semibold text-primary-900">Type</th>
                <th className="p-3 text-left font-semibold text-primary-900">Required</th>
                <th className="p-3 text-left font-semibold text-primary-900">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {[
                ["asset_id", "string", "Yes", "Unique identifier, auto-generated"],
                ["name", "string", "Yes", "Descriptive human-readable name"],
                ["category", "enum", "Yes", "Defined in Settings → Categories"],
                ["location", "string", "Yes", "Building or GPS coordinates"],
                ["status", "enum", "Yes", "active | in_maintenance | disposed"],
                ["purchase_date", "date", "No", "ISO 8601 format (YYYY-MM-DD)"],
                ["purchase_value", "decimal", "No", "Base currency of your account"],
                ["serial_number", "string", "No", "Manufacturer serial"],
                ["rfid_tag", "string", "No", "EPC Gen2 tag ID"],
                ["assigned_to", "user_id", "No", "FK to Users on Growth+ plans"],
                ["notes", "text", "No", "Free-text field, up to 2,000 chars"],
              ].map(([field, type, req, notes]) => (
                <tr key={field} className="hover:bg-neutral-50 transition-colors">
                  <td className="p-3 font-mono text-xs text-primary-900">{field}</td>
                  <td className="p-3 text-primary-900/60">{type}</td>
                  <td className="p-3">
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${req === "Yes"
                          ? "bg-accent-500/10 text-accent-500"
                          : "bg-neutral-100 text-neutral-500"
                        }`}
                    >
                      {req}
                    </span>
                  </td>
                  <td className="p-3 text-sm text-primary-900/55">{notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    ),
  },
  {
    id: "csv-import",
    label: "CSV Import",
    content: (
      <div className="space-y-4">
        <p className="text-sm text-primary-900/70 leading-relaxed">
          Arcplus accepts CSV imports to bulk-load assets. Downloads a starter
          template from <strong>Assets → Import → Download Template</strong>.
        </p>
        <h3 className="text-lg font-heading font-semibold text-primary-900">
          Template Format
        </h3>
        <div className="bg-primary-900 rounded-2xl p-5 overflow-x-auto">
          <pre className="font-mono text-xs text-neutral-200 whitespace-pre leading-relaxed">{`asset_id,name,category,location,status,purchase_date,purchase_value,serial_number
,Laptop Dell XPS 15,IT Equipment,HQ Floor 2,active,2023-06-15,1250.00,DLX9823
,HP LaserJet Pro,Office Equipment,HQ Floor 1,active,2022-01-10,420.00,HPL443JX
,Generator 20KVA,Facilities,Generator House,in_maintenance,2021-09-01,8500.00,GEN20KVA`}</pre>
        </div>
        <div className="bg-neutral-50 border border-neutral-100 rounded-2xl p-4 space-y-2 text-sm text-primary-900/70">
          <p>
            <strong className="text-primary-900">Leave asset_id blank</strong>{" "}
            — Arcplus will auto-assign IDs on import.
          </p>
          <p>
            Maximum rows per import: <strong>5,000</strong> (Growth), <strong>20,000</strong> (Professional).
          </p>
          <p>
            Duplicate serial numbers will be flagged before commit — you choose
            to skip or overwrite.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "rfid-scanning",
    label: "RFID Scanning",
    content: (
      <div className="space-y-4">
        <p className="text-sm text-primary-900/70 leading-relaxed">
          Arcplus integrates with UHF RFID scanners to perform bulk asset
          verification. Compatible scanners are available through the ABS
          Hardware catalogue.
        </p>
        <h3 className="text-lg font-heading font-semibold text-primary-900">
          Pairing a Scanner
        </h3>
        <ol className="space-y-3 text-sm text-primary-900/70">
          {[
            "Download the Arcplus Mobile app (iOS / Android).",
            'Navigate to Settings → Hardware → Add Scanner.',
            "Put the scanner into pairing mode (hold trigger for 5 seconds).",
            "Select the scanner from the Bluetooth device list.",
            "Assign the scanner to a user or leave it unassigned for shared use.",
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-accent-500 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
        <h3 className="text-lg font-heading font-semibold text-primary-900 pt-2">
          Running a Verification Scan
        </h3>
        <p className="text-sm text-primary-900/70 leading-relaxed">
          From the mobile app, select <strong>Verify Assets</strong>, choose a
          location filter (all assets, a floor, or a specific room), then start
          scanning. The app shows a real-time match/miss tally. Unmatched tags
          are queued for review.
        </p>
      </div>
    ),
  },
  {
    id: "depreciation",
    label: "Depreciation",
    content: (
      <div className="space-y-4">
        <p className="text-sm text-primary-900/70 leading-relaxed">
          Arcplus Professional includes automated depreciation calculation.
          Three methods are supported:
        </p>
        <div className="grid gap-4">
          {[
            {
              method: "Straight Line",
              formula: "(Cost − Residual Value) / Useful Life",
              use: "Predictable, even-spread write-downs. Suitable for most assets.",
              color: "border-blue-200 bg-blue-50",
            },
            {
              method: "Declining Balance",
              formula: "Book Value × Depreciation Rate",
              use: "Front-loaded write-downs. Good for technology assets that lose value quickly.",
              color: "border-amber-200 bg-amber-50",
            },
            {
              method: "Units of Production",
              formula: "(Cost − Residual) / Total Units × Units Used",
              use: "Usage-based. Best for manufacturing equipment tied to output metrics.",
              color: "border-green-200 bg-green-50",
            },
          ].map((m) => (
            <div
              key={m.method}
              className={`rounded-2xl border p-5 ${m.color}`}
            >
              <p className="font-semibold text-primary-900 mb-1">{m.method}</p>
              <code className="font-mono text-xs text-primary-900/70 block mb-2">
                {m.formula}
              </code>
              <p className="text-sm text-primary-900/60">{m.use}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "user-roles",
    label: "User Roles",
    content: (
      <div className="space-y-4">
        <p className="text-sm text-primary-900/70 leading-relaxed">
          Arcplus uses role-based access control. Roles are assigned per user
          from <strong>Admin → Users</strong>.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-neutral-100 rounded-2xl overflow-hidden">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-100">
                <th className="p-3 text-left font-semibold text-primary-900">Role</th>
                <th className="p-3 text-left font-semibold text-primary-900">View</th>
                <th className="p-3 text-left font-semibold text-primary-900">Edit</th>
                <th className="p-3 text-left font-semibold text-primary-900">Admin</th>
                <th className="p-3 text-left font-semibold text-primary-900">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {[
                ["Owner", "✓", "✓", "✓", "Full platform access, billing"],
                ["Admin", "✓", "✓", "✓", "All except billing management"],
                ["Editor", "✓", "✓", "—", "Can create/edit assets and reports"],
                ["Viewer", "✓", "—", "—", "Read-only access to assigned assets"],
                ["Field Agent", "✓", "Scan only", "—", "Mobile scan and verification only"],
              ].map(([role, view, edit, admin, notes]) => (
                <tr key={role} className="hover:bg-neutral-50 transition-colors">
                  <td className="p-3 font-semibold text-primary-900">{role}</td>
                  <td className="p-3 text-primary-900/60">{view}</td>
                  <td className="p-3 text-primary-900/60">{edit}</td>
                  <td className="p-3 text-primary-900/60">{admin}</td>
                  <td className="p-3 text-sm text-primary-900/55">{notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    ),
  },
  {
    id: "maintenance-module",
    label: "Maintenance Module",
    content: (
      <div className="space-y-4">
        <p className="text-sm text-primary-900/70 leading-relaxed">
          The Maintenance module (Growth and above) allows you to create
          scheduled and ad-hoc maintenance work orders tied directly to asset
          records.
        </p>
        <h3 className="text-lg font-heading font-semibold text-primary-900">
          Creating a Work Order
        </h3>
        <ol className="space-y-2 text-sm text-primary-900/70">
          {[
            "Open an asset record and click the Maintenance tab.",
            "Click New Work Order.",
            "Set type: Preventive, Corrective, or Inspection.",
            "Assign a technician (must have Field Agent or Editor role).",
            "Set a due date. The asset status changes to In Maintenance automatically.",
            "When the technician marks Complete, you are notified and the asset returns to Active.",
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-primary-900 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>
    ),
  },
  {
    id: "api-access",
    label: "API Access",
    content: (
      <div className="space-y-4">
        <p className="text-sm text-primary-900/70 leading-relaxed">
          REST API access is available on Growth and Professional plans. API
          tokens are generated from <strong>Settings → API → New Token</strong>.
        </p>
        <p className="text-sm text-primary-900/70">
          For full endpoint documentation, see the{" "}
          <Link
            href="/resources/api-reference"
            className="text-accent-500 hover:text-accent-600 underline underline-offset-2"
          >
            API Reference
          </Link>
          .
        </p>
        <div className="bg-neutral-50 border border-neutral-100 rounded-2xl p-4 text-sm text-primary-900/70 space-y-1">
          <p>Token scopes: <code className="font-mono text-xs bg-neutral-100 px-1 rounded">read</code>, <code className="font-mono text-xs bg-neutral-100 px-1 rounded">write</code>, <code className="font-mono text-xs bg-neutral-100 px-1 rounded">admin</code></p>
          <p>Rate limit: 1,000 requests per minute per token.</p>
          <p>Tokens do not expire by default. Rotate from Settings → API on a schedule.</p>
        </div>
      </div>
    ),
  },
];

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState(SECTIONS[0].id);

  const activeContent = SECTIONS.find((s) => s.id === activeSection);

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
              {SECTIONS.map((s) => (
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
              {activeContent?.content}
            </div>

            {/* Prev / Next */}
            <div className="flex items-center justify-between mt-6 gap-4">
              {SECTIONS.findIndex((s) => s.id === activeSection) > 0 ? (
                <button
                  onClick={() => {
                    const idx = SECTIONS.findIndex((s) => s.id === activeSection);
                    setActiveSection(SECTIONS[idx - 1].id);
                  }}
                  className="inline-flex items-center gap-2 text-sm font-medium text-primary-900/60 hover:text-accent-500 transition-colors"
                >
                  ← {SECTIONS[SECTIONS.findIndex((s) => s.id === activeSection) - 1]?.label}
                </button>
              ) : (
                <span />
              )}
              {SECTIONS.findIndex((s) => s.id === activeSection) < SECTIONS.length - 1 ? (
                <button
                  onClick={() => {
                    const idx = SECTIONS.findIndex((s) => s.id === activeSection);
                    setActiveSection(SECTIONS[idx + 1].id);
                  }}
                  className="inline-flex items-center gap-2 text-sm font-medium text-primary-900/60 hover:text-accent-500 transition-colors ml-auto"
                >
                  {SECTIONS[SECTIONS.findIndex((s) => s.id === activeSection) + 1]?.label} →
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
