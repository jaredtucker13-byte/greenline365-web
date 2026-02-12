import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
function getServiceClient() { return createClient(supabaseUrl, supabaseServiceKey); }

/**
 * Directory Marketplace Add-ons API
 * 
 * GET  /api/directory/addons?listing_id=xxx  — Get active add-ons for a listing
 * POST /api/directory/addons                 — Purchase an add-on (creates Stripe checkout)
 * PATCH /api/directory/addons                — Manage add-on (activate/deactivate after payment)
 */

const ADDON_CATALOG: Record<string, { name: string; price: number; mode: 'subscription' | 'payment'; interval?: 'week' | 'month'; description: string }> = {
  coupon_engine: { name: 'Coupon Engine', price: 19, mode: 'subscription', interval: 'month', description: 'Create trackable QR coupons for your listing' },
  custom_poll: { name: 'Custom Poll Template', price: 150, mode: 'payment', description: 'Industry-specific feedback poll template' },
  featured_boost: { name: 'Featured Boost', price: 29, mode: 'payment', description: '1-week homepage spotlight for your listing' },
  additional_photos: { name: 'Additional Photos (5-pack)', price: 9, mode: 'subscription', interval: 'month', description: '5 extra photos beyond your tier limit' },
  analytics_pro: { name: 'Analytics Pro', price: 19, mode: 'subscription', interval: 'month', description: 'Detailed views, clicks, and search analytics' },
};

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

  const addons = listing.metadata?.addons || {};
  return NextResponse.json({ addons, catalog: ADDON_CATALOG });
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { addon_type, listing_id, origin_url } = body;

    if (!addon_type || !ADDON_CATALOG[addon_type]) {
      return NextResponse.json({ error: 'Invalid addon_type' }, { status: 400 });
    }

    if (!listing_id || !origin_url) {
      return NextResponse.json({ error: 'listing_id and origin_url required' }, { status: 400 });
    }

    // Verify user owns this listing
    const service = getServiceClient();
    const { data: listing } = await service
      .from('directory_listings')
      .select('id, claimed_by, tier')
      .eq('id', listing_id)
      .single();

    if (!listing || listing.claimed_by !== user.id) {
      return NextResponse.json({ error: 'Not authorized for this listing' }, { status: 403 });
    }

    if (listing.tier === 'free') {
      return NextResponse.json({ error: 'Marketplace add-ons require a Pro or Premium subscription' }, { status: 403 });
    }

    const addon = ADDON_CATALOG[addon_type];
    const successUrl = `${origin_url}/business-dashboard?addon_success=${addon_type}&listing=${listing_id}&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${origin_url}/business-dashboard`;

    if (addon.mode === 'subscription') {
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: { name: `GL365 ${addon.name}`, description: addon.description },
            unit_amount: Math.round(addon.price * 100),
            recurring: { interval: addon.interval || 'month' },
          },
          quantity: 1,
        }],
        metadata: { listing_id, addon_type, user_id: user.id },
        success_url: successUrl,
        cancel_url: cancelUrl,
      });

      return NextResponse.json({ url: session.url });
    } else {
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: { name: `GL365 ${addon.name}`, description: addon.description },
            unit_amount: Math.round(addon.price * 100),
          },
          quantity: 1,
        }],
        metadata: { listing_id, addon_type, user_id: user.id },
        success_url: successUrl,
        cancel_url: cancelUrl,
      });

      return NextResponse.json({ url: session.url });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Activate an add-on after payment (called by webhook or manually)
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { listing_id, addon_type, action } = body;

    if (!listing_id || !addon_type) {
      return NextResponse.json({ error: 'listing_id and addon_type required' }, { status: 400 });
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

    const metadata = listing.metadata || {};
    const addons = metadata.addons || {};

    if (action === 'activate') {
      addons[addon_type] = {
        active: true,
        purchased_at: new Date().toISOString(),
        ...(addon_type === 'featured_boost' ? { expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() } : {}),
        ...(addon_type === 'additional_photos' ? { extra_photos: 5 } : {}),
      };
    } else if (action === 'deactivate') {
      if (addons[addon_type]) addons[addon_type].active = false;
    }

    const { error } = await service
      .from('directory_listings')
      .update({ metadata: { ...metadata, addons }, updated_at: new Date().toISOString() })
      .eq('id', listing_id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, addons });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
