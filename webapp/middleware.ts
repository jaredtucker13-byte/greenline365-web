import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // TEMPORARILY DISABLED for testing
  // Authentication will be properly configured after testing
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin-v2/:path*',
    '/admin/:path*',
  ],
};
