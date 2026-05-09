/**
 * Safe redirect helper.
 *
 * Why this exists
 * ---------------
 * Hard-coded `window.location.href = userControlled` is the classic
 * open-redirect vector. Even our two current call sites (the 401
 * interceptor in `lib/api/client.ts` and the Flutterwave checkout
 * hand-off in `useTraining.ts`) carry that risk if a future change ever
 * pipes user input — a `?next=` query param, a CMS-driven URL, a
 * webhook response — into them. Routing every redirect through
 * `safeRedirect()` makes the policy auditable and the failure mode
 * obvious: the navigation is rejected and we land at `/`.
 *
 * Allowed targets
 * ---------------
 * - Internal paths: must start with `/` and must NOT start with `//`
 *   (protocol-relative — `//evil.com/...` would navigate off-site).
 * - External URLs: parsed via `new URL(...)`; the `host` must appear in
 *   the explicit allowlist below. Any other origin is rejected.
 *
 * Anything else collapses to a hard navigation to `/`. We intentionally
 * do not attempt to "fix up" malformed input — silently rewriting a
 * suspicious URL is worse than a visible reject.
 */

const EXTERNAL_HOST_ALLOWLIST: readonly string[] = [
  // Flutterwave hosted checkout — the only external destination we
  // currently hand off to (training payment flow).
  "checkout.flutterwave.com",
  "ravesandboxapi.flutterwave.com",
  "ravemodal-dev.herokuapp.com",
];

export function isInternalPath(target: string): boolean {
  if (typeof target !== "string" || target.length === 0) return false;
  // Reject protocol-relative URLs ("//evil.com/foo") — they navigate
  // cross-origin while looking like an internal path.
  if (target.startsWith("//")) return false;
  return target.startsWith("/");
}

export function isAllowedExternalUrl(target: string): boolean {
  if (typeof target !== "string") return false;
  try {
    const url = new URL(target);
    if (url.protocol !== "https:" && url.protocol !== "http:") return false;
    return EXTERNAL_HOST_ALLOWLIST.includes(url.host);
  } catch {
    return false;
  }
}

export function isSafeRedirectTarget(target: string): boolean {
  return isInternalPath(target) || isAllowedExternalUrl(target);
}

/**
 * Navigate the browser to ``target`` if it passes the policy check.
 *
 * On reject, navigates to ``/`` and warns to console — the user lands
 * somewhere safe and the dev gets a signal that an unsafe URL slipped
 * into a redirect call site.
 *
 * Returns ``true`` if the redirect was performed, ``false`` if it was
 * rejected. Mostly useful for tests; callers usually ignore the value.
 */
export function safeRedirect(target: string): boolean {
  if (typeof window === "undefined") return false;
  if (isSafeRedirectTarget(target)) {
    window.location.href = target;
    return true;
  }
  // eslint-disable-next-line no-console
  console.warn("safeRedirect: rejected target", target);
  window.location.href = "/";
  return false;
}
