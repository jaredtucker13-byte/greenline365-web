import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
function getServiceClient() { return createClient(supabaseUrl, supabaseServiceKey); }

/**
 * Coupon Engine API
 * 
 * GET  /api/directory/addons/coupons?listing_id=xxx — Get coupons for a listing
 * POST /api/directory/addons/coupons               — Create a coupon
 * PATCH /api/directory/addons/coupons              — Redeem a coupon (public, tracks $0.60 fee)
 */

interface Coupon {
  id: string;
  code: string;
  discount_type: 'percent' | 'fixed';
  discount_value: number;
  description: string;
  expires_at: string | null;
  max_redemptions: number;
  current_redemptions: number;
  is_active: boolean;
  created_at: string;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const listingId = searchParams.get('listing_id');

  if (!listingId) {
    return NextResponse.json({ error: 'listing_id required' }, { status: 400 });
  }

  const service = getServiceClient();
  const { data: listing } = await service
    .from('directory_listings')
    .select('id, metadata')
    .eq('id', listingId)
    .single();

  if (!listing) {
    return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
  }

  const coupons: Coupon[] = listing.metadata?.coupons || [];
  const activeCoupons = coupons.filter(c => {
    if (!c.is_active) return false;
    if (c.expires_at && new Date(c.expires_at) < new Date()) return false;
    if (c.max_redemptions > 0 && c.current_redemptions >= c.max_redemptions) return false;
    return true;
  });

  return NextResponse.json({ coupons: activeCoupons });
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { listing_id, discount_type, discount_value, description, expires_at, max_redemptions } = body;

    if (!listing_id || !discount_type || !discount_value || !description) {
      return NextResponse.json({ error: 'listing_id, discount_type, discount_value, description required' }, { status: 400 });
    }

    const service = getServiceClient();
    const { data: listing } = await service
      .from('directory_listings')
      .select('id, claimed_by, metadata')
      .eq('id', listing_id)
      .single();

    if (!listing || listing.claimed_by !== user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Check coupon engine add-on is active
    if (!listing.metadata?.addons?.coupon_engine?.active) {
      return NextResponse.json({ error: 'Coupon Engine add-on not active' }, { status: 403 });
    }

    const newCoupon: Coupon = {
      id: `cpn_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      code: `GL365-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      discount_type,
      discount_value,
      description,
      expires_at: expires_at || null,
      max_redemptions: max_redemptions || 0,
      current_redemptions: 0,
      is_active: true,
      created_at: new Date().toISOString(),
    };

    const metadata = listing.metadata || {};
    const coupons = metadata.coupons || [];
    coupons.push(newCoupon);

    const { error } = await service
      .from('directory_listings')
      .update({ metadata: { ...metadata, coupons }, updated_at: new Date().toISOString() })
      .eq('id', listing_id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, coupon: newCoupon });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Redeem coupon (public endpoint — tracks $0.60 transaction fee)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { listing_id, coupon_code } = body;

    if (!listing_id || !coupon_code) {
      return NextResponse.json({ error: 'listing_id and coupon_code required' }, { status: 400 });
    }

    const service = getServiceClient();
    const { data: listing } = await service
      .from('directory_listings')
      .select('id, metadata')
      .eq('id', listing_id)
      .single();

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    const metadata = listing.metadata || {};
    const coupons: Coupon[] = metadata.coupons || [];
    const couponIdx = coupons.findIndex(c => c.code === coupon_code && c.is_active);

    if (couponIdx === -1) {
      return NextResponse.json({ error: 'Invalid or expired coupon' }, { status: 404 });
    }

    const coupon = coupons[couponIdx];

    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Coupon expired' }, { status: 410 });
    }

    if (coupon.max_redemptions > 0 && coupon.current_redemptions >= coupon.max_redemptions) {
      return NextResponse.json({ error: 'Coupon usage limit reached' }, { status: 410 });
    }

    // Increment redemption count
    coupons[couponIdx].current_redemptions += 1;

    // Track transaction fee ($0.60 per redemption for directory-only businesses)
    const transactions = metadata.transactions || [];
    transactions.push({
      type: 'coupon_redemption',
      coupon_code,
      fee: 0.60,
      timestamp: new Date().toISOString(),
    });

    const { error } = await service
      .from('directory_listings')
      .update({ metadata: { ...metadata, coupons, transactions }, updated_at: new Date().toISOString() })
      .eq('id', listing_id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({
      success: true,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      description: coupon.description,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
