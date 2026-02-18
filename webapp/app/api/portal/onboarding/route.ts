import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { createServerClient } from '@/lib/supabase/server';
import { resolveFeatures, hasFeature } from '@/lib/services/feature-resolution';

/**
 * GET /api/portal/onboarding?listing_id=xxx — Get onboarding checklist status
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

  // Get listing data
  const { data: listing } = await service
    .from('directory_listings')
    .select('id, claimed_by, description, cover_image_url, business_hours, gallery_images')
    .eq('id', listingId)
    .single();

  if (!listing || listing.claimed_by !== user.id) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  // Check photos
  const { count: photoCount } = await service
    .from('listing_photos')
    .select('id', { count: 'exact', head: true })
    .eq('listing_id', listingId);

  // Check menu
  const { data: menu } = await service
    .from('listing_menus')
    .select('id, sections')
    .eq('listing_id', listingId)
    .maybeSingle();

  const features = await resolveFeatures(user.id, listingId);
  const isPro = hasFeature(features, 'menu_editor');

  const hasCoverPhoto = !!(listing.cover_image_url || (photoCount && photoCount > 0));
  const hasDescription = !!(listing.description && listing.description.length > 0);
  const hasBusinessHours = !!(
    listing.business_hours &&
    typeof listing.business_hours === 'object' &&
    Object.keys(listing.business_hours).length > 0
  );
  const hasMenu = !!(menu && Array.isArray(menu.sections) && menu.sections.length > 0);
  const hasMultiplePhotos = (photoCount || 0) > 1;

  const checklist = [
    { id: 'cover_photo', label: 'Add cover photo', completed: hasCoverPhoto, href: '/portal/photos' },
    { id: 'description', label: 'Add description', completed: hasDescription, href: '/portal/listing' },
    { id: 'hours', label: 'Complete business hours', completed: hasBusinessHours, href: '/portal/hours' },
    { id: 'menu', label: 'Build your menu', completed: hasMenu, href: '/portal/menu', proOnly: true },
    { id: 'more_photos', label: 'Add more photos', completed: hasMultiplePhotos, href: '/portal/photos', proOnly: true },
  ];

  return NextResponse.json({ checklist, isPro });
}
