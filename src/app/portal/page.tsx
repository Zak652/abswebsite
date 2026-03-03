"use client";

import { useCurrentUser } from "@/lib/hooks/useAuth";
import { useMyRFQs } from "@/lib/hooks/useRFQ";
import { useMySubscriptions } from "@/lib/hooks/useSubscription";
import { useMyTrainingRegistrations } from "@/lib/hooks/useTraining";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import {
  FileText,
  MonitorSmartphone,
  GraduationCap,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

export default function PortalOverviewPage() {
  const { data: user } = useCurrentUser();
  const { data: rfqs, isLoading: rfqLoading } = useMyRFQs();
  const { data: subscriptions, isLoading: subLoading } = useMySubscriptions();
  const { data: training, isLoading: trainingLoading } =
    useMyTrainingRegistrations();

  const isLoading = rfqLoading || subLoading || trainingLoading;

  const activeRFQs = rfqs?.filter((r) =>
    ["new", "reviewing", "quoted"].includes(r.status)
  ).length;
  const activeSub = subscriptions?.find((s) =>
    ["active", "provisioned", "pending"].includes(s.status)
  );
  const upcomingTraining = training?.filter(
    (t) => t.status === "paid"
  ).length;

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-primary-900 font-heading">
          Welcome back{user?.full_name ? `, ${user.full_name.split(" ")[0]}` : ""}
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          {user?.company_name ?? "Your ABS Portal"}
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="grid gap-4">
          {/* RFQ Summary */}
          <Link
            href="/portal/quotes"
            className="bg-white rounded-xl border border-neutral-200 p-5 flex items-center justify-between hover:border-primary-500 transition-colors group"
          >
            <div className="flex items-center gap-4">
              <div className="p-2.5 rounded-lg bg-[var(--color-info-light)] text-primary-500">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-primary-900">My Quotes</p>
                <p className="text-xs text-neutral-500">
                  {rfqs?.length
                    ? `${rfqs.length} submission${rfqs.length !== 1 ? "s" : ""}${activeRFQs ? `, ${activeRFQs} active` : ""}`
                    : "No quotes yet"}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-primary-500 transition-colors" />
          </Link>

          {/* Subscription Summary */}
          <Link
            href="/portal/subscriptions"
            className="bg-white rounded-xl border border-neutral-200 p-5 flex items-center justify-between hover:border-primary-500 transition-colors group"
          >
            <div className="flex items-center gap-4">
              <div className="p-2.5 rounded-lg bg-[var(--color-success-light)] text-[var(--color-success)]">
                <MonitorSmartphone className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-primary-900">
                  Arcplus Subscription
                </p>
                <p className="text-xs text-neutral-500">
                  {activeSub
                    ? `${activeSub.plan.charAt(0).toUpperCase() + activeSub.plan.slice(1)} — ${activeSub.status}`
                    : "No active subscription"}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-primary-500 transition-colors" />
          </Link>

          {/* Training Summary */}
          <Link
            href="/portal/training"
            className="bg-white rounded-xl border border-neutral-200 p-5 flex items-center justify-between hover:border-primary-500 transition-colors group"
          >
            <div className="flex items-center gap-4">
              <div className="p-2.5 rounded-lg bg-accent-100 text-accent-600">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-primary-900">
                  Training Registrations
                </p>
                <p className="text-xs text-neutral-500">
                  {training?.length
                    ? `${training.length} registration${training.length !== 1 ? "s" : ""}${upcomingTraining ? `, ${upcomingTraining} confirmed` : ""}`
                    : "No registrations yet"}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-primary-500 transition-colors" />
          </Link>
        </div>
      )}

      <div className="mt-8 p-5 bg-[var(--color-info-light)] rounded-xl border border-primary-200">
        <p className="text-sm font-medium text-primary-600 mb-1">Need help?</p>
        <p className="text-xs text-primary-400">
          Contact your ABS account manager or email{" "}
          <a
            href="mailto:support@absplatform.com"
            className="underline hover:no-underline"
          >
            support@absplatform.com
          </a>
        </p>
      </div>
    </div>
  );
}
