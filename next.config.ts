import type { NextConfig } from "next";

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
};

export default nextConfig;
