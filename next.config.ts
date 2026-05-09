import type { NextConfig } from "next";

/** Origin of the Django backend used for /media/* and (optionally) for the
 *  API. Falls back to localhost:8000 for dev. */
const BACKEND_ORIGIN = (() => {
  const raw =
    process.env.NEXT_PUBLIC_BACKEND_ORIGIN ??
    process.env.BACKEND_ORIGIN ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:8000/api/v1";
  // If someone provided the API URL, strip the /api/v1 suffix to get origin.
  return raw.replace(/\/api\/v\d+\/?$/, "").replace(/\/$/, "");
})();

const isProd = process.env.NODE_ENV === "production";

// connect-src: include the API origin (prod) or both dev origins so fetches
// don't get blocked. NEXT_PUBLIC_API_URL is the canonical client-facing URL.
const apiOrigin = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/v\d+\/?$/, "").replace(/\/$/, "")
  ?? BACKEND_ORIGIN;

const cspProd = [
  "default-src 'self'",
  // Next.js + framer-motion currently need 'unsafe-inline' for hydration scripts
  // and inlined critical CSS. Tighten with nonces in P1.
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://*.r2.cloudflarestorage.com https://media.absplatform.com",
  `connect-src 'self' ${apiOrigin} https://api.flutterwave.com`,
  "frame-src https://checkout.flutterwave.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self' https://checkout.flutterwave.com",
].join("; ");

// Looser CSP in dev so HMR (websockets, eval) and turbopack work. Still
// blocks the obvious XSS sinks.
const cspDev = [
  "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: ws: wss: http://localhost:* http://127.0.0.1:*",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: isProd ? cspProd : cspDev },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "same-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  // Cross-origin isolation defaults — relax per-route if a third-party widget
  // needs popups or cross-origin resources.
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Cloudflare R2 (decided 2026-05-08, see docs/ABS_BUILD_GUIDE.md § 3.7)
      {
        protocol: "https",
        hostname: "**.r2.cloudflarestorage.com",
        pathname: "/**",
      },
      // Cloudflare-proxied media subdomain (set up in production)
      {
        protocol: "https",
        hostname: "media.absplatform.com",
        pathname: "/**",
      },
      // Allow local dev images (Django /media/* via rewrite below)
      {
        protocol: "http",
        hostname: "localhost",
        pathname: "/**",
      },
    ],
  },
  /** Proxy /media/* to the Django backend so admins can paste relative
   *  /media/... paths in CMS data and have them resolve from the frontend
   *  origin. In production swap to a CDN URL or set BACKEND_ORIGIN. */
  async rewrites() {
    return [
      {
        source: "/media/:path*",
        destination: `${BACKEND_ORIGIN}/media/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
