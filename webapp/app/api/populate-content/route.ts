import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createClient } from '@/lib/supabase/server';

// This is a one-time setup route to populate initial content
// SECURED: Requires authenticated superadmin user

export async function POST() {
    try {
          // Auth check: verify the caller is authenticated
      const supabaseAuth = await createClient();
          const { data: { user } } = await supabaseAuth.auth.getUser();

      if (!user) {
              return NextResponse.json(
                { error: 'Unauthorized - authentication required' },
                { status: 401 }
                      );
      }

      // Check if user is an admin via profiles table
      const supabase = createServerClient();
          const { data: adminCheck } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', user.id)
            .single();

      if (!adminCheck?.is_admin) {
              return NextResponse.json(
                { error: 'Forbidden - superadmin access required' },
                { status: 403 }
                      );
      }

      // Placeholder content - Admin will customize these from /admin/content
      const contents = [
        {
                  key: 'terms_of_service',
                  value: '<p>This is placeholder content for Terms of Service. Please edit this content from the Admin Content Manager at <strong>/admin/content</strong>.</p>\n<p>The full terms will be available here once you customize them through the admin panel.</p>',
                  description: 'Terms of Service - Legal agreement for using GreenLine365'
        },
        {
                  key: 'trust_security',
                  value: '<p>This is placeholder content for Trust & Security. Please edit this content from the Admin Content Manager at <strong>/admin/content</strong>.</p>\n<p>The full security whitepaper will be available here once you customize it through the admin panel.</p>',
                  description: 'Trust & Security - Security architecture and compliance whitepaper'
        },
        {
                  key: 'privacy_policy',
                  value: '<p>This is placeholder content for Privacy Policy. Please edit this content from the Admin Content Manager at <strong>/admin/content</strong>.</p>\n<p>The full privacy policy will be available here once you customize it through the admin panel.</p>',
                  description: 'Privacy Policy - How we collect, use, and protect user data'
        }
            ];

      const results = [];

      for (const content of contents) {
              const { data, error } = await supabase
                .from('site_content')
                .upsert(content, { onConflict: 'key' })
                .select()
                .single();

            if (error) {
                      results.push({ key: content.key, status: 'error', message: error.message });
            } else {
                      results.push({ key: content.key, status: 'success', data });
            }
      }

      return NextResponse.json({
              message: 'Content populated successfully',
              results
      });

    } catch (error: any) {
          console.error('Error populating content:', error);
          return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
                );
    }
}
