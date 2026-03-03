import { StatusBadge } from "@/components/admin/StatusBadge";
import type { RFQSubmission } from "@/types/rfq";

interface QuoteCardProps {
  rfq: RFQSubmission;
}

export function QuoteCard({ rfq }: QuoteCardProps) {
  const scope: string[] = [];
  if (rfq.needs_hardware) scope.push("Hardware");
  if (rfq.needs_software) scope.push("Software");
  if (rfq.needs_services) scope.push("Services");

  const date = new Date(rfq.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-xs font-mono text-neutral-400">
              #{String(rfq.id).slice(0, 8).toUpperCase()}
            </p>
            <StatusBadge status={rfq.status} />
          </div>
          <p className="text-sm font-medium text-primary-900 truncate">
            {rfq.company_name}
          </p>
          {scope.length > 0 && (
            <p className="text-xs text-neutral-500 mt-1">
              Scope: {scope.join(", ")}
            </p>
          )}
          {rfq.asset_count_range && (
            <p className="text-xs text-neutral-500">
              Assets: {rfq.asset_count_range}
            </p>
          )}
        </div>
        <p className="text-xs text-neutral-400 whitespace-nowrap">{date}</p>
      </div>
      {rfq.additional_notes && (
        <p className="mt-3 text-xs text-neutral-500 border-t border-neutral-100 pt-3 line-clamp-2">
          {rfq.additional_notes}
        </p>
      )}
    </div>
  );
}
