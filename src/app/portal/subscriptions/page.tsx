"use client";

import { useMySubscriptions } from "@/lib/hooks/useSubscription";
import { SubscriptionStatusCard } from "@/components/portal/SubscriptionStatusCard";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { MonitorSmartphone } from "lucide-react";
import Link from "next/link";

export default function PortalSubscriptionsPage() {
  const { data: subscriptions, isLoading } = useMySubscriptions();

  return (
    <div className="max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary-900 font-heading">
            Arcplus Subscription
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Your Arcplus trial and subscription status
          </p>
        </div>
        <Link
          href="/arcplus"
          className="text-sm font-medium text-primary-500 hover:text-primary-900 transition-colors"
        >
          + Start Trial
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      ) : !subscriptions || subscriptions.length === 0 ? (
        <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-neutral-100">
              <MonitorSmartphone className="w-6 h-6 text-neutral-400" />
            </div>
          </div>
          <p className="text-sm font-medium text-neutral-700 mb-1">
            No active subscription
          </p>
          <p className="text-xs text-neutral-400 mb-4">
            Start a free Arcplus trial to experience intelligent asset
            management.
          </p>
          <Link
            href="/arcplus"
            className="inline-flex items-center gap-2 text-sm font-medium text-white bg-primary-500 hover:bg-primary-900 rounded-xl px-5 py-2.5 transition-colors"
          >
            Start Free Trial
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {subscriptions.map((sub) => (
            <SubscriptionStatusCard key={sub.id} subscription={sub} />
          ))}
        </div>
      )}

      <div className="mt-8 p-5 bg-neutral-50 rounded-xl border border-neutral-200">
        <p className="text-sm font-medium text-neutral-700 mb-1">
          How provisioning works
        </p>
        <ol className="text-xs text-neutral-500 space-y-1 list-decimal list-inside">
          <li>Submit a trial request with your plan preference</li>
          <li>
            ABS team reviews and provisions your dedicated Arcplus environment
            (1–2 business days)
          </li>
          <li>You receive credentials by email to access your environment</li>
          <li>
            After your trial, upgrade to a full subscription to retain your
            data
          </li>
        </ol>
      </div>
    </div>
  );
}
