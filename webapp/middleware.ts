import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Check for Supabase auth cookies
  const token = request.cookies.get('sb-access-token')?.value || 
                request.cookies.get('supabase-auth-token')?.value;
  
  // Get all cookies that might contain session info
  const allCookies = request.cookies.getAll();
  const hasAuthCookie = allCookies.some(cookie => 
    cookie.name.includes('sb-') || 
    cookie.name.includes('supabase') ||
    cookie.name.includes('auth-token')
  );

  // Protected routes - require authentication
  if (request.nextUrl.pathname.startsWith('/admin-v2') || request.nextUrl.pathname.startsWith('/admin')) {
    // If no auth cookies found, redirect to login
    if (!hasAuthCookie && !token) {
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin-v2/:path*',
    '/admin/:path*',
  ],
};
