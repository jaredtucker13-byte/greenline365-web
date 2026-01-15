import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Businesses API
 * 
 * GET /api/businesses - List user's businesses
 * GET /api/businesses?id=xxx - Get single business
 * POST /api/businesses - Create new business (tier1 only, for self-service)
 * PATCH /api/businesses - Update business settings
 */

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('id');

    // Get single business
    if (businessId) {
      const { data: userBusiness, error } = await supabase
        .from('user_businesses')
        .select(`
          role,
          is_primary,
          business:businesses (*)
        `)
        .eq('user_id', user.id)
        .eq('business_id', businessId)
        .single();

      if (error || !userBusiness) {
        return NextResponse.json({ error: 'Business not found' }, { status: 404 });
      }

      return NextResponse.json({
        business: userBusiness.business,
        role: userBusiness.role,
        is_primary: userBusiness.is_primary,
      });
    }

    // Get all user's businesses
    const { data: userBusinesses, error } = await supabase
      .from('user_businesses')
      .select(`
        role,
        is_primary,
        business:businesses (*)
      `)
      .eq('user_id', user.id)
      .order('is_primary', { ascending: false });

    if (error) {
      console.error('[Businesses API] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      businesses: userBusinesses || [],
    });

  } catch (error: any) {
    console.error('[Businesses API] Error:', error);
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
    const { name, slug, industry, tier = 'tier1' } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Name and slug are required' },
        { status: 400 }
      );
    }

    // Create business
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .insert({
        name,
        slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        tier,
        industry,
        created_by: user.id,
      })
      .select()
      .single();

    if (businessError) {
      console.error('[Businesses API] Create error:', businessError);
      return NextResponse.json(
        { error: businessError.message },
        { status: 500 }
      );
    }

    // Link user as owner
    const { error: linkError } = await supabase
      .from('user_businesses')
      .insert({
        user_id: user.id,
        business_id: business.id,
        role: 'owner',
        is_primary: false,
      });

    if (linkError) {
      console.error('[Businesses API] Link error:', linkError);
      // Rollback: delete the business
      await supabase.from('businesses').delete().eq('id', business.id);
      return NextResponse.json(
        { error: 'Failed to link user to business' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      business,
    });

  } catch (error: any) {
    console.error('[Businesses API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { businessId, updates } = body;

    if (!businessId) {
      return NextResponse.json(
        { error: 'Business ID required' },
        { status: 400 }
      );
    }

    // Check if user is owner/admin
    const { data: userBusiness } = await supabase
      .from('user_businesses')
      .select('role')
      .eq('user_id', user.id)
      .eq('business_id', businessId)
      .single();

    if (!userBusiness || !['owner', 'admin'].includes(userBusiness.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Update business
    const { data: business, error } = await supabase
      .from('businesses')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', businessId)
      .select()
      .single();

    if (error) {
      console.error('[Businesses API] Update error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      business,
    });

  } catch (error: any) {
    console.error('[Businesses API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
