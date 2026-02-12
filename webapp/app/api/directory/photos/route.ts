import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { getTierLimits } from '@/lib/feature-gates';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
function getServiceClient() { return createClient(supabaseUrl, supabaseServiceKey); }

/**
 * Photo Library API for Business Dashboard
 * 
 * GET  /api/directory/photos?listing_id=xxx — Get all photos (library) for a listing
 * POST /api/directory/photos               — Upload a photo URL to library
 * PATCH /api/directory/photos              — Select/deselect photos for display, reorder, set cover
 */

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const listingId = searchParams.get('listing_id');
    if (!listingId) return NextResponse.json({ error: 'listing_id required' }, { status: 400 });

    const service = getServiceClient();
    const { data: listing } = await service
      .from('directory_listings')
      .select('id, claimed_by, tier, gallery_images, cover_image_url, metadata')
      .eq('id', listingId)
      .single();

    if (!listing || listing.claimed_by !== user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const limits = getTierLimits(listing.tier);
    const allPhotos: string[] = listing.gallery_images || [];
    const selectedPhotos: string[] = listing.metadata?.selected_photos || allPhotos.slice(0, limits.photos);
    const menuImages: string[] = listing.metadata?.menu_images || [];

    return NextResponse.json({
      library: allPhotos,
      selected: selectedPhotos,
      cover: listing.cover_image_url,
      menu_images: menuImages,
      tier: listing.tier,
      max_display: limits.photos,
      total_in_library: allPhotos.length,
      can_upload: listing.tier !== 'free',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Upload photo URL to library
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { listing_id, photo_url, type = 'gallery' } = body;

    if (!listing_id || !photo_url) {
      return NextResponse.json({ error: 'listing_id and photo_url required' }, { status: 400 });
    }

    const service = getServiceClient();
    const { data: listing } = await service
      .from('directory_listings')
      .select('id, claimed_by, tier, gallery_images, metadata')
      .eq('id', listing_id)
      .single();

    if (!listing || listing.claimed_by !== user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    if (listing.tier === 'free') {
      return NextResponse.json({ error: 'Upgrade to Pro or Premium to upload photos' }, { status: 403 });
    }

    const metadata = listing.metadata || {};
    const photos = listing.gallery_images || [];

    if (type === 'menu') {
      const menuImages = metadata.menu_images || [];
      menuImages.push(photo_url);
      await service
        .from('directory_listings')
        .update({ metadata: { ...metadata, menu_images: menuImages }, updated_at: new Date().toISOString() })
        .eq('id', listing_id);

      return NextResponse.json({ success: true, menu_images: menuImages });
    }

    // Add to gallery library
    photos.push(photo_url);
    await service
      .from('directory_listings')
      .update({ gallery_images: photos, updated_at: new Date().toISOString() })
      .eq('id', listing_id);

    return NextResponse.json({ success: true, total_photos: photos.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Select photos for display, set cover, manage menu
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { listing_id, action } = body;

    if (!listing_id || !action) {
      return NextResponse.json({ error: 'listing_id and action required' }, { status: 400 });
    }

    const service = getServiceClient();
    const { data: listing } = await service
      .from('directory_listings')
      .select('id, claimed_by, tier, gallery_images, cover_image_url, metadata')
      .eq('id', listing_id)
      .single();

    if (!listing || listing.claimed_by !== user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const limits = getTierLimits(listing.tier);
    const metadata = listing.metadata || {};

    switch (action) {
      case 'select_photos': {
        // Choose which photos from library to display publicly
        const { photo_urls } = body;
        if (!Array.isArray(photo_urls)) return NextResponse.json({ error: 'photo_urls array required' }, { status: 400 });

        if (photo_urls.length > limits.photos) {
          return NextResponse.json({ error: `Your ${listing.tier} tier allows ${limits.photos} photos. Upgrade for more.` }, { status: 403 });
        }

        metadata.selected_photos = photo_urls;
        await service
          .from('directory_listings')
          .update({
            metadata: { ...metadata },
            cover_image_url: photo_urls[0] || listing.cover_image_url,
            updated_at: new Date().toISOString(),
          })
          .eq('id', listing_id);

        return NextResponse.json({ success: true, selected: photo_urls });
      }

      case 'set_cover': {
        const { photo_url } = body;
        await service
          .from('directory_listings')
          .update({ cover_image_url: photo_url, updated_at: new Date().toISOString() })
          .eq('id', listing_id);

        return NextResponse.json({ success: true });
      }

      case 'remove_photo': {
        const { photo_url } = body;
        const photos = (listing.gallery_images || []).filter((p: string) => p !== photo_url);
        const selected = (metadata.selected_photos || []).filter((p: string) => p !== photo_url);

        await service
          .from('directory_listings')
          .update({
            gallery_images: photos,
            metadata: { ...metadata, selected_photos: selected },
            updated_at: new Date().toISOString(),
          })
          .eq('id', listing_id);

        return NextResponse.json({ success: true, remaining: photos.length });
      }

      case 'remove_menu': {
        const { photo_url } = body;
        const menuImages = (metadata.menu_images || []).filter((p: string) => p !== photo_url);
        await service
          .from('directory_listings')
          .update({ metadata: { ...metadata, menu_images: menuImages }, updated_at: new Date().toISOString() })
          .eq('id', listing_id);

        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
