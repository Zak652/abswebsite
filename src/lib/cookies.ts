/**
 * Cookie / non-essential storage consent (build guide § 3.9).
 *
 * Today the site sets only first-party essential cookies (`abs_session`
 * and `abs_refresh`), so this module's job is mostly forward-looking
 * scaffolding: it owns the consent state, exposes the `analyticsAllowed`
 * predicate, and surfaces the banner so we don't have to retrofit
 * consent gating later when an analytics or marketing vendor lands.
 *
 * Consent values
 * --------------
 * - `"granted"`: user clicked Accept.
 * - `"denied"`: user clicked Reject.
 * - `null`: user has not made a choice yet (banner still showing).
 *
 * Storage uses ``localStorage`` so the choice persists across
 * sessions on the same browser. We do NOT use a cookie for this
 * because tracking the consent decision in a cookie would itself be
 * a non-essential cookie before consent — circular and gross.
 */

import { useEffect, useState, useSyncExternalStore } from "react";

export type ConsentValue = "granted" | "denied";

const STORAGE_KEY = "abs-cookie-consent";

const CHANGE_EVENT = "abs:cookie-consent-change";

function readStored(): ConsentValue | null {
    if (typeof window === "undefined") return null;
    try {
        const v = window.localStorage.getItem(STORAGE_KEY);
        if (v === "granted" || v === "denied") return v;
        return null;
    } catch {
        return null;
    }
}

export function getConsent(): ConsentValue | null {
    return readStored();
}

export function setConsent(value: ConsentValue): void {
    if (typeof window === "undefined") return;
    try {
        window.localStorage.setItem(STORAGE_KEY, value);
        window.dispatchEvent(new Event(CHANGE_EVENT));
    } catch {
        // localStorage can be disabled (Safari private mode, custom
        // browser settings); the user's preference simply doesn't
        // persist. Loud failure isn't useful here.
    }
}

export function clearConsent(): void {
    if (typeof window === "undefined") return;
    try {
        window.localStorage.removeItem(STORAGE_KEY);
        window.dispatchEvent(new Event(CHANGE_EVENT));
    } catch {
        // see setConsent
    }
}

function subscribe(callback: () => void): () => void {
    if (typeof window === "undefined") return () => undefined;
    window.addEventListener(CHANGE_EVENT, callback);
    window.addEventListener("storage", callback);
    return () => {
        window.removeEventListener(CHANGE_EVENT, callback);
        window.removeEventListener("storage", callback);
    };
}

/**
 * Subscribe to the current consent value. Returns ``null`` until the
 * user makes a choice, then ``"granted"`` or ``"denied"``. Re-renders
 * everywhere the hook is used when the value changes — including in
 * other tabs (via the standard ``storage`` event).
 *
 * Handles SSR: returns ``null`` on the server, hydrates to the stored
 * value on the client. Call sites that gate analytics on
 * ``=== "granted"`` therefore get a safe default.
 */
export function useCookieConsent(): ConsentValue | null {
    const value = useSyncExternalStore(
        subscribe,
        readStored,
        () => null, // server snapshot
    );
    return value;
}

/** Convenience: true only if the user has explicitly opted in. */
export function useAnalyticsAllowed(): boolean {
    return useCookieConsent() === "granted";
}

/**
 * Used by the banner to know whether to render. Wraps useEffect so the
 * banner doesn't flash up on SSR before localStorage hydrates.
 */
export function useShouldShowBanner(): boolean {
    const [hydrated, setHydrated] = useState(false);
    useEffect(() => setHydrated(true), []);
    const consent = useCookieConsent();
    return hydrated && consent === null;
}
