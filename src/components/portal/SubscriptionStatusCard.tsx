import { StatusBadge } from "@/components/admin/StatusBadge";
import type { TrialSignup } from "@/types/subscription";

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
};

export function SubscriptionStatusCard({
  subscription,
}: SubscriptionStatusCardProps) {
  const date = new Date(subscription.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const message = statusMessages[subscription.status] ?? "";

  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-5">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <p className="text-sm font-semibold text-primary-900">
            Arcplus {planLabels[subscription.plan] ?? subscription.plan} Trial
          </p>
          <p className="text-xs text-neutral-400 mt-0.5">Requested {date}</p>
        </div>
        <StatusBadge status={subscription.status} />
      </div>
      {message && (
        <p className="text-xs text-neutral-500 bg-neutral-50 rounded-lg p-3 leading-relaxed">
          {message}
        </p>
      )}
    </div>
  );
}
