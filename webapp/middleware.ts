import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Update the Supabase session and get the user
  const { user, supabaseResponse } = await updateSession(request);

  // Define protected routes
  const isProtectedRoute = pathname.startsWith('/admin-v2') || pathname.startsWith('/admin');

  // If accessing a protected route without being authenticated, redirect to login
  if (isProtectedRoute && !user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If user is logged in and trying to access login page, redirect to dashboard
  if (pathname === '/login' && user) {
    const redirectTo = request.nextUrl.searchParams.get('redirectTo') || '/admin-v2';
    return NextResponse.redirect(new URL(redirectTo, request.url));
  }

  return supabaseResponse;
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
