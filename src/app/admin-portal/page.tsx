"use client";

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
import { useAdminStats } from "@/lib/hooks/useAdmin";
import Link from "next/link";

export default function AdminOverviewPage() {
  const { data: stats, isLoading } = useAdminStats();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-primary-900 font-heading">
          Admin Dashboard
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Overview of platform activity
        </p>
      </div>

      {isLoading || !stats ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <StatsCard
              label="New RFQs Today"
              value={stats.new_rfqs_today}
              icon={AlertCircle}
              description="Awaiting review"
              urgent={stats.new_rfqs_today > 0}
            />
            <StatsCard
              label="Pending Trials"
              value={stats.pending_trials}
              icon={MonitorSmartphone}
              description="Awaiting provisioning"
              urgent={stats.pending_trials > 0}
            />
            <StatsCard
              label="Training Headcount"
              value={stats.upcoming_training_headcount}
              icon={GraduationCap}
              description="Confirmed attendees"
            />
            <StatsCard
              label="Total RFQs"
              value={stats.total_rfqs}
              icon={FileText}
            />
            <StatsCard
              label="Total Trial Signups"
              value={stats.total_trials}
              icon={Users}
            />
            <StatsCard
              label="Total Registrations"
              value={stats.total_registrations}
              icon={BarChart3}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              href="/admin-portal/quotes"
              className="bg-white rounded-xl border border-neutral-200 p-5 hover:border-primary-500 transition-colors group"
            >
              <p className="text-sm font-medium text-primary-900 group-hover:text-primary-500">
                Manage Quotes →
              </p>
              <p className="text-xs text-neutral-400 mt-1">
                Review and update RFQ statuses
              </p>
            </Link>
            <Link
              href="/admin-portal/subscriptions"
              className="bg-white rounded-xl border border-neutral-200 p-5 hover:border-primary-500 transition-colors group"
            >
              <p className="text-sm font-medium text-primary-900 group-hover:text-primary-500">
                Manage Trials →
              </p>
              <p className="text-xs text-neutral-400 mt-1">
                Provision Arcplus environments
              </p>
            </Link>
            <Link
              href="/admin-portal/training"
              className="bg-white rounded-xl border border-neutral-200 p-5 hover:border-primary-500 transition-colors group"
            >
              <p className="text-sm font-medium text-primary-900 group-hover:text-primary-500">
                Manage Training →
              </p>
              <p className="text-xs text-neutral-400 mt-1">
                View registrations and payments
              </p>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
