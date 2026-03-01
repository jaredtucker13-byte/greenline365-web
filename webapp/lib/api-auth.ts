import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Shared API route authentication helper.
 * Returns the authenticated user or a 401 JSON response.
 *
 * Usage in API routes:
 *   const auth = await requireAuth();
 *   if (auth.error) return auth.error;
 *   const user = auth.user;
 */
export async function requireAuth(): Promise<
  | { user: { id: string; email?: string; user_metadata: Record<string, unknown> }; error?: never }
  | { user?: never; error: NextResponse }
> {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return {
        error: NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        ),
      };
    }

    return { user };
  } catch {
    return {
      error: NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      ),
    };
  }
}

/**
 * Require admin-level access (super_admin role).
 */
export async function requireAdmin(): Promise<
  | { user: { id: string; email?: string; user_metadata: Record<string, unknown> }; error?: never }
  | { user?: never; error: NextResponse }
> {
  const auth = await requireAuth();
  if (auth.error) return auth;

  if (auth.user.user_metadata?.role !== 'super_admin') {
    return {
      error: NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      ),
    };
  }

  return { user: auth.user };
}
