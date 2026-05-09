/**
 * Constant-time string comparison + simple in-memory sliding-window rate
 * limiter for the Next.js API routes in /api/draft and /api/revalidate.
 *
 * For a single Next.js process this is sufficient. When we move to multiple
 * App Platform instances behind a load balancer, switch to a Redis-backed
 * limiter (Redis is already in the stack via the backend) — see § 2.3.3.
 */

import { timingSafeEqual } from "node:crypto";

export function timingSafeStringEqual(a: string, b: string): boolean {
  // timingSafeEqual requires equal-length buffers. Pad to the longer length
  // with a sentinel byte so we don't leak length via early-return.
  const aBuf = Buffer.from(a, "utf8");
  const bBuf = Buffer.from(b, "utf8");
  if (aBuf.length !== bBuf.length) {
    // Still compare a same-length buffer to keep timing flat.
    const dummy = Buffer.alloc(aBuf.length);
    timingSafeEqual(aBuf, dummy);
    return false;
  }
  return timingSafeEqual(aBuf, bBuf);
}

interface Bucket {
  hits: number[];
}

const buckets = new Map<string, Bucket>();

export function consumeRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): boolean {
  const now = Date.now();
  const cutoff = now - windowMs;
  const bucket = buckets.get(key) ?? { hits: [] };
  bucket.hits = bucket.hits.filter((t) => t >= cutoff);
  if (bucket.hits.length >= limit) {
    buckets.set(key, bucket);
    return false;
  }
  bucket.hits.push(now);
  buckets.set(key, bucket);
  return true;
}

export function clientIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    return xff.split(",")[0].trim();
  }
  return (
    request.headers.get("x-real-ip") ??
    request.headers.get("cf-connecting-ip") ??
    "anon"
  );
}
