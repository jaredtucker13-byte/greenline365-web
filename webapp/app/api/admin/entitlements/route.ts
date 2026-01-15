import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Entitlement Overrides API
 * 
 * Admin "God Mode" - manually grant/revoke access to any tenant
 * 
 * POST /api/admin/entitlements - Grant manual override
 * GET /api/admin/entitlements - List all overrides
 * DELETE /api/admin/entitlements - Revoke override
 */

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { 
      businessId,
      tier,
      reason,
      notes = null,
      expiresInDays = null,
      featureOverrides = null
    } = body;

    if (!businessId || !tier || !reason) {
      return NextResponse.json(
        { error: 'Business ID, tier, and reason are required' },
        { status: 400 }
      );
    }

    // Calculate expiration
    let expiresAt = null;
    if (expiresInDays) {
      const expDate = new Date();
      expDate.setDate(expDate.getDate() + expiresInDays);
      expiresAt = expDate.toISOString();
    }

    // Call the manual grant function
    const { data: result, error } = await supabase
      .rpc('grant_manual_entitlement', {
        p_business_id: businessId,
        p_tier: tier,
        p_reason: reason,
        p_notes: notes,
        p_granted_by: user.id,
        p_expires_at: expiresAt,
        p_feature_overrides: featureOverrides,
      });

    if (error) {
      console.error('[Entitlements API] Grant error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get updated business info
    const { data: business } = await supabase
      .from('businesses')
      .select('id, name, tier, access_source, billing_status')
      .eq('id', businessId)
      .single();

    return NextResponse.json({
      success: true,
      override: result,
      business,
    });

  } catch (error: any) {
    console.error('[Entitlements API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');
    const activeOnly = searchParams.get('activeOnly') === 'true';

    let query = supabase
      .from('entitlement_overrides')
      .select(`
        *,
        business:businesses(id, name, tier),
        granted_by_user:profiles!entitlement_overrides_granted_by_fkey(email, full_name)
      `)
      .order('granted_at', { ascending: false });

    if (businessId) {
      query = query.eq('business_id', businessId);
    }

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data: overrides, error } = await query;

    if (error) {
      console.error('[Entitlements API] List error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      overrides: overrides || [],
    });

  } catch (error: any) {
    console.error('[Entitlements API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const overrideId = searchParams.get('id');

    if (!overrideId) {
      return NextResponse.json(
        { error: 'Override ID required' },
        { status: 400 }
      );
    }

    // Revoke override (soft delete)
    const { data: override, error } = await supabase
      .from('entitlement_overrides')
      .update({
        is_active: false,
        revoked_at: new Date().toISOString(),
        revoked_by: user.id,
      })
      .eq('id', overrideId)
      .select()
      .single();

    if (error) {
      console.error('[Entitlements API] Revoke error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // TODO: Optionally reset business tier to default or previous tier

    return NextResponse.json({
      success: true,
      override,
    });

  } catch (error: any) {
    console.error('[Entitlements API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
