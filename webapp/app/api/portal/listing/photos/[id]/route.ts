import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { createServerClient } from '@/lib/supabase/server';

/**
 * PATCH /api/portal/listing/photos/[id] — Reorder or set cover
 * DELETE /api/portal/listing/photos/[id] — Delete a photo
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request);
  if (authResult instanceof Response) return authResult;
  const { user } = authResult;

  const { id } = await params;
  const body = await request.json();
  const { action, position } = body;

  const service = createServerClient();

  // Get photo and verify ownership
  const { data: photo } = await service
    .from('listing_photos')
    .select('id, listing_id, url, is_cover')
    .eq('id', id)
    .single();

  if (!photo) {
    return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
  }

  const { data: listing } = await service
    .from('directory_listings')
    .select('id, claimed_by')
    .eq('id', photo.listing_id)
    .single();

  if (!listing || listing.claimed_by !== user.id) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  if (action === 'set_cover') {
    // Unset all other covers
    await service
      .from('listing_photos')
      .update({ is_cover: false })
      .eq('listing_id', photo.listing_id);

    // Set this as cover
    await service
      .from('listing_photos')
      .update({ is_cover: true })
      .eq('id', id);

    // Update listing cover_image_url
    await service
      .from('directory_listings')
      .update({ cover_image_url: photo.url, updated_at: new Date().toISOString() })
      .eq('id', photo.listing_id);

    return NextResponse.json({ success: true });
  }

  if (action === 'reorder' && typeof position === 'number') {
    await service
      .from('listing_photos')
      .update({ position })
      .eq('id', id);

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request);
  if (authResult instanceof Response) return authResult;
  const { user } = authResult;

  const { id } = await params;
  const service = createServerClient();

  // Get photo and verify ownership
  const { data: photo } = await service
    .from('listing_photos')
    .select('id, listing_id, is_cover')
    .eq('id', id)
    .single();

  if (!photo) {
    return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
  }

  const { data: listing } = await service
    .from('directory_listings')
    .select('id, claimed_by')
    .eq('id', photo.listing_id)
    .single();

  if (!listing || listing.claimed_by !== user.id) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  // Delete the photo
  const { error } = await service
    .from('listing_photos')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // If this was the cover, assign the next photo as cover
  if (photo.is_cover) {
    const { data: nextPhoto } = await service
      .from('listing_photos')
      .select('id, url')
      .eq('listing_id', photo.listing_id)
      .order('position', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (nextPhoto) {
      await service
        .from('listing_photos')
        .update({ is_cover: true })
        .eq('id', nextPhoto.id);

      await service
        .from('directory_listings')
        .update({ cover_image_url: nextPhoto.url, updated_at: new Date().toISOString() })
        .eq('id', photo.listing_id);
    } else {
      await service
        .from('directory_listings')
        .update({ cover_image_url: null, updated_at: new Date().toISOString() })
        .eq('id', photo.listing_id);
    }
  }

  return NextResponse.json({ success: true });
}
