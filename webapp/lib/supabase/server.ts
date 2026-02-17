import { createServerClient as createSupabaseServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient as createSupabaseClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Server-side Supabase client for Server Components and Route Handlers
// Uses cookies to maintain session state
export async function createClient() {
  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createSupabaseServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  });
}

// Legacy export name for backward compatibility with existing API routes
// Returns a simple Supabase client with service role (bypasses RLS)
export function createServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  return createSupabaseClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Alias for admin operations
export const createAdminClient = createServerClient;

// ─── Auth Helpers ────────────────────────────────────────
// Replaces repeated getUser() + 401/403 boilerplate in API routes.
//
// Usage:
//   const auth = await requireAuth();
//   if (isAuthError(auth)) return auth;
//   const { user, supabase } = auth;

export interface AuthResult {
  user: User;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, 'public', any>;
}

export interface AdminAuthResult extends AuthResult {
  profile: { is_admin: boolean };
}

/**
 * Type guard: returns true if the result is a NextResponse (auth error).
 */
export function isAuthError(
  result: AuthResult | AdminAuthResult | NextResponse
): result is NextResponse {
  return result instanceof NextResponse;
}

/**
 * Requires an authenticated user. Returns { user, supabase } or a 401 NextResponse.
 */
export async function requireAuth(): Promise<AuthResult | NextResponse> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return { user, supabase };
}

/**
 * Requires an authenticated admin user. Returns { user, supabase, profile } or a 401/403 NextResponse.
 */
export async function requireAdmin(): Promise<AdminAuthResult | NextResponse> {
  const authResult = await requireAuth();
  if (isAuthError(authResult)) return authResult;

  const { user, supabase } = authResult;
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) {
    return NextResponse.json(
      { error: 'Admin access required' },
      { status: 403 }
    );
  }

  return { user, supabase, profile };
}
