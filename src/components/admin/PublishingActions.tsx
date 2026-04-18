"use client";

import { useState } from "react";
import { Calendar, Clock } from "lucide-react";
import type { TransitionRequest } from "@/types/cms";

type CMSStatus = "draft" | "review" | "approved" | "published" | "archived";

const TRANSITIONS: Record<CMSStatus, { action: TransitionRequest["action"]; label: string; className: string }[]> = {
    draft: [
        { action: "submit", label: "Submit for Review", className: "bg-yellow-500 hover:bg-yellow-600 text-white" },
    ],
    review: [
        { action: "approve", label: "Approve", className: "bg-blue-500 hover:bg-blue-600 text-white" },
    ],
    approved: [
        { action: "publish", label: "Publish Now", className: "bg-green-600 hover:bg-green-700 text-white" },
    ],
    published: [
        { action: "unpublish", label: "Unpublish", className: "bg-gray-500 hover:bg-gray-600 text-white" },
    ],
    archived: [],
};

const ARCHIVE_ACTION = {
    action: "archive" as TransitionRequest["action"],
    label: "Archive",
    className: "border border-red-300 text-red-600 hover:bg-red-50",
};

interface PublishingActionsProps {
    status: string;
    version: number;
    onTransition: (data: TransitionRequest) => void;
    isPending?: boolean;
    scheduledPublishAt?: string | null;
    onViewHistory?: () => void;
}

export function PublishingActions({
    status,
    version,
    onTransition,
    isPending = false,
    scheduledPublishAt,
    onViewHistory,
}: PublishingActionsProps) {
    const [confirming, setConfirming] = useState<string | null>(null);
    const [showSchedule, setShowSchedule] = useState(false);
    const [scheduleDate, setScheduleDate] = useState("");
    const s = status as CMSStatus;
    const transitions = TRANSITIONS[s] ?? [];

    const handleClick = (action: TransitionRequest["action"]) => {
        if (action === "archive" && confirming !== "archive") {
            setConfirming("archive");
            return;
        }
        setConfirming(null);
        onTransition({ action });
    };

    const handleSchedule = () => {
        if (!scheduleDate) return;
        onTransition({ action: "publish", scheduled_publish_at: scheduleDate });
        setShowSchedule(false);
        setScheduleDate("");
    };

    return (
        <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-neutral-400 mr-1">v{version}</span>
            {transitions.map(({ action, label, className }) => (
                <button
                    key={action}
                    onClick={() => handleClick(action)}
                    disabled={isPending}
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50 ${className}`}
                >
                    {label}
                </button>
            ))}
            {/* Schedule publish (only in approved state) */}
            {s === "approved" && (
                <>
                    {showSchedule ? (
                        <div className="flex items-center gap-1.5">
                            <input
                                type="datetime-local"
                                value={scheduleDate}
                                onChange={(e) => setScheduleDate(e.target.value)}
                                className="text-xs border border-neutral-300 rounded-lg px-2 py-1.5 focus:outline-none focus:border-primary-500"
                            />
                            <button
                                onClick={handleSchedule}
                                disabled={!scheduleDate || isPending}
                                className="text-xs px-2 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                            >
                                Schedule
                            </button>
                            <button
                                onClick={() => setShowSchedule(false)}
                                className="text-xs px-2 py-1.5 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                            >
                                Cancel
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setShowSchedule(true)}
                            disabled={isPending}
                            className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 font-medium transition-colors disabled:opacity-50"
                        >
                            <Calendar className="w-3 h-3" />Schedule
                        </button>
                    )}
                </>
            )}
            {/* Show scheduled time if set */}
            {scheduledPublishAt && (
                <span className="inline-flex items-center gap-1 text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                    <Clock className="w-3 h-3" />
                    {new Date(scheduledPublishAt).toLocaleString()}
                </span>
            )}
            {s !== "archived" && (
                <button
                    onClick={() => handleClick("archive")}
                    disabled={isPending}
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50 ${ARCHIVE_ACTION.className}`}
                >
                    {confirming === "archive" ? "Confirm Archive?" : "Archive"}
                </button>
            )}
            {onViewHistory && (
                <button
                    onClick={onViewHistory}
                    className="text-xs text-neutral-400 hover:text-primary-600 ml-auto"
                >
                    History
                </button>
            )}
        </div>
    );
}
