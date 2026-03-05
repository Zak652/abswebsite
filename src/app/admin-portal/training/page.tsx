"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { useAdminTraining } from "@/lib/hooks/useAdmin";
import { adminService } from "@/lib/api/admin";
import { DataTable } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import type { Column } from "@/components/admin/DataTable";
import type { TrainingRegistration } from "@/types/training";

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminTrainingPage() {
  const { data: registrations, isLoading } = useAdminTraining();
  const [exporting, setExporting] = useState(false);

  const paidCount = registrations?.filter((r) => r.status === "paid").length ?? 0;
  const pendingCount =
    registrations?.filter((r) => r.status === "pending_payment").length ?? 0;

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await adminService.exportTraining();
      downloadBlob(res.data, "training-registrations.csv");
    } finally {
      setExporting(false);
    }
  };

  const columns: Column<TrainingRegistration>[] = [
    {
      key: "id",
      header: "Ref",
      render: (row) => (
        <span className="font-mono text-xs text-neutral-400">
          #{String(row.id).slice(0, 8).toUpperCase()}
        </span>
      ),
    },
    { key: "full_name", header: "Name" },
    { key: "company_name", header: "Company" },
    {
      key: "session_title",
      header: "Session",
      render: (row) => (
        <span className="text-sm text-neutral-700">{row.session_title}</span>
      ),
    },
    {
      key: "session_date",
      header: "Date",
      render: (row) => (
        <span className="text-xs text-neutral-500">
          {new Date(row.session_date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </span>
      ),
    },
    {
      key: "team_size",
      header: "Seats",
      render: (row) => (
        <span className="text-xs text-neutral-700">{row.team_size}</span>
      ),
    },
    {
      key: "amount_paid",
      header: "Amount",
      render: (row) =>
        row.amount_paid ? (
          <span className="text-xs text-neutral-700">
            {row.currency} {Number(row.amount_paid).toLocaleString()}
          </span>
        ) : (
          <span className="text-xs text-neutral-400">—</span>
        ),
    },
    {
      key: "status",
      header: "Payment",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "created_at",
      header: "Registered",
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
      <div className="mb-6 flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primary-900 font-heading">
            Training Registrations
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            {registrations?.length ?? 0} total · {paidCount} paid ·{" "}
            {pendingCount} pending payment
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400 transition-colors disabled:opacity-50"
        >
          <Download className="w-3.5 h-3.5" />
          {exporting ? "Exporting…" : "Export CSV"}
        </button>
      </div>

      <DataTable
        data={registrations ?? []}
        columns={columns}
        isLoading={isLoading}
        emptyMessage="No training registrations found."
      />
    </div>
  );
}
