import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { createServerClient } from '@/lib/supabase/server';
import { resolveFeatures, hasFeature } from '@/lib/services/feature-resolution';

/**
 * GET /api/portal/listing/menu?listing_id=xxx — Get menu data
 * PUT /api/portal/listing/menu — Save menu sections as JSONB
 *
 * Gated by menu_editor feature flag. Returns 402 if not available.
 */
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof Response) return authResult;
  const { user } = authResult;

  const { searchParams } = new URL(request.url);
  const listingId = searchParams.get('listing_id');

  if (!listingId) {
    return NextResponse.json({ error: 'listing_id required' }, { status: 400 });
  }

  const service = createServerClient();

  // Verify ownership
  const { data: listing } = await service
    .from('directory_listings')
    .select('id, claimed_by')
    .eq('id', listingId)
    .single();

  if (!listing || listing.claimed_by !== user.id) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  // Check menu_editor feature
  const features = await resolveFeatures(user.id, listingId);
  if (!hasFeature(features, 'menu_editor')) {
    return NextResponse.json(
      { error: 'Menu editor requires a Pro subscription', feature: 'menu_editor' },
      { status: 402 }
    );
  }

  const { data: menu } = await service
    .from('listing_menus')
    .select('*')
    .eq('listing_id', listingId)
    .maybeSingle();

  return NextResponse.json({
    menu: menu || { listing_id: listingId, sections: [] },
  });
}

export async function PUT(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof Response) return authResult;
  const { user } = authResult;

  const body = await request.json();
  const { listing_id, sections } = body;

  if (!listing_id || !Array.isArray(sections)) {
    return NextResponse.json({ error: 'listing_id and sections array required' }, { status: 400 });
  }

  const service = createServerClient();

  // Verify ownership
  const { data: listing } = await service
    .from('directory_listings')
    .select('id, claimed_by')
    .eq('id', listing_id)
    .single();

  if (!listing || listing.claimed_by !== user.id) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  // Check menu_editor feature
  const features = await resolveFeatures(user.id, listing_id);
  if (!hasFeature(features, 'menu_editor')) {
    return NextResponse.json(
      { error: 'Menu editor requires a Pro subscription', feature: 'menu_editor' },
      { status: 402 }
    );
  }

  // Upsert menu
  const { data: existingMenu } = await service
    .from('listing_menus')
    .select('id')
    .eq('listing_id', listing_id)
    .maybeSingle();

  let menu;
  if (existingMenu) {
    const { data, error } = await service
      .from('listing_menus')
      .update({ sections, updated_at: new Date().toISOString() })
      .eq('listing_id', listing_id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    menu = data;
  } else {
    const { data, error } = await service
      .from('listing_menus')
      .insert({ listing_id, sections })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    menu = data;
  }

  return NextResponse.json({ success: true, menu });
}
