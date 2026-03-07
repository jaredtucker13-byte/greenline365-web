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
 * Require admin-level access.
 * Checks the `is_admin` flag on the profiles table.
 */
export async function requireAdmin(): Promise<
  | { user: { id: string; email?: string; user_metadata: Record<string, unknown> }; error?: never }
  | { user?: never; error: NextResponse }
> {
  const auth = await requireAuth();
  if (auth.error) return auth;

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', auth.user.id)
    .single();

  if (!profile?.is_admin) {
    return {
      error: NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      ),
    };
  }

  return { user: auth.user };
}

/**
 * Check if the current user is an admin (non-throwing helper).
 * Returns the is_admin boolean without returning an error response.
 */
export async function checkIsAdmin(userId: string): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', userId)
      .single();
    return profile?.is_admin === true;
  } catch {
    return false;
  }
}
