import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

// This is a one-time setup route to populate initial content
// In production, this should be protected or removed after initial setup

export async function POST() {
  try {
    const supabase = createServerClient();
    
    // Placeholder content - Admin will customize these from /admin/content
    const contents = [
      {
        key: 'terms_of_service',
        value: `<p>This is placeholder content for Terms of Service. Please edit this content from the Admin Content Manager at <strong>/admin/content</strong>.</p>
<p>The full terms will be available here once you customize them through the admin panel.</p>`,
        description: 'Terms of Service - Legal agreement for using GreenLine365'
      },
      {
        key: 'trust_security',
        value: `<p>This is placeholder content for Trust & Security. Please edit this content from the Admin Content Manager at <strong>/admin/content</strong>.</p>
<p>The full security whitepaper will be available here once you customize it through the admin panel.</p>`,
        description: 'Trust & Security - Security architecture and compliance whitepaper'
      },
      {
        key: 'privacy_policy',
        value: `<p>This is placeholder content for Privacy Policy. Please edit this content from the Admin Content Manager at <strong>/admin/content</strong>.</p>
<p>The full privacy policy will be available here once you customize it through the admin panel.</p>`,
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
      message: 'Content population complete',
      results 
    });
    
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to populate content', details: error.message },
      { status: 500 }
    );
  }
}
