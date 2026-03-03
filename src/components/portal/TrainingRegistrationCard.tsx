import { StatusBadge } from "@/components/admin/StatusBadge";
import type { TrainingRegistration } from "@/types/training";

interface TrainingRegistrationCardProps {
  registration: TrainingRegistration;
}

export function TrainingRegistrationCard({
  registration,
}: TrainingRegistrationCardProps) {
  const sessionDate = new Date(registration.session_date).toLocaleDateString(
    "en-US",
    { weekday: "long", year: "numeric", month: "long", day: "numeric" }
  );

  const registeredDate = new Date(registration.created_at).toLocaleDateString(
    "en-US",
    { year: "numeric", month: "short", day: "numeric" }
  );

  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-5">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-primary-900 truncate">
            {registration.session_title}
          </p>
        </div>
        <StatusBadge status={registration.status} />
      </div>

      <div className="space-y-1 text-xs text-neutral-500">
        <p>
          <span className="text-neutral-700 font-medium">Date:</span>{" "}
          {sessionDate}
        </p>
        {registration.team_size > 1 && (
          <p>
            <span className="text-neutral-700 font-medium">Team size:</span>{" "}
            {registration.team_size} attendees
          </p>
        )}
        {registration.amount_paid && (
          <p>
            <span className="text-neutral-700 font-medium">Amount paid:</span>{" "}
            {registration.currency} {Number(registration.amount_paid).toLocaleString()}
          </p>
        )}
        <p className="text-neutral-400">Registered: {registeredDate}</p>
      </div>

      {registration.status === "pending_payment" && (
        <div className="mt-3 p-3 bg-accent-100 rounded-lg border border-accent-300">
          <p className="text-xs text-primary-700">
            Payment pending. If you were redirected back without completing
            payment, please contact us to retry.
          </p>
        </div>
      )}
    </div>
  );
}
