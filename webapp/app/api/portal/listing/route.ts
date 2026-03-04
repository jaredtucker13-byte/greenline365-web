import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { createServerClient } from '@/lib/supabase/server';
import { resolveFeatures, hasFeature } from '@/lib/services/feature-resolution';

/**
 * GET /api/portal/listing — Get the authenticated user's claimed listing(s)
 * PATCH /api/portal/listing — Update listing with feature gating
 */
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof Response) return authResult;
  const { user } = authResult;

  const service = createServerClient();
  const { data: listings, error } = await service
    .from('directory_listings')
    .select('*')
    .eq('claimed_by', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ listings: listings || [] });
}

export async function PATCH(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof Response) return authResult;
  const { user } = authResult;

  const body = await request.json();
  const { listing_id, ...updates } = body;

  if (!listing_id) {
    return NextResponse.json({ error: 'listing_id required' }, { status: 400 });
  }

  const service = createServerClient();

  // Verify ownership
  const { data: listing } = await service
    .from('directory_listings')
    .select('id, claimed_by')
    .eq('id', listing_id)
    .single();

  if (!listing || listing.claimed_by !== user.id) {
    return NextResponse.json({ error: 'Not authorized to edit this listing' }, { status: 403 });
  }

  // Resolve features for gating
  const features = await resolveFeatures(user.id, listing_id);

  // Base allowed fields (always editable)
  const baseFields = [
    'business_name',
    'description',
    'phone',
    'website',
    'email',
    'address_line1',
    'city',
    'state',
    'zip_code',
    'logo_url',
    'is_published',
    'is_mobile_service',
    'service_area_radius_miles',
    'private_address',
    'service_area_label',
  ];

  // Pro-only fields
  const proFields: Record<string, string> = {
    industry: 'description_long',
    subcategories: 'description_long',
    tags: 'description_long',
  };

  const safeUpdates: Record<string, unknown> = {};

  for (const key of baseFields) {
    if (key in updates) safeUpdates[key] = updates[key];
  }

  // Check description length for free tier
  if ('description' in updates && typeof updates.description === 'string') {
    if (!hasFeature(features, 'description_long') && updates.description.length > 140) {
      return NextResponse.json(
        { error: 'Free tier descriptions are limited to 140 characters. Upgrade to Pro for unlimited.' },
        { status: 402 }
      );
    }
  }

  // Gate pro-only fields
  for (const [field, featureSlug] of Object.entries(proFields)) {
    if (field in updates) {
      if (hasFeature(features, featureSlug)) {
        safeUpdates[field] = updates[field];
      }
      // Silently skip if not available (don't error on read-only fields)
    }
  }

  // Handle video_url — stored in metadata JSONB, gated to Premium tier
  if ('video_url' in updates && typeof updates.video_url === 'string') {
    // Check if listing is Premium tier (fetch current listing data)
    const { data: currentListing } = await service
      .from('directory_listings')
      .select('tier, metadata')
      .eq('id', listing_id)
      .single();

    if (currentListing?.tier === 'premium') {
      const existingMetadata = (currentListing.metadata as Record<string, unknown>) || {};
      safeUpdates.metadata = {
        ...existingMetadata,
        video_url: updates.video_url || null,
      };
    }
    // Silently skip if not Premium
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
}
