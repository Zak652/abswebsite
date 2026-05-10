"use client";

/**
 * Email-verification banner (build guide § 3.8).
 *
 * Surfaces when an authenticated user hasn't yet verified their
 * email address. Sensitive backend endpoints (account deletion,
 * trial signup, trial cancellation) reject these users with 403 +
 * a curated message — this banner gives them a one-click path to
 * the resolution rather than waiting until the gate fires.
 *
 * Renders nothing if:
 *   - the user isn't authenticated (no banner makes sense before login),
 *   - the user is verified,
 *   - the auth-store is mid-hydration (avoid a momentary banner flicker
 *     while sessionStorage rehydrates).
 */

import { useState } from "react";
import { Mail, X } from "lucide-react";
import { useAuthStore } from "@/lib/store/authStore";
import { useResendEmailVerification } from "@/lib/hooks/useAuth";

export function EmailVerificationBanner() {
    const { isAuthenticated, user } = useAuthStore();
    const [dismissed, setDismissed] = useState(false);
    const [sent, setSent] = useState(false);
    const resend = useResendEmailVerification();

    if (!isAuthenticated || !user) return null;
    if (user.email_verified) return null;
    if (dismissed) return null;

    const handleResend = () => {
        resend.mutate(undefined, {
            onSuccess: () => setSent(true),
        });
    };

    return (
        <div
            role="region"
            aria-label="Email verification required"
            className="bg-amber-50 border-b border-amber-200 px-4 py-3"
        >
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-3 flex-1">
                    <Mail
                        className="w-5 h-5 text-amber-700 shrink-0 mt-0.5 sm:mt-0"
                        aria-hidden
                    />
                    <p className="text-sm text-amber-900">
                        {sent ? (
                            <>
                                <span className="font-medium">Verification email sent.</span>{" "}
                                Check your inbox at <strong>{user.email}</strong>.
                            </>
                        ) : (
                            <>
                                <span className="font-medium">
                                    Please verify your email address.
                                </span>{" "}
                                Some account actions require a verified email. We sent a
                                link to <strong>{user.email}</strong> when you signed up.
                            </>
                        )}
                    </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    {!sent && (
                        <button
                            type="button"
                            onClick={handleResend}
                            disabled={resend.isPending}
                            className="text-xs font-medium text-amber-900 underline underline-offset-4 hover:text-amber-700 disabled:opacity-50 disabled:no-underline"
                        >
                            {resend.isPending ? "Sending…" : "Resend link"}
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => setDismissed(true)}
                        aria-label="Dismiss verification banner"
                        className="p-1 rounded text-amber-800 hover:bg-amber-100"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
