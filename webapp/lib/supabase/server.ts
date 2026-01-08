import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Server-side Supabase client with service role for admin operations
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

// Async version for API routes (same as createServerClient but async for consistency)
export async function createClient() {
  return createServerClient();
}
