import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getTierLimits } from '@/lib/feature-gates';
import { getPlaceholderImage, isClaimable } from '@/lib/directory-config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
function getServiceClient() { return createClient(supabaseUrl, supabaseServiceKey); }

/**
 * GET /api/directory/[slug] — Get a single listing by slug
 * Returns full listing details for the detail page
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = getServiceClient();

  const { data: listing, error } = await supabase
    .from('directory_listings')
    .select('*, directory_badges(id, badge_type, badge_label, badge_color, is_active)')
    .eq('slug', slug)
    .single();

  if (error || !listing) {
    return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
  }

  // Apply photo gating based on tier
  const tier = listing.tier || 'free';
  const isClaimed = listing.is_claimed;
  const limits = getTierLimits(tier);
  const allPhotos: string[] = listing.gallery_images || [];
  const industry = listing.industry || 'services';
  const placeholder = getPlaceholderImage(industry);

  // Free/unclaimed: placeholder only
  const isFreeOrUnclaimed = tier === 'free' || !isClaimed;
  const maxPhotos = isFreeOrUnclaimed ? 0 : limits.photos;
  const visiblePhotos = isFreeOrUnclaimed ? [] : allPhotos.slice(0, maxPhotos);
  const coverImage = isFreeOrUnclaimed ? placeholder : (visiblePhotos[0] || listing.cover_image_url || placeholder);

  // Get related listings (same city + industry, limit 4)
  const { data: related } = await supabase
    .from('directory_listings')
    .select('id, business_name, slug, industry, city, state, cover_image_url, tier, avg_feedback_rating, metadata')
    .eq('city', listing.city)
    .eq('industry', listing.industry)
    .neq('id', listing.id)
    .limit(4);

  return NextResponse.json({
    ...listing,
    gallery_images: visiblePhotos,
    total_photos_available: allPhotos.length,
    cover_image_url: coverImage,
    has_property_intelligence: limits.hasPropertyIntelligence && isClaimed,
    search_weight: limits.searchWeight,
    is_placeholder_image: isFreeOrUnclaimed,
    is_claimable: isClaimable(listing.business_name || ''),
    directory_badges: (listing.directory_badges || []).filter((b: any) => b.is_active),
    related: related || [],
  });
}
