"use client";

type CMSStatus = "draft" | "review" | "approved" | "published" | "archived";

const styles: Record<CMSStatus, string> = {
    draft: "bg-gray-100 text-gray-600",
    review: "bg-yellow-100 text-yellow-800",
    approved: "bg-blue-100 text-blue-800",
    published: "bg-green-100 text-green-800",
    archived: "bg-red-100 text-red-700",
};

const labels: Record<CMSStatus, string> = {
    draft: "Draft",
    review: "In Review",
    approved: "Approved",
    published: "Published",
    archived: "Archived",
};

export function CMSStatusBadge({ status }: { status: string }) {
    const s = status as CMSStatus;
    return (
        <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${styles[s] ?? "bg-gray-100 text-gray-600"
                }`}
        >
            {labels[s] ?? status}
        </span>
    );
}
