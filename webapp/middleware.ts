import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // TEMPORARILY DISABLED - Authentication will be added after testing
  // This allows you to access your dashboard without login
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin-v2/:path*',
    '/admin/:path*',
  ],
};
