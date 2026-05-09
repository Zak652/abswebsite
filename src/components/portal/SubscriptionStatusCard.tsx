"use client";

import { useState } from "react";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { useCancelTrial } from "@/lib/hooks/useSubscription";
import { CANCELLABLE_STATUSES, type TrialSignup } from "@/types/subscription";

interface SubscriptionStatusCardProps {
  subscription: TrialSignup;
}

const planLabels: Record<string, string> = {
  starter: "Starter",
  growth: "Growth",
  professional: "Professional",
  enterprise: "Enterprise",
};

const statusMessages: Record<string, string> = {
  pending:
    "Your trial request has been received. Our team will provision your account within 1–2 business days.",
  provisioned:
    "Your Arcplus environment is being set up. You will receive login credentials by email shortly.",
  active:
    "Your Arcplus trial is active. Log in using the credentials sent to your email.",
  converted: "You are now a full Arcplus subscriber. Thank you!",
  expired:
    "Your trial period has ended. Contact us to upgrade to a paid plan.",
  cancelled:
    "Your trial has been cancelled. We'll keep your data for 30 days in case you change your mind.",
};

export function SubscriptionStatusCard({
  subscription,
}: SubscriptionStatusCardProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [reason, setReason] = useState("");
  const cancel = useCancelTrial();

  const date = new Date(subscription.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const message = statusMessages[subscription.status] ?? "";
  const canCancel = CANCELLABLE_STATUSES.has(subscription.status);

  const submitCancel = () => {
    cancel.mutate(
      { id: subscription.id, reason: reason.trim() || undefined },
      { onSettled: () => setShowConfirm(false) },
    );
  };

  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-5">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <p className="text-sm font-semibold text-primary-900">
            Arcplus {planLabels[subscription.plan] ?? subscription.plan} Trial
          </p>
          <p className="text-xs text-neutral-400 mt-0.5">Requested {date}</p>
          {subscription.cancelled_at && (
            <p className="text-xs text-neutral-400 mt-0.5">
              Cancelled{" "}
              {new Date(subscription.cancelled_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </p>
          )}
        </div>
        <StatusBadge status={subscription.status} />
      </div>

      {message && (
        <p className="text-xs text-neutral-500 bg-neutral-50 rounded-lg p-3 leading-relaxed">
          {message}
        </p>
      )}

      {canCancel && !showConfirm && (
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={() => setShowConfirm(true)}
            className="text-xs font-medium text-neutral-500 hover:text-red-600 underline underline-offset-4 transition-colors"
          >
            Cancel trial
          </button>
        </div>
      )}

      {canCancel && showConfirm && (
        <div className="mt-4 border-t border-neutral-200 pt-4">
          <p className="text-sm font-medium text-primary-900 mb-1">
            Cancel this trial?
          </p>
          <p className="text-xs text-neutral-500 mb-3">
            You won&apos;t receive further reminders. Your data is kept for 30
            days in case you change your mind.
          </p>
          <label
            htmlFor="cancel-reason"
            className="block text-xs font-medium text-neutral-700 mb-1"
          >
            Reason (optional)
          </label>
          <textarea
            id="cancel-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            maxLength={255}
            className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500"
            placeholder="Anything we could improve?"
          />
          {cancel.error && (
            <p role="alert" className="mt-2 text-xs text-red-600">
              We couldn&apos;t cancel that — please try again or contact
              support.
            </p>
          )}
          <div className="mt-3 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setShowConfirm(false);
                setReason("");
                cancel.reset();
              }}
              className="text-xs px-3 py-1.5 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition-colors"
              disabled={cancel.isPending}
            >
              Keep trial
            </button>
            <button
              type="button"
              onClick={submitCancel}
              disabled={cancel.isPending}
              className="text-xs px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {cancel.isPending ? "Cancelling…" : "Yes, cancel"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
