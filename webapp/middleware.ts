import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get('host') || '';

  // Redirect www to non-www (Supabase CORS only allows greenline365.com)
  if (host.startsWith('www.')) {
    const newUrl = new URL(request.url);
    newUrl.host = host.replace('www.', '');
    return NextResponse.redirect(newUrl, 301);
  }

  // Define protected routes that need auth
  const isProtectedRoute = pathname.startsWith('/admin-v2') || pathname.startsWith('/admin') || pathname === '/business-dashboard' || pathname === '/onboarding';
  const isLoginPage = pathname === '/login';

  // Public pages: skip Supabase entirely — never block public access
  if (!isProtectedRoute && !isLoginPage) {
    return NextResponse.next();
  }

  // Protected routes + login page: check auth via Supabase
  try {
    const { user, supabaseResponse } = await updateSession(request);

    if (isProtectedRoute && !user) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (isLoginPage && user) {
      const redirectTo = request.nextUrl.searchParams.get('redirectTo') || '/admin-v2';
      return NextResponse.redirect(new URL(redirectTo, request.url));
    }

    return supabaseResponse;
  } catch {
    // If Supabase times out, let the request through rather than 504
    if (isProtectedRoute) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
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
     * - API routes (let them handle their own auth)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$|api).*)',
  ],
};
