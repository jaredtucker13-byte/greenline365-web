import { NextRequest, NextResponse } from 'next/server';

/**
 * Distributed Rate Limiter
 *
 * Uses Redis (via Upstash REST API) when UPSTASH_REDIS_REST_URL is set.
 * Falls back to in-memory sliding window for local dev or single-instance deployments.
 *
 * The in-memory fallback is NOT safe for multi-instance (Vercel auto-scale) —
 * set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN for production.
 */

// ── Redis helpers (zero-dependency, uses Upstash REST API) ──────────────
const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const useRedis = !!(REDIS_URL && REDIS_TOKEN);

async function redisEval(
  script: string,
  keys: string[],
  args: (string | number)[],
): Promise<number[]> {
  const res = await fetch(`${REDIS_URL}/eval`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${REDIS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([script, keys.length, ...keys, ...args]),
  });
  const data = await res.json();
  return data.result as number[];
}

// Lua script: sliding-window rate limiter (atomic)
const SLIDING_WINDOW_LUA = `
local key = KEYS[1]
local max = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local now = tonumber(ARGV[3])

redis.call('ZREMRANGEBYSCORE', key, 0, now - window)
local count = redis.call('ZCARD', key)

if count < max then
  redis.call('ZADD', key, now, now .. ':' .. math.random(1000000))
  redis.call('PEXPIRE', key, window)
  return {1, max - count - 1, 0}
else
  local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
  local retryAfter = 0
  if #oldest >= 2 then
    retryAfter = math.ceil((tonumber(oldest[2]) + window - now) / 1000)
  end
  return {0, 0, retryAfter}
end
`;

// ── In-memory fallback ──────────────────────────────────────────────────
interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();
let lastCleanup = Date.now();
const CLEANUP_INTERVAL = 5 * 60 * 1000;

function cleanup(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, entry] of store) {
    entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);
    if (entry.timestamps.length === 0) store.delete(key);
  }
}

function memoryRateLimit(key: string, max: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  cleanup(windowMs);

  const entry = store.get(key) ?? { timestamps: [] };
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

// ── Public API ──────────────────────────────────────────────────────────

export interface RateLimitOptions {
  /** Max requests allowed in the window. */
  max: number;
  /** Window size in milliseconds. Defaults to 60 000 (1 minute). */
  windowMs?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  /** Retry-After value in seconds (only meaningful when allowed === false). */
  retryAfter: number;
}

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  );
}

/**
 * Check whether the request is within the rate limit.
 *
 * Uses Redis when available, falls back to in-memory.
 *
 * ```ts
 * const { allowed, remaining, retryAfter } = await rateLimit(req, { max: 10 });
 * if (!allowed) return rateLimitResponse(retryAfter);
 * ```
 */
export function rateLimit(
  req: NextRequest,
  opts: RateLimitOptions,
): RateLimitResult {
  const { max, windowMs = 60_000 } = opts;
  const ip = getClientIp(req);
  const key = `rl:${ip}:${req.nextUrl.pathname}`;

  // Synchronous in-memory path (always available, used as fallback)
  return memoryRateLimit(key, max, windowMs);
}

/**
 * Async version that uses Redis when available. Prefer this in new code.
 */
export async function rateLimitAsync(
  req: NextRequest,
  opts: RateLimitOptions,
): Promise<RateLimitResult> {
  const { max, windowMs = 60_000 } = opts;
  const ip = getClientIp(req);
  const key = `rl:${ip}:${req.nextUrl.pathname}`;

  if (useRedis) {
    try {
      const [allowed, remaining, retryAfter] = await redisEval(
        SLIDING_WINDOW_LUA,
        [key],
        [max, windowMs, Date.now()],
      );
      return {
        allowed: allowed === 1,
        remaining,
        retryAfter,
      };
    } catch (err) {
      // Redis down — fall back to in-memory
      console.warn('[RateLimit] Redis unavailable, using in-memory fallback');
    }
  }

  return memoryRateLimit(key, max, windowMs);
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
