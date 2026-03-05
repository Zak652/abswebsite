"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { useAdminRFQs, useUpdateRFQ } from "@/lib/hooks/useAdmin";
import { adminService } from "@/lib/api/admin";
import { DataTable } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import type { Column } from "@/components/admin/DataTable";
import type { RFQSubmission } from "@/types/rfq";

const STATUS_OPTIONS = [
  { value: "new", label: "New" },
  { value: "reviewing", label: "Reviewing" },
  { value: "quoted", label: "Quoted" },
  { value: "closed", label: "Closed" },
];

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function RFQStatusSelect({
  rfq,
  onUpdate,
}: {
  rfq: RFQSubmission;
  onUpdate: (id: string, status: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(rfq.status);

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="group flex items-center gap-1.5 text-left"
        title="Click to edit"
      >
        <StatusBadge status={value} />
        <span className="text-xs text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity">
          edit
        </span>
      </button>
    );
  }

  return (
    <select
      autoFocus
      value={value}
      onChange={(e) => {
        setValue(e.target.value as RFQSubmission["status"]);
        onUpdate(rfq.id, e.target.value);
        setEditing(false);
      }}
      onBlur={() => setEditing(false)}
      className="text-xs border border-neutral-300 rounded-lg px-2 py-1 bg-white focus:outline-none focus:border-primary-500"
    >
      {STATUS_OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export default function AdminQuotesPage() {
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const { data: rfqs, isLoading } = useAdminRFQs(statusFilter);
  const updateRFQ = useUpdateRFQ();
  const [exporting, setExporting] = useState(false);

  const handleStatusUpdate = (id: string, status: string) => {
    updateRFQ.mutate({ id, data: { status } });
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await adminService.exportRFQs();
      downloadBlob(res.data, "rfqs.csv");
    } finally {
      setExporting(false);
    }
  };

  const columns: Column<RFQSubmission>[] = [
    {
      key: "id",
      header: "Ref",
      render: (row) => (
        <span className="font-mono text-xs text-neutral-400">
          #{String(row.id).slice(0, 8).toUpperCase()}
        </span>
      ),
    },
    { key: "company_name", header: "Company" },
    { key: "email", header: "Email" },
    {
      key: "scope",
      header: "Scope",
      render: (row) => {
        const s: string[] = [];
        if (row.needs_hardware) s.push("HW");
        if (row.needs_software) s.push("SW");
        if (row.needs_services) s.push("SVC");
        return (
          <span className="text-xs text-neutral-500">
            {s.length ? s.join(", ") : "—"}
          </span>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <RFQStatusSelect rfq={row} onUpdate={handleStatusUpdate} />
      ),
    },
    {
      key: "created_at",
      header: "Submitted",
      render: (row) => (
        <span className="text-xs text-neutral-400">
          {new Date(row.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </span>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primary-900 font-heading">
            Quotes
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            {rfqs?.length ?? 0} submission{rfqs?.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {[undefined, "new", "reviewing", "quoted", "closed"].map((status) => (
            <button
              key={status ?? "all"}
              onClick={() => setStatusFilter(status)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${statusFilter === status
                  ? "bg-primary-900 text-white border-primary-900"
                  : "bg-white text-neutral-500 border-neutral-200 hover:border-neutral-400"
                }`}
            >
              {status ? status.charAt(0).toUpperCase() + status.slice(1) : "All"}
            </button>
          ))}
          <button
            onClick={handleExport}
            disabled={exporting}
            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400 transition-colors disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            {exporting ? "Exporting…" : "Export CSV"}
          </button>
        </div>
      </div>

      <DataTable
        data={rfqs ?? []}
        columns={columns}
        isLoading={isLoading}
        emptyMessage="No RFQ submissions found."
      />
    </div>
  );
}
