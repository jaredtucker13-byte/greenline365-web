import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
function getServiceClient() { return createClient(supabaseUrl, supabaseServiceKey); }

/**
 * POST /api/directory/claim — Claim an existing directory listing
 * 
 * Flow: User finds their business in the directory → clicks "Claim" →
 * authenticates → this endpoint links the listing to their account.
 */

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { listing_id } = body;

    if (!listing_id) {
      return NextResponse.json({ error: 'listing_id required' }, { status: 400 });
    }

    const service = getServiceClient();

    // Check if listing exists and is not already claimed
    const { data: listing, error: fetchError } = await service
      .from('directory_listings')
      .select('id, business_name, is_claimed, claimed_by')
      .eq('id', listing_id)
      .single();

    if (fetchError || !listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    if (listing.is_claimed && listing.claimed_by && listing.claimed_by !== user.id) {
      return NextResponse.json({ error: 'This listing has already been claimed by another user' }, { status: 409 });
    }

    if (listing.claimed_by === user.id) {
      return NextResponse.json({ error: 'You already own this listing', listing_id }, { status: 200 });
    }

    // Claim the listing
    const { data: updated, error: updateError } = await service
      .from('directory_listings')
      .update({
        is_claimed: true,
        claimed_by: user.id,
        tenant_id: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', listing_id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully claimed "${listing.business_name}"`,
      listing: updated,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
