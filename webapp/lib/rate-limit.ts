import { NextRequest, NextResponse } from 'next/server';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

/**
 * Simple in-memory sliding window rate limiter.
 *
 * Works per-serverless-instance. For distributed rate limiting across
 * multiple Vercel instances, upgrade to a Redis-backed solution (e.g. Upstash).
 *
 * Usage:
 *   const limiter = createRateLimiter({ windowMs: 60_000, max: 10 });
 *
 *   export async function POST(request: NextRequest) {
 *     const limited = limiter.check(request);
 *     if (limited) return limited;
 *     // ... handle request
 *   }
 */

const store = new Map<string, RateLimitEntry>();

// Periodically clean up expired entries to prevent memory leaks
const CLEANUP_INTERVAL = 60_000;
let lastCleanup = Date.now();

function cleanup(now: number) {
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, entry] of store) {
    if (now >= entry.resetAt) {
      store.delete(key);
    }
  }
}

interface RateLimiterOptions {
  /** Time window in milliseconds (default: 60_000 = 1 minute) */
  windowMs?: number;
  /** Max requests per window (default: 20) */
  max?: number;
  /** Prefix for the key namespace to separate limiters */
  prefix?: string;
}

export function createRateLimiter(options: RateLimiterOptions = {}) {
  const { windowMs = 60_000, max = 20, prefix = 'rl' } = options;

  return {
    /**
     * Check if the request should be rate limited.
     * Returns a 429 Response if limited, or null if the request is allowed.
     */
    check(request: NextRequest): NextResponse | null {
      const now = Date.now();
      cleanup(now);

      // Use IP + path as the rate limit key
      const ip =
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        request.headers.get('x-real-ip') ||
        'unknown';
      const key = `${prefix}:${ip}`;

      const entry = store.get(key);

      if (!entry || now >= entry.resetAt) {
        // Start a new window
        store.set(key, { count: 1, resetAt: now + windowMs });
        return null;
      }

      entry.count++;

      if (entry.count > max) {
        const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
        return NextResponse.json(
          { error: 'Too many requests. Please try again later.' },
          {
            status: 429,
            headers: {
              'Retry-After': String(retryAfter),
              'X-RateLimit-Limit': String(max),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': new Date(entry.resetAt).toISOString(),
            },
          }
        );
      }

      return null;
    },
  };
}
