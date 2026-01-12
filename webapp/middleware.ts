import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Protected routes
  if (pathname.startsWith('/admin-v2') || pathname.startsWith('/admin')) {
    // Check for Supabase session cookie
    const supabaseAuthCookie = request.cookies.getAll().find(cookie => 
      cookie.name.startsWith('sb-') && cookie.name.endsWith('-auth-token')
    );
    
    // If no auth cookie, redirect to login
    if (!supabaseAuthCookie || !supabaseAuthCookie.value) {
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(redirectUrl);
    }
    
    // Try to parse the cookie to verify it's valid
    try {
      const sessionData = JSON.parse(supabaseAuthCookie.value);
      
      // Check if session exists and is not expired
      if (!sessionData || !sessionData.access_token) {
        const redirectUrl = new URL('/login', request.url);
        redirectUrl.searchParams.set('redirectTo', pathname);
        return NextResponse.redirect(redirectUrl);
      }
      
      // Check expiration
      if (sessionData.expires_at) {
        const expiresAt = sessionData.expires_at * 1000; // Convert to ms
        if (Date.now() >= expiresAt) {
          const redirectUrl = new URL('/login', request.url);
          redirectUrl.searchParams.set('redirectTo', pathname);
          return NextResponse.redirect(redirectUrl);
        }
      }
    } catch (e) {
      // If cookie is invalid, redirect to login
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('redirectTo', pathname);
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
