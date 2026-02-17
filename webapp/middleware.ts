import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

function generateRequestId(): string {
  // crypto.randomUUID() is available in Edge Runtime
  return crypto.randomUUID();
}

// ─── Inline Edge-compatible rate limiter ────────────────────────────
// In-memory sliding window per edge instance. For distributed limiting
// across multiple Vercel instances, upgrade to Upstash Redis.
interface RateLimitEntry { count: number; resetAt: number; }
const rateLimitStore = new Map<string, RateLimitEntry>();
let lastCleanup = Date.now();

function rateLimitCheck(ip: string, prefix: string, windowMs: number, max: number): NextResponse | null {
  const now = Date.now();
  // Periodic cleanup
  if (now - lastCleanup > 60_000) {
    lastCleanup = now;
    for (const [k, v] of rateLimitStore) {
      if (now >= v.resetAt) rateLimitStore.delete(k);
    }
  }

  const key = `${prefix}:${ip}`;
  const entry = rateLimitStore.get(key);

  if (!entry || now >= entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
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
        },
      }
    );
  }
  return null;
}

// Rate limit rules for public API routes:
// [pathPrefix, windowMs, maxRequests]
const RATE_LIMIT_RULES: [string, number, number][] = [
  ['/api/send-otp',    60_000,  5],   // OTP: 5 per minute
  ['/api/verify-otp',  60_000,  10],  // OTP verify: 10 per minute
  ['/api/newsletter',  60_000,  5],   // Newsletter signup: 5 per minute
  ['/api/chat',        60_000,  15],  // AI chat: 15 per minute
  ['/api/contact',     60_000,  5],   // Contact form: 5 per minute
  ['/api/directory/feedback', 60_000, 10], // Feedback: 10 per minute
  ['/api/directory/reviews',  60_000, 10], // Reviews: 10 per minute
  ['/api/stripe/checkout',    60_000, 5],  // Payment: 5 per minute
  ['/api/redeem-code', 60_000,  5],   // Code redemption: 5 per minute
];
// ────────────────────────────────────────────────────────────────────

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Attach correlation ID to every request for traceability
  const requestId = request.headers.get('x-request-id') || generateRequestId();

  // Define protected routes that need auth
  const isProtectedRoute = pathname.startsWith('/admin-v2') || pathname.startsWith('/admin') || pathname === '/business-dashboard' || pathname === '/onboarding';
  const isLoginPage = pathname === '/login';
  const isApiRoute = pathname.startsWith('/api');

  // Rate limit public API routes
  if (isApiRoute) {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';

    for (const [pathPrefix, windowMs, max] of RATE_LIMIT_RULES) {
      if (pathname.startsWith(pathPrefix)) {
        const limited = rateLimitCheck(ip, pathPrefix, windowMs, max);
        if (limited) {
          limited.headers.set('x-request-id', requestId);
          return limited;
        }
        break;
      }
    }
  }

  // API routes and public pages: attach correlation ID, skip auth
  if (isApiRoute || (!isProtectedRoute && !isLoginPage)) {
    const response = NextResponse.next();
    response.headers.set('x-request-id', requestId);
    return response;
  }

  // Protected routes + login page: check auth via Supabase
  try {
    const { user, supabaseResponse } = await updateSession(request);

    // Always attach correlation ID
    supabaseResponse.headers.set('x-request-id', requestId);

    if (isProtectedRoute && !user) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirectTo', pathname);
      const redirect = NextResponse.redirect(loginUrl);
      redirect.headers.set('x-request-id', requestId);
      return redirect;
    }

    if (isLoginPage && user) {
      const redirectTo = request.nextUrl.searchParams.get('redirectTo') || '/admin-v2';
      const redirect = NextResponse.redirect(new URL(redirectTo, request.url));
      redirect.headers.set('x-request-id', requestId);
      return redirect;
    }

    return supabaseResponse;
  } catch {
    // If Supabase times out, let the request through rather than 504
    if (isProtectedRoute) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirectTo', pathname);
      const redirect = NextResponse.redirect(loginUrl);
      redirect.headers.set('x-request-id', requestId);
      return redirect;
    }
    const response = NextResponse.next();
    response.headers.set('x-request-id', requestId);
    return response;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
