"use client";

import { ExternalLink } from "lucide-react";

interface PreviewButtonProps {
    slug: string;
    label?: string;
}

/**
 * Opens the page in a new tab with Draft Mode enabled.
 * Requires NEXT_PUBLIC_DRAFT_SECRET env var.
 */
export function PreviewButton({ slug, label = "Preview" }: PreviewButtonProps) {
    const secret = process.env.NEXT_PUBLIC_DRAFT_SECRET;
    if (!secret) return null;

    const href = `/api/draft?secret=${encodeURIComponent(secret)}&slug=${encodeURIComponent(slug)}`;

    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-800 font-medium transition-colors"
        >
            <ExternalLink className="w-3 h-3" />
            {label}
        </a>
    );
}
