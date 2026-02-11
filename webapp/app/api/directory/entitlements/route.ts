import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getTierLimits, canAccess } from '@/lib/feature-gates';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
function getServiceClient() { return createClient(supabaseUrl, supabaseServiceKey); }

/**
 * GET /api/directory/entitlements?listing_id=xxx
 * Returns the feature gates for a given listing based on its tier.
 * Public endpoint — no auth required (tier info is not sensitive).
 */
export async function GET(request: NextRequest) {
  const supabase = getServiceClient();
  const { searchParams } = new URL(request.url);
  const listingId = searchParams.get('listing_id');

  if (!listingId) {
    return NextResponse.json({ error: 'listing_id required' }, { status: 400 });
  }

  const { data: listing, error } = await supabase
    .from('directory_listings')
    .select('id, tier, business_name')
    .eq('id', listingId)
    .single();

  if (error || !listing) {
    return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
  }

  const limits = getTierLimits(listing.tier);

  return NextResponse.json({
    listing_id: listing.id,
    business_name: listing.business_name,
    tier: listing.tier,
    entitlements: limits,
  });
}
