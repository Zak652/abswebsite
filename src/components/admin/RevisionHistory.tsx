"use client";

import { useState } from "react";
import { History, RotateCcw, ChevronDown, ChevronUp, X } from "lucide-react";
import type { ContentRevisionData } from "@/types/cms";
import { useAdminRevisions, useRollback } from "@/lib/hooks/useCMSAdmin";

interface RevisionHistoryProps {
    contentType: number;
    objectId: string;
    onClose: () => void;
}

const STATUS_COLORS: Record<string, string> = {
    draft: "bg-gray-100 text-gray-700",
    review: "bg-yellow-50 text-yellow-700",
    approved: "bg-blue-50 text-blue-700",
    published: "bg-green-50 text-green-700",
    archived: "bg-red-50 text-red-700",
};

export function RevisionHistory({ contentType, objectId, onClose }: RevisionHistoryProps) {
    const { data: revisions = [], isLoading } = useAdminRevisions(contentType, objectId);
    const rollback = useRollback();
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [rollbackConfirm, setRollbackConfirm] = useState<string | null>(null);

    const handleRollback = (revisionId: string) => {
        rollback.mutate(revisionId, {
            onSuccess: () => {
                setRollbackConfirm(null);
            },
        });
    };

    return (
        <div className="bg-white rounded-xl border border-neutral-200 shadow-lg">
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
                <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-neutral-500" />
                    <h3 className="text-sm font-semibold text-primary-900">Revision History</h3>
                    <span className="text-xs text-neutral-400">({revisions.length})</span>
                </div>
                <button onClick={onClose} className="p-1 rounded text-neutral-400 hover:text-neutral-600">
                    <X className="w-4 h-4" />
                </button>
            </div>

            {isLoading && (
                <div className="flex items-center justify-center h-32 text-neutral-400 text-sm">Loading…</div>
            )}

            {!isLoading && revisions.length === 0 && (
                <div className="flex items-center justify-center h-32 text-neutral-400 text-sm">No revisions yet.</div>
            )}

            {!isLoading && revisions.length > 0 && (
                <div className="divide-y divide-neutral-100 max-h-96 overflow-y-auto">
                    {revisions.map((rev: ContentRevisionData) => (
                        <div key={rev.id} className="px-5 py-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-primary-900">
                                        v{rev.revision_number}
                                    </span>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[rev.status_at_revision] ?? "bg-neutral-100 text-neutral-600"}`}>
                                        {rev.status_at_revision}
                                    </span>
                                    <span className="text-[10px] text-neutral-400">
                                        {new Date(rev.created_at).toLocaleString()}
                                    </span>
                                    {rev.created_by && (
                                        <span className="text-[10px] text-neutral-400">
                                            by {rev.created_by}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-1.5">
                                    {rollbackConfirm === rev.id ? (
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => handleRollback(rev.id)}
                                                disabled={rollback.isPending}
                                                className="text-[10px] px-2 py-1 rounded bg-amber-500 text-white disabled:opacity-50"
                                            >
                                                {rollback.isPending ? "Rolling back…" : "Confirm"}
                                            </button>
                                            <button
                                                onClick={() => setRollbackConfirm(null)}
                                                className="text-[10px] px-2 py-1 rounded border border-neutral-200 text-neutral-600"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setRollbackConfirm(rev.id)}
                                            title={`Rollback to v${rev.revision_number}`}
                                            className="inline-flex items-center gap-1 text-[10px] text-neutral-400 hover:text-amber-600 transition-colors"
                                        >
                                            <RotateCcw className="w-3 h-3" />Rollback
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setExpandedId(expandedId === rev.id ? null : rev.id)}
                                        className="p-1 rounded text-neutral-400 hover:text-neutral-600"
                                    >
                                        {expandedId === rev.id ? (
                                            <ChevronUp className="w-3 h-3" />
                                        ) : (
                                            <ChevronDown className="w-3 h-3" />
                                        )}
                                    </button>
                                </div>
                            </div>
                            {expandedId === rev.id && (
                                <div className="mt-2 bg-neutral-50 rounded-lg p-3 overflow-x-auto">
                                    <pre className="text-[10px] text-neutral-600 font-mono whitespace-pre-wrap">
                                        {JSON.stringify(rev.data, null, 2)}
                                    </pre>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
