import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/badges?listing_id=xxx or ?slug=xxx
 * Authenticated endpoint for portal snippet generator UI.
 * Same response shape as /api/badges/[partnerId] but requires a supabase session.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();

  // Verify auth
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const listingId = searchParams.get('listing_id');
  const slug = searchParams.get('slug');

  if (!listingId && !slug) {
    return NextResponse.json({ error: 'listing_id or slug required' }, { status: 400 });
  }

  // Find listing
  let query = supabase
    .from('directory_listings')
    .select('id, business_name, slug, city, state, tenant_id, avg_feedback_rating, total_feedback_count, trust_score, metadata');

  if (listingId) {
    query = query.eq('id', listingId);
  } else {
    query = query.eq('slug', slug);
  }

  const { data: listing, error: listingError } = await query.single();

  if (listingError || !listing) {
    return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
  }

  // Get active badges
  const { data: badges } = await supabase
    .from('directory_badges')
    .select('id, badge_type, badge_label, badge_color, badge_icon, earned_at, earned_via')
    .eq('listing_id', listing.id)
    .eq('is_active', true);

  // Get business tier
  let tier = 'free';
  if (listing.tenant_id) {
    const { data: business } = await supabase
      .from('businesses')
      .select('tier')
      .eq('id', listing.tenant_id)
      .single();
    if (business) {
      tier = business.tier || 'free';
    }
  }

  const subscriptionActive = tier !== 'free';
  const listingSlug = listing.slug;

  const badgeList = (badges || []).map((b) => ({
    id: b.id,
    badge_type: b.badge_type,
    badge_label: b.badge_label,
    badge_color: b.badge_color,
    badge_icon: b.badge_icon || '',
    earned_at: b.earned_at,
    earned_via: b.earned_via,
    ...(!subscriptionActive ? { badgeStatus: 'inactive' as const } : {}),
  }));

  return NextResponse.json({
    partnerId: listingSlug,
    businessName: listing.business_name,
    city: listing.city || '',
    state: listing.state || '',
    tier,
    subscriptionActive,
    badges: badgeList,
    stats: {
      avgRating: listing.avg_feedback_rating || 0,
      reviewCount: listing.total_feedback_count || 0,
      trustScore: listing.trust_score || 0,
      jobsLogged: listing.metadata?.jobs_logged || 0,
    },
    profileUrl: `https://greenline365.com/directory/${listingSlug}`,
    bookingUrl: `https://greenline365.com/listing/${listingSlug}`,
    embedVersion: '1.0',
    lastUpdated: new Date().toISOString(),
  });
}
