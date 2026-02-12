import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
function getServiceClient() { return createClient(supabaseUrl, supabaseServiceKey); }

/**
 * GET /api/directory/my-listing — Get the authenticated user's claimed listing(s)
 * PATCH /api/directory/my-listing — Update the user's claimed listing
 */

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const service = getServiceClient();
    const { data: listings, error } = await service
      .from('directory_listings')
      .select('*')
      .eq('claimed_by', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ listings: listings || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { listing_id, ...updates } = body;

    if (!listing_id) {
      return NextResponse.json({ error: 'listing_id required' }, { status: 400 });
    }

    const service = getServiceClient();

    // Verify user owns this listing
    const { data: existing } = await service
      .from('directory_listings')
      .select('id, claimed_by')
      .eq('id', listing_id)
      .single();

    if (!existing || existing.claimed_by !== user.id) {
      return NextResponse.json({ error: 'Not authorized to edit this listing' }, { status: 403 });
    }

    // Only allow specific fields to be updated
    const allowedFields = [
      'business_name', 'description', 'phone', 'website', 'email',
      'address_line1', 'city', 'state', 'zip_code',
      'logo_url', 'cover_image_url', 'gallery_images',
    ];
    const safeUpdates: Record<string, any> = {};
    for (const key of allowedFields) {
      if (key in updates) safeUpdates[key] = updates[key];
    }
    safeUpdates.updated_at = new Date().toISOString();

    const { data, error } = await service
      .from('directory_listings')
      .update(safeUpdates)
      .eq('id', listing_id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, listing: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
