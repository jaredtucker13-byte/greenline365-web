import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const accountType = requestUrl.searchParams.get('account_type');
  const origin = requestUrl.origin;
  const rawNext = requestUrl.searchParams.get('next') ?? '';
  // Prevent open redirect: ensure next is a relative path, not an absolute URL
  const next = (rawNext.startsWith('/') && !rawNext.startsWith('//')) ? rawNext : '';

  if (code) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseAnonKey) {
      const cookieStore = await cookies();

      const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
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
            }
          },
        },
      });

      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error('Auth callback error:', error);
        return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
      }

      // If a custom next URL was provided, use it
      if (next) {
        return NextResponse.redirect(`${origin}${next}`);
      }

      // Look up the user's profile to determine redirect
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // If this is a new Google OAuth user, set account_type from query param
        if (accountType) {
          await supabase
            .from('profiles')
            .update({ account_type: accountType })
            .eq('id', user.id);
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('account_type, email_verified, is_admin')
          .eq('id', user.id)
          .single();

        if (profile) {
          // Check email verification first
          if (!profile.email_verified) {
            // For Google OAuth, auto-verify since Google already verified the email
            await supabase
              .from('profiles')
              .update({ email_verified: true, updated_at: new Date().toISOString() })
              .eq('id', user.id);

            // Link consumer_profiles if one exists
            await supabase
              .from('consumer_profiles')
              .update({ user_id: user.id })
              .eq('email', user.email)
              .is('user_id', null);
          }

          // Route based on account type
          if (profile.is_admin) {
            return NextResponse.redirect(`${origin}/admin-v2`);
          } else if (profile.account_type === 'business') {
            return NextResponse.redirect(`${origin}/admin-v2`);
          } else {
            return NextResponse.redirect(`${origin}/portal/consumer`);
          }
        }
      }
    }
  }

  // Default fallback
  return NextResponse.redirect(`${origin}/admin-v2`);
}
