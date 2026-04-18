import { draftMode } from "next/headers";
import Link from "next/link";
import { Eye, X } from "lucide-react";

/**
 * Server component: shows a fixed banner when Draft Mode is active.
 * Include in root layout above <Header />.
 */
export async function DraftModeBanner() {
    const dm = await draftMode();
    if (!dm.isEnabled) return null;

    return (
        <div className="sticky top-0 z-[100] flex items-center justify-center gap-3 bg-amber-400 px-4 py-2 text-sm font-medium text-amber-900">
            <Eye className="w-4 h-4 shrink-0" />
            <span>You are previewing draft content</span>
            <Link
                href="/api/draft/disable"
                className="inline-flex items-center gap-1 rounded bg-amber-600 px-2 py-0.5 text-xs text-white hover:bg-amber-700 transition-colors"
            >
                <X className="w-3 h-3" /> Exit Preview
            </Link>
        </div>
    );
}
