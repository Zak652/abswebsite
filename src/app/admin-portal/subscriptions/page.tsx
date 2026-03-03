"use client";

import { useState } from "react";
import { useAdminTrials, useMarkTrialProvisioned } from "@/lib/hooks/useAdmin";
import { useCurrentUser } from "@/lib/hooks/useAuth";
import { DataTable } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import type { Column } from "@/components/admin/DataTable";
import type { TrialSignup } from "@/types/subscription";

const PLAN_LABELS: Record<string, string> = {
  starter: "Starter",
  growth: "Growth",
  professional: "Professional",
  enterprise: "Enterprise",
};

export default function AdminSubscriptionsPage() {
  const [statusFilter, setStatusFilter] = useState<string | undefined>(
    "pending"
  );
  const { data: trials, isLoading } = useAdminTrials(statusFilter);
  const markProvisioned = useMarkTrialProvisioned();
  const { data: currentUser } = useCurrentUser();

  const handleProvision = (id: string) => {
    const provisionedBy = currentUser?.email ?? "admin";
    markProvisioned.mutate({ id, provisioned_by: provisionedBy });
  };

  const columns: Column<TrialSignup>[] = [
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
    { key: "email", header: "Email" },
    {
      key: "plan",
      header: "Plan",
      render: (row) => (
        <span className="text-xs font-medium text-neutral-700">
          {PLAN_LABELS[row.plan] ?? row.plan}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "created_at",
      header: "Requested",
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
    {
      key: "actions",
      header: "",
      render: (row) =>
        row.status === "pending" ? (
          <button
            onClick={() => handleProvision(row.id)}
            disabled={markProvisioned.isPending}
            className="text-xs font-medium text-primary-500 hover:text-primary-900 transition-colors disabled:opacity-50"
          >
            Mark Provisioned
          </button>
        ) : null,
    },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primary-900 font-heading">
            Trial Signups
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            {trials?.length ?? 0} record{trials?.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {[undefined, "pending", "provisioned", "active", "converted", "expired"].map(
            (status) => (
              <button
                key={status ?? "all"}
                onClick={() => setStatusFilter(status)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${statusFilter === status
                    ? "bg-primary-900 text-white border-primary-900"
                    : "bg-white text-neutral-500 border-neutral-200 hover:border-neutral-400"
                  }`}
              >
                {status
                  ? status.charAt(0).toUpperCase() + status.slice(1)
                  : "All"}
              </button>
            )
          )}
        </div>
      </div>

      <DataTable
        data={trials ?? []}
        columns={columns}
        isLoading={isLoading}
        emptyMessage="No trial signups found."
      />
    </div>
  );
}
