"use client";

import { useState } from "react";
import { useDeleteMyAccount, useExportMyData } from "@/lib/hooks/useAuth";
import { useAuthStore } from "@/lib/store/authStore";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { parseApiError } from "@/lib/api/errors";

const DELETE_CONFIRM_PHRASE = "delete my account";

export function AccountPanel() {
    const { user } = useAuthStore();
    const exportMutation = useExportMyData();
    const deleteMutation = useDeleteMyAccount();
    const [confirmText, setConfirmText] = useState("");
    const [showConfirm, setShowConfirm] = useState(false);

    const onExport = () => {
        exportMutation.mutate(undefined, {
            onSuccess: (data) => {
                // Trigger a browser download — we never round-trip the data
                // through any third party.
                const blob = new Blob([JSON.stringify(data, null, 2)], {
                    type: "application/json",
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `abs-data-${new Date().toISOString().slice(0, 10)}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            },
        });
    };

    const exportError = exportMutation.error
        ? parseApiError(exportMutation.error).message
        : null;
    const deleteError = deleteMutation.error
        ? parseApiError(deleteMutation.error).message
        : null;

    return (
        <div className="flex flex-col gap-6">
            {/* Profile summary */}
            <section className="bg-white rounded-xl border border-neutral-200 p-5">
                <h2 className="text-sm font-semibold text-primary-900 mb-3">
                    Profile
                </h2>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div>
                        <dt className="text-xs text-neutral-400">Email</dt>
                        <dd className="text-neutral-900">{user?.email ?? "—"}</dd>
                    </div>
                    <div>
                        <dt className="text-xs text-neutral-400">Full name</dt>
                        <dd className="text-neutral-900">{user?.full_name ?? "—"}</dd>
                    </div>
                    <div>
                        <dt className="text-xs text-neutral-400">Company</dt>
                        <dd className="text-neutral-900">{user?.company_name ?? "—"}</dd>
                    </div>
                    <div>
                        <dt className="text-xs text-neutral-400">Email verified</dt>
                        <dd className="text-neutral-900">
                            {user?.email_verified ? "Yes" : "No"}
                        </dd>
                    </div>
                </dl>
            </section>

            {/* Export */}
            <section className="bg-white rounded-xl border border-neutral-200 p-5">
                <h2 className="text-sm font-semibold text-primary-900 mb-1">
                    Download your data
                </h2>
                <p className="text-xs text-neutral-500 mb-4">
                    Get a JSON file containing every record we have linked to your
                    account — profile, quotes, subscriptions, training, and
                    activity log. Useful for your records, or to bring with you if
                    you decide to delete the account.
                </p>
                {exportError && (
                    <p role="alert" className="text-xs text-red-600 mb-3">
                        {exportError}
                    </p>
                )}
                <button
                    type="button"
                    onClick={onExport}
                    disabled={exportMutation.isPending}
                    className="text-xs px-3 py-1.5 rounded-lg bg-primary-900 text-white font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors flex items-center gap-2 w-fit"
                >
                    {exportMutation.isPending ? (
                        <>
                            <LoadingSpinner size="sm" />
                            Preparing…
                        </>
                    ) : (
                        "Download JSON"
                    )}
                </button>
            </section>

            {/* Delete */}
            <section className="bg-white rounded-xl border border-red-200 p-5">
                <h2 className="text-sm font-semibold text-red-700 mb-1">
                    Delete account
                </h2>
                <p className="text-xs text-neutral-500 mb-4">
                    Permanently anonymise your profile and unlink it from every
                    record. Active trials will be cancelled. Financial and
                    compliance records are retained without your personal
                    information attached. <strong>This cannot be undone.</strong>
                </p>

                {!showConfirm ? (
                    <button
                        type="button"
                        onClick={() => setShowConfirm(true)}
                        className="text-xs font-medium text-red-600 hover:text-red-700 underline underline-offset-4 transition-colors"
                    >
                        I want to delete my account
                    </button>
                ) : (
                    <div className="border-t border-neutral-200 pt-4 mt-2">
                        <label
                            htmlFor="delete-confirm"
                            className="block text-xs font-medium text-neutral-700 mb-1"
                        >
                            Type <code className="px-1 py-0.5 rounded bg-neutral-100 text-red-700">{DELETE_CONFIRM_PHRASE}</code> to confirm
                        </label>
                        <input
                            id="delete-confirm"
                            type="text"
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                            className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-red-500 mb-3"
                            placeholder={DELETE_CONFIRM_PHRASE}
                        />
                        {deleteError && (
                            <p role="alert" className="text-xs text-red-600 mb-3">
                                {deleteError}
                            </p>
                        )}
                        <div className="flex items-center justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowConfirm(false);
                                    setConfirmText("");
                                    deleteMutation.reset();
                                }}
                                className="text-xs px-3 py-1.5 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition-colors"
                                disabled={deleteMutation.isPending}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => deleteMutation.mutate()}
                                disabled={
                                    deleteMutation.isPending ||
                                    confirmText.trim().toLowerCase() !== DELETE_CONFIRM_PHRASE
                                }
                                className="text-xs px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {deleteMutation.isPending ? "Deleting…" : "Delete account"}
                            </button>
                        </div>
                    </div>
                )}
            </section>
        </div>
    );
}
