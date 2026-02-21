import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'public, s-maxage=300',
};

// UUID v4 pattern
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// OPTIONS preflight
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * GET /api/badges/[partnerId]
 * Public read-only endpoint that powers external badge embeds.
 * partnerId can be a directory_listing slug (string) or uuid.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ partnerId: string }> }
) {
  const { partnerId } = await params;
  const supabase = createServerClient();

  // 1. Find the listing by slug or id
  const isUuid = UUID_RE.test(partnerId);
  const { data: listing, error: listingError } = await supabase
    .from('directory_listings')
    .select('id, business_name, slug, city, state, tenant_id, avg_feedback_rating, total_feedback_count, trust_score, metadata')
    .eq(isUuid ? 'id' : 'slug', partnerId)
    .single();

  if (listingError || !listing) {
    return NextResponse.json(
      { error: 'Partner not found' },
      { status: 404, headers: CORS_HEADERS }
    );
  }

  // 2. Get active badges for this listing
  const { data: badges } = await supabase
    .from('directory_badges')
    .select('id, badge_type, badge_label, badge_color, badge_icon, earned_at, earned_via')
    .eq('listing_id', listing.id)
    .eq('is_active', true);

  // 3. Get business tier from businesses table (if linked)
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
  const slug = listing.slug;

  // 4. Build badge list — add badgeStatus if subscription inactive
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

  // 5. Return response
  return NextResponse.json(
    {
      partnerId: slug,
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
      profileUrl: `https://greenline365.com/directory/${slug}`,
      bookingUrl: `https://greenline365.com/listing/${slug}`,
      embedVersion: '1.0',
      lastUpdated: new Date().toISOString(),
    },
    { headers: CORS_HEADERS }
  );
}
