import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/auth/signout — Server-side sign out
 *
 * Clears the Supabase auth session cookies on the server,
 * ensuring the user is fully logged out regardless of
 * client-side state.
 */
export async function POST() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch (err) {
    console.error('[SignOut] Error:', err);
  }

  // Always return success — the client will redirect
  return NextResponse.json({ success: true });
}
