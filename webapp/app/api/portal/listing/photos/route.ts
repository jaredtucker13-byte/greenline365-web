import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { createServerClient } from '@/lib/supabase/server';
import { resolveFeatures, getFeatureValue } from '@/lib/services/feature-resolution';

/**
 * GET /api/portal/listing/photos?listing_id=xxx — List photos for a listing
 * POST /api/portal/listing/photos — Upload a new photo (checks photos_max)
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

  // Get photos from listing_photos table
  const { data: photos, error } = await service
    .from('listing_photos')
    .select('*')
    .eq('listing_id', listingId)
    .order('position', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get feature limits
  const features = await resolveFeatures(user.id, listingId);
  const maxPhotos = getFeatureValue(features, 'photos_max');

  return NextResponse.json({
    photos: photos || [],
    total: photos?.length || 0,
    max: typeof maxPhotos === 'number' ? maxPhotos : 3,
  });
}

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof Response) return authResult;
  const { user } = authResult;

  const body = await request.json();
  const { listing_id, url, alt_text } = body;

  if (!listing_id || !url) {
    return NextResponse.json({ error: 'listing_id and url required' }, { status: 400 });
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

  // Check photo limit
  const features = await resolveFeatures(user.id, listing_id);
  const maxPhotos = getFeatureValue(features, 'photos_max');
  const maxLimit = typeof maxPhotos === 'number' ? maxPhotos : 3;

  const { count } = await service
    .from('listing_photos')
    .select('id', { count: 'exact', head: true })
    .eq('listing_id', listing_id);

  const currentCount = count || 0;

  if (currentCount >= maxLimit) {
    return NextResponse.json(
      {
        error: `Photo limit reached (${currentCount}/${maxLimit}). Upgrade to Pro for up to 20 photos.`,
        current: currentCount,
        max: maxLimit,
      },
      { status: 402 }
    );
  }

  // Determine position (append at end)
  const isCover = currentCount === 0;

  const { data: photo, error } = await service
    .from('listing_photos')
    .insert({
      listing_id,
      url,
      alt_text: alt_text || null,
      position: currentCount,
      is_cover: isCover,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Update cover_image_url on directory_listings if this is the first photo
  if (isCover) {
    await service
      .from('directory_listings')
      .update({ cover_image_url: url, updated_at: new Date().toISOString() })
      .eq('id', listing_id);
  }

  return NextResponse.json({ success: true, photo });
}
