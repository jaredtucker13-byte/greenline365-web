import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Pricing Tiers API
 * 
 * GET /api/pricing-tiers - Get all active pricing tiers (public)
 */

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: tiers, error } = await supabase
      .from('pricing_tiers')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('[Pricing Tiers] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      tiers,
    });

  } catch (error: any) {
    console.error('[Pricing Tiers] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/pricing-tiers - Update pricing tier (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin status
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { tier_key, ...updates } = body;

    if (!tier_key) {
      return NextResponse.json({ error: 'tier_key required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('pricing_tiers')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('tier_key', tier_key)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      tier: data,
    });

  } catch (error: any) {
    console.error('[Pricing Tiers Update] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
