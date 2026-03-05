"use client";

import { useState } from "react";
import { Mail, ChevronDown, ChevronUp } from "lucide-react";
import {
  useAdminServiceRequests,
  useUpdateServiceRequest,
} from "@/lib/hooks/useAdmin";
import { StatusBadge } from "@/components/admin/StatusBadge";
import type { ServiceRequest, ServiceStatus } from "@/types/services";

const SERVICE_TYPE_LABELS: Record<string, string> = {
  asset_register: "Asset Register",
  verification: "Verification",
  disposal: "Disposal",
  training_outsource: "Training Outsource",
  full_outsource: "Full Outsource",
};

const STATUS_OPTIONS: { value: ServiceStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "reviewing", label: "Reviewing" },
  { value: "scoped", label: "Scoped" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const URGENCY_COLORS: Record<string, string> = {
  urgent: "bg-red-100 text-red-700",
  standard: "bg-amber-100 text-amber-700",
  flexible: "bg-green-100 text-green-700",
};

function ServiceExpandPanel({
  request,
  onClose,
}: {
  request: ServiceRequest;
  onClose: () => void;
}) {
  const updateRequest = useUpdateServiceRequest();
  const [notes, setNotes] = useState(request.admin_notes ?? "");
  const [savedNotes, setSavedNotes] = useState(request.admin_notes ?? "");

  const handleNotesBlur = () => {
    if (notes !== savedNotes) {
      updateRequest.mutate({ id: request.id, data: { admin_notes: notes } });
      setSavedNotes(notes);
    }
  };

  return (
    <tr>
      <td colSpan={7} className="bg-neutral-50 px-6 py-5 border-b border-neutral-100">
        <div className="max-w-3xl">
          <div className="flex items-start justify-between mb-5">
            <div>
              <p className="text-sm font-semibold text-primary-900">
                {request.full_name} · {request.company_name}
              </p>
              <p className="text-xs text-neutral-500 mt-0.5">{request.email}</p>
            </div>
            <button
              onClick={onClose}
              className="text-xs text-neutral-400 hover:text-neutral-700 transition-colors"
            >
              Close
            </button>
          </div>

          {/* Intake data */}
          {Object.keys(request.intake_data).length > 0 && (
            <div className="mb-5">
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-3">
                Intake Details
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(request.intake_data).map(([key, val]) => (
                  <div key={key} className="bg-white rounded-lg p-3 border border-neutral-100">
                    <p className="text-xs text-neutral-400 capitalize mb-0.5">
                      {key.replace(/_/g, " ")}
                    </p>
                    <p className="text-sm text-primary-900 font-medium">{String(val)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Status + notes + actions */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Status change */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-500">Status:</span>
                <select
                  defaultValue={request.status}
                  onChange={(e) =>
                    updateRequest.mutate({
                      id: request.id,
                      data: { status: e.target.value as ServiceStatus },
                    })
                  }
                  disabled={updateRequest.isPending}
                  className="text-xs border border-neutral-300 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:border-primary-500 disabled:opacity-50"
                >
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Email CTA */}
              <a
                href={`mailto:${request.email}?subject=Re: ${SERVICE_TYPE_LABELS[request.service_type] ?? request.service_type} Request`}
                className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-neutral-200 text-neutral-600 hover:border-neutral-400 transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                Email Client
              </a>
            </div>

            {/* Admin notes */}
            <div>
              <p className="text-xs text-neutral-500 mb-1.5">Admin notes (auto-saved on blur)</p>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onBlur={handleNotesBlur}
                rows={3}
                placeholder="Add internal notes…"
                className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
              />
            </div>
          </div>
        </div>
      </td>
    </tr>
  );
}

export default function AdminServicesPage() {
  const [typeFilter, setTypeFilter] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<string | undefined>("new");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: requests, isLoading } = useAdminServiceRequests({
    service_type: typeFilter,
    status: statusFilter,
  });

  const rows = requests ?? [];

  return (
    <div>
      <div className="mb-6 flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primary-900 font-heading">
            Service Requests
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            {rows.length} request{rows.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mb-5">
        {/* Service type filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-neutral-500 font-medium">Type:</span>
          {([undefined, ...Object.keys(SERVICE_TYPE_LABELS)] as (string | undefined)[]).map(
            (t) => (
              <button
                key={t ?? "all"}
                onClick={() => setTypeFilter(t)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${typeFilter === t
                    ? "bg-primary-900 text-white border-primary-900"
                    : "bg-white text-neutral-500 border-neutral-200 hover:border-neutral-400"
                  }`}
              >
                {t ? SERVICE_TYPE_LABELS[t] : "All"}
              </button>
            )
          )}
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-neutral-500 font-medium">Status:</span>
          {([undefined, ...STATUS_OPTIONS.map((o) => o.value)] as (string | undefined)[]).map(
            (s) => (
              <button
                key={s ?? "all"}
                onClick={() => setStatusFilter(s)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${statusFilter === s
                    ? "bg-primary-900 text-white border-primary-900"
                    : "bg-white text-neutral-500 border-neutral-200 hover:border-neutral-400"
                  }`}
              >
                {s
                  ? STATUS_OPTIONS.find((o) => o.value === s)?.label ?? s
                  : "All"}
              </button>
            )
          )}
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="rounded-2xl border border-neutral-100 overflow-hidden animate-pulse bg-neutral-50 h-48" />
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-neutral-100 p-8 text-center">
          <p className="text-sm text-neutral-400">No service requests found.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-neutral-100 overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 border-b border-neutral-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  Ref
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  Company
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  Service
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  Urgency
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  Submitted
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {rows.map((req) => (
                <>
                  <tr
                    key={req.id}
                    className={`hover:bg-neutral-50 transition-colors cursor-pointer ${expandedId === req.id ? "bg-neutral-50" : ""
                      }`}
                    onClick={() => setExpandedId(expandedId === req.id ? null : req.id)}
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-neutral-400">
                        #{String(req.id).slice(0, 8).toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-primary-900">
                          {req.company_name}
                        </p>
                        <p className="text-xs text-neutral-400">{req.full_name}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-neutral-700">
                        {SERVICE_TYPE_LABELS[req.service_type] ?? req.service_type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full capitalize ${URGENCY_COLORS[req.urgency] ?? "bg-neutral-100 text-neutral-600"
                          }`}
                      >
                        {req.urgency}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={req.status} />
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-neutral-400">
                        {new Date(req.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedId(expandedId === req.id ? null : req.id);
                        }}
                        className="flex items-center gap-1 text-xs text-neutral-400 hover:text-primary-900 transition-colors"
                        aria-label={expandedId === req.id ? "Collapse row" : "Expand row"}
                      >
                        {expandedId === req.id ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                  </tr>
                  {expandedId === req.id && (
                    <ServiceExpandPanel
                      key={`expand-${req.id}`}
                      request={req}
                      onClose={() => setExpandedId(null)}
                    />
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
