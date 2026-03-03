import type { LucideIcon } from "lucide-react";

interface StatsCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  description?: string;
  urgent?: boolean;
}

export function StatsCard({
  label,
  value,
  icon: Icon,
  description,
  urgent = false,
}: StatsCardProps) {
  return (
    <div
      className={`
        bg-white rounded-xl border p-6
        ${urgent ? "border-accent-500" : "border-neutral-200"}
      `}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-neutral-500 font-medium">{label}</p>
          <p
            className={`text-3xl font-bold mt-1 font-heading ${urgent ? "text-accent-500" : "text-primary-900"
              }`}
          >
            {value.toLocaleString()}
          </p>
          {description && (
            <p className="text-xs text-neutral-400 mt-1">{description}</p>
          )}
        </div>
        <div
          className={`
            p-2.5 rounded-lg
            ${urgent ? "bg-accent-100 text-accent-600" : "bg-neutral-100 text-neutral-500"}
          `}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
