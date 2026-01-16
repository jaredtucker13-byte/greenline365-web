import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Site Content API
 * 
 * Manages editable content regions for public pages
 * 
 * GET /api/site-content?page=home - Get all content for a page
 * POST /api/site-content - Update a content region
 */

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const pageSlug = searchParams.get('page');
    const businessId = searchParams.get('businessId');

    if (!pageSlug) {
      return NextResponse.json({ error: 'page parameter required' }, { status: 400 });
    }

    // Get business-specific content first, then fall back to global
    let query = supabase
      .from('site_content')
      .select('*')
      .eq('page_slug', pageSlug);

    if (businessId) {
      // Get business-specific overrides
      const { data: businessContent } = await supabase
        .from('site_content')
        .select('*')
        .eq('page_slug', pageSlug)
        .eq('business_id', businessId);

      // Get global defaults
      const { data: globalContent } = await supabase
        .from('site_content')
        .select('*')
        .eq('page_slug', pageSlug)
        .is('business_id', null);

      // Merge: business content overrides global
      const contentMap = new Map();
      
      // Add global first
      globalContent?.forEach(item => {
        contentMap.set(item.region_key, item);
      });
      
      // Override with business-specific
      businessContent?.forEach(item => {
        contentMap.set(item.region_key, item);
      });

      return NextResponse.json({
        success: true,
        content: Array.from(contentMap.values()),
      });
    }

    // No business ID - just get global content
    const { data, error } = await supabase
      .from('site_content')
      .select('*')
      .eq('page_slug', pageSlug)
      .is('business_id', null);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      content: data,
    });

  } catch (error: any) {
    console.error('[Site Content GET] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { page_slug, region_key, content, content_type, image_url, image_alt, business_id } = body;

    if (!page_slug || !region_key) {
      return NextResponse.json(
        { error: 'page_slug and region_key required' },
        { status: 400 }
      );
    }

    // Check permissions
    if (business_id) {
      // User must have access to this business
      const { data: access } = await supabase
        .from('user_businesses')
        .select('role')
        .eq('user_id', user.id)
        .eq('business_id', business_id)
        .single();

      if (!access) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    } else {
      // Global content - must be admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      if (!profile?.is_admin) {
        return NextResponse.json({ error: 'Admin access required for global content' }, { status: 403 });
      }
    }

    // Upsert the content
    const { data, error } = await supabase
      .from('site_content')
      .upsert({
        business_id: business_id || null,
        page_slug,
        region_key,
        content,
        content_type: content_type || 'text',
        image_url,
        image_alt,
        last_edited_by: user.id,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'business_id,page_slug,region_key',
      })
      .select()
      .single();

    if (error) {
      console.error('[Site Content POST] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      content: data,
    });

  } catch (error: any) {
    console.error('[Site Content POST] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
