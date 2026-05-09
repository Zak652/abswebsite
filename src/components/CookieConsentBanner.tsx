"use client";

import Link from "next/link";
import { setConsent, useShouldShowBanner } from "@/lib/cookies";

/**
 * Bottom-fixed banner that surfaces the consent choice.
 *
 * Renders nothing on first paint (avoids the SSR flash) and nothing
 * after the user has chosen. Mounted once at the root layout.
 */
export function CookieConsentBanner() {
    const show = useShouldShowBanner();
    if (!show) return null;

    return (
        <div
            role="region"
            aria-label="Cookie consent"
            className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-md z-50 bg-white border border-neutral-200 rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.12)] p-5"
        >
            <h2 className="text-sm font-semibold text-primary-900 mb-1">
                Cookies on absplatform.com
            </h2>
            <p className="text-xs text-neutral-500 mb-4">
                We use only essential cookies to keep you signed in and to keep the
                site secure. We don&apos;t run third-party tracking. If we ever add
                analytics, your choice below decides whether they run for you.{" "}
                <Link href="/privacy" className="text-primary-500 underline hover:no-underline">
                    Learn more
                </Link>
                .
            </p>
            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={() => setConsent("denied")}
                    className="flex-1 text-xs px-3 py-2 rounded-lg border border-neutral-200 text-neutral-700 hover:bg-neutral-50 transition-colors"
                >
                    Reject non-essential
                </button>
                <button
                    type="button"
                    onClick={() => setConsent("granted")}
                    className="flex-1 text-xs px-3 py-2 rounded-lg bg-primary-900 text-white hover:bg-primary-700 transition-colors"
                >
                    Accept all
                </button>
            </div>
        </div>
    );
}
