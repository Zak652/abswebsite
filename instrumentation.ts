/**
 * Next.js 16 instrumentation entry point.
 *
 * Loads the right Sentry config for the current runtime (node vs edge) so we
 * report errors from server components, route handlers, and the middleware /
 * proxy without having to wire up each surface separately.
 *
 * The browser-side initialisation lives in `instrumentation-client.ts`.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export { captureRequestError as onRequestError } from "@sentry/nextjs";
