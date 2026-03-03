type StatusVariant =
  | "new"
  | "reviewing"
  | "quoted"
  | "closed"
  | "pending"
  | "provisioned"
  | "active"
  | "converted"
  | "expired"
  | "pending_payment"
  | "paid"
  | "cancelled"
  | "refunded";

const variantStyles: Record<StatusVariant, string> = {
  // RFQ statuses
  new: "bg-blue-100 text-blue-800",
  reviewing: "bg-yellow-100 text-yellow-800",
  quoted: "bg-green-100 text-green-800",
  closed: "bg-gray-100 text-gray-600",
  // Subscription statuses
  pending: "bg-orange-100 text-orange-800",
  provisioned: "bg-teal-100 text-teal-800",
  active: "bg-green-100 text-green-800",
  converted: "bg-purple-100 text-purple-800",
  expired: "bg-gray-100 text-gray-500",
  // Training statuses
  pending_payment: "bg-yellow-100 text-yellow-800",
  paid: "bg-green-100 text-green-800",
  cancelled: "bg-gray-100 text-gray-600",
  refunded: "bg-red-100 text-red-700",
};

const labels: Record<StatusVariant, string> = {
  new: "New",
  reviewing: "Reviewing",
  quoted: "Quoted",
  closed: "Closed",
  pending: "Pending",
  provisioned: "Provisioned",
  active: "Active",
  converted: "Converted",
  expired: "Expired",
  pending_payment: "Pending Payment",
  paid: "Paid",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const styles =
    variantStyles[status as StatusVariant] ?? "bg-gray-100 text-gray-600";
  const label = labels[status as StatusVariant] ?? status;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles}`}
    >
      {label}
    </span>
  );
}
