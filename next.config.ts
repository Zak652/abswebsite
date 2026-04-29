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

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // AWS S3 buckets (any region)
      {
        protocol: "https",
        hostname: "**.amazonaws.com",
        pathname: "/**",
      },
      // Cloudflare R2 / Workers
      {
        protocol: "https",
        hostname: "**.r2.cloudflarestorage.com",
        pathname: "/**",
      },
      // Generic CDN subdomain pattern (e.g. cdn.absplatform.com)
      {
        protocol: "https",
        hostname: "cdn.absplatform.com",
        pathname: "/**",
      },
      // Allow local dev images
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
};

export default nextConfig;
