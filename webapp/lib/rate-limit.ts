import { NextRequest, NextResponse } from 'next/server';

interface RateLimitEntry {
  timestamps: number[];
}

// In-memory sliding-window store keyed by IP.
// Automatically evicts expired entries every 5 minutes.
const store = new Map<string, RateLimitEntry>();

let lastCleanup = Date.now();
const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes

function cleanup(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;

  for (const [key, entry] of store) {
    entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);
    if (entry.timestamps.length === 0) store.delete(key);
  }
}

interface RateLimitOptions {
  /** Max requests allowed in the window. */
  max: number;
  /** Window size in milliseconds. Defaults to 60 000 (1 minute). */
  windowMs?: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  /** Retry-After value in seconds (only meaningful when allowed === false). */
  retryAfter: number;
}

/**
 * Check whether the request is within the rate limit.
 *
 * Usage in a route handler:
 * ```ts
 * const { allowed, remaining, retryAfter } = rateLimit(req, { max: 10 });
 * if (!allowed) return rateLimitResponse(retryAfter);
 * ```
 */
export function rateLimit(
  req: NextRequest,
  opts: RateLimitOptions,
): RateLimitResult {
  const { max, windowMs = 60_000 } = opts;
  const now = Date.now();

  cleanup(windowMs);

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown';

  // Scope the key to the route path so different endpoints don't share buckets.
  const key = `${ip}:${req.nextUrl.pathname}`;
  const entry = store.get(key) ?? { timestamps: [] };

  // Drop timestamps outside the current window.
  entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);

  if (entry.timestamps.length >= max) {
    const oldest = entry.timestamps[0];
    const retryAfter = Math.ceil((oldest + windowMs - now) / 1000);
    store.set(key, entry);
    return { allowed: false, remaining: 0, retryAfter };
  }

  entry.timestamps.push(now);
  store.set(key, entry);
  return { allowed: true, remaining: max - entry.timestamps.length, retryAfter: 0 };
}

/**
 * Return a standard 429 JSON response with Retry-After header.
 */
export function rateLimitResponse(retryAfter: number): NextResponse {
  return NextResponse.json(
    { error: 'Too many requests. Please try again later.' },
    {
      status: 429,
      headers: { 'Retry-After': String(retryAfter) },
    },
  );
}
