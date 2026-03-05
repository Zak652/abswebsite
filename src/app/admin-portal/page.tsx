"use client";

import { useState } from "react";
import {
  FileText,
  MonitorSmartphone,
  GraduationCap,
  AlertCircle,
  BarChart3,
  Users,
} from "lucide-react";
import { StatsCard } from "@/components/admin/StatsCard";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useAdminStats, useAdminAnalytics } from "@/lib/hooks/useAdmin";
import Link from "next/link";

const PERIODS = [
  { label: "7d", value: 7 as const },
  { label: "30d", value: 30 as const },
  { label: "90d", value: 90 as const },
];

const RFQ_STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-500",
  reviewing: "bg-amber-400",
  quoted: "bg-green-500",
  closed: "bg-neutral-400",
};

function BarChart({ data }: { data: Record<string, number> }) {
  const entries = Object.entries(data);
  const max = Math.max(...entries.map(([, v]) => v), 1);
  return (
    <div className="space-y-3">
      {entries.map(([status, count]) => (
        <div key={status} className="flex items-center gap-3">
          <span className="w-20 shrink-0 text-xs font-medium text-primary-900/60 capitalize">
            {status}
          </span>
          <div className="flex-1 bg-neutral-100 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${RFQ_STATUS_COLORS[status] ?? "bg-primary-500"
                }`}
              style={{ width: `${(count / max) * 100}%` }}
            />
          </div>
          <span className="w-6 shrink-0 text-xs font-mono text-right text-primary-900/60">
            {count}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function AdminOverviewPage() {
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const [period, setPeriod] = useState<7 | 30 | 90>(30);
  const { data: analytics, isLoading: analyticsLoading } = useAdminAnalytics(period);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-primary-900 font-heading">
          Admin Dashboard
        </h1>
        <p className="text-sm text-neutral-500 mt-1">Overview of platform activity</p>
      </div>

      {statsLoading || !stats ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <>
          {/* Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <StatsCard label="New RFQs Today" value={stats.new_rfqs_today} icon={AlertCircle} description="Awaiting review" urgent={stats.new_rfqs_today > 0} />
            <StatsCard label="Pending Trials" value={stats.pending_trials} icon={MonitorSmartphone} description="Awaiting provisioning" urgent={stats.pending_trials > 0} />
            <StatsCard label="Training Headcount" value={stats.upcoming_training_headcount} icon={GraduationCap} description="Confirmed attendees" />
            <StatsCard label="Total RFQs" value={stats.total_rfqs} icon={FileText} />
            <StatsCard label="Total Trial Signups" value={stats.total_trials} icon={Users} />
            <StatsCard label="Total Registrations" value={stats.total_registrations} icon={BarChart3} />
          </div>

          {/* Analytics Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-heading font-semibold text-primary-900">Analytics</h2>
              <div className="flex items-center bg-neutral-100 rounded-full p-1 gap-1">
                {PERIODS.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => setPeriod(p.value)}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${period === p.value
                        ? "bg-white text-primary-900 shadow-sm"
                        : "text-primary-900/50 hover:text-primary-900"
                      }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {analyticsLoading || !analytics ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-28 rounded-2xl bg-neutral-100 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl border border-neutral-100 p-5 shadow-sm">
                  <p className="text-xs font-medium text-neutral-400 uppercase tracking-widest mb-3">
                    RFQ Revenue ({period}d)
                  </p>
                  <p className="text-3xl font-heading font-bold text-primary-900">
                    ${analytics.revenue.total_rfq_value.toLocaleString()}
                  </p>
                  <p className="text-xs text-neutral-400 mt-1">
                    {analytics.revenue.rfq_count} RFQs · avg $
                    {Math.round(analytics.revenue.avg_rfq_value).toLocaleString()}
                  </p>
                </div>
                <div className="bg-white rounded-2xl border border-neutral-100 p-5 shadow-sm">
                  <p className="text-xs font-medium text-neutral-400 uppercase tracking-widest mb-3">
                    Trials ({period}d)
                  </p>
                  <p className="text-3xl font-heading font-bold text-primary-900">
                    {analytics.trials.new_signups}
                    <span className="text-base font-normal text-neutral-400 ml-1">new</span>
                  </p>
                  <p className="text-xs text-neutral-400 mt-1">
                    {(analytics.trials.conversion_rate * 100).toFixed(1)}% conversion ·{" "}
                    {analytics.trials.expired} expired
                  </p>
                </div>
                <div className="bg-white rounded-2xl border border-neutral-100 p-5 shadow-sm">
                  <p className="text-xs font-medium text-neutral-400 uppercase tracking-widest mb-4">
                    RFQs by Status
                  </p>
                  <BarChart data={analytics.rfqs_by_status} />
                </div>
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link href="/admin-portal/quotes" className="bg-white rounded-xl border border-neutral-200 p-5 hover:border-primary-500 transition-colors group">
              <p className="text-sm font-medium text-primary-900 group-hover:text-primary-500">Manage Quotes →</p>
              <p className="text-xs text-neutral-400 mt-1">Review and update RFQ statuses</p>
            </Link>
            <Link href="/admin-portal/subscriptions" className="bg-white rounded-xl border border-neutral-200 p-5 hover:border-primary-500 transition-colors group">
              <p className="text-sm font-medium text-primary-900 group-hover:text-primary-500">Manage Trials →</p>
              <p className="text-xs text-neutral-400 mt-1">Provision Arcplus environments</p>
            </Link>
            <Link href="/admin-portal/training" className="bg-white rounded-xl border border-neutral-200 p-5 hover:border-primary-500 transition-colors group">
              <p className="text-sm font-medium text-primary-900 group-hover:text-primary-500">Manage Training →</p>
              <p className="text-xs text-neutral-400 mt-1">View registrations and payments</p>
            </Link>
            <Link
              href="/admin-portal/services"
              className={`bg-white rounded-xl border p-5 hover:border-primary-500 transition-colors group ${stats.new_service_requests > 0 ? "border-red-200 bg-red-50" : "border-neutral-200"
                }`}
            >
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-primary-900 group-hover:text-primary-500">Service Requests →</p>
                {stats.new_service_requests > 0 && (
                  <span className="inline-flex items-center justify-center w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full">
                    {stats.new_service_requests}
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-400 mt-1">Professional services intake</p>
            </Link>
            <Link href="/admin-portal/users" className="bg-white rounded-xl border border-neutral-200 p-5 hover:border-primary-500 transition-colors group">
              <p className="text-sm font-medium text-primary-900 group-hover:text-primary-500">Manage Users →</p>
              <p className="text-xs text-neutral-400 mt-1">Roles, access, and deactivation</p>
            </Link>
            <Link href="/admin-portal/products" className="bg-white rounded-xl border border-neutral-200 p-5 hover:border-primary-500 transition-colors group">
              <p className="text-sm font-medium text-primary-900 group-hover:text-primary-500">Manage Products →</p>
              <p className="text-xs text-neutral-400 mt-1">Hardware catalogue and specs</p>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
