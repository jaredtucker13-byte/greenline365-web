import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getTierLimits } from '@/lib/feature-gates';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
function getServiceClient() { return createClient(supabaseUrl, supabaseServiceKey); }

function applyPhotoGating(listing: any) {
  const tier = listing.tier || 'free';
  const isClaimed = listing.is_claimed;
  const limits = getTierLimits(tier);
  const allPhotos: string[] = listing.gallery_images || [];
  const maxPhotos = (!isClaimed) ? 1 : limits.photos;
  const visiblePhotos = maxPhotos >= 999 ? allPhotos : allPhotos.slice(0, maxPhotos);
  return {
    ...listing,
    gallery_images: visiblePhotos,
    cover_image_url: allPhotos[0] || listing.cover_image_url || null,
  };
}

const TOURISM_CATEGORIES = [
  'stay', 'eat-drink', 'quick-eats', 'things-to-do', 'beaches-nature',
  'family-fun', 'shopping', 'everyday-essentials', 'nightlife', 'getting-around',
];

const INDUSTRY_CATEGORIES = [
  'services', 'dining', 'health-wellness', 'style-shopping', 'nightlife',
  'family-entertainment', 'destinations', 'hotels-lodging', 'professional-services',
];

// GET /api/directory/guide?destination=st-pete-beach
// Returns all listings for a destination, grouped by tourism category,
// plus featured listings, industry category counts, and regional stats
export async function GET(request: NextRequest) {
  const supabase = getServiceClient();
  const { searchParams } = new URL(request.url);
  const destination = searchParams.get('destination');

  if (!destination) {
    return NextResponse.json({ error: 'destination parameter required' }, { status: 400 });
  }

  // Single query: get ALL listings for this destination
  const { data, error } = await supabase
    .from('directory_listings_public')
    .select('id, business_name, slug, industry, subcategories, description, phone, website, city, state, zip_code, cover_image_url, gallery_images, tier, is_claimed, trust_score, avg_feedback_rating, total_feedback_count, tags, metadata, service_area_display, is_mobile_service, directory_badges(id, badge_type, badge_label, badge_color)')
    .eq('is_published', true)
    .contains('tags', [`destination:${destination}`])
    .order('trust_score', { ascending: false })
    .limit(300);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const allListings = (data || []).map(applyPhotoGating);

  // Group by tourism category
  const tourismSections: Record<string, any[]> = {};
  let totalCount = 0;

  for (const cat of TOURISM_CATEGORIES) {
    const tag = `tourism:${cat}`;
    const catListings = allListings.filter(l => (l.tags || []).includes(tag));
    tourismSections[cat] = catListings;
    totalCount += catListings.length;
  }

  // Group by industry category with counts
  const industryCounts: Record<string, number> = {};
  for (const ind of INDUSTRY_CATEGORIES) {
    industryCounts[ind] = allListings.filter(l => l.industry === ind).length;
  }

  // Featured listings: top-rated claimed businesses with highest trust scores
  const featured = allListings
    .filter(l => l.is_claimed && (l.tier === 'premium' || l.tier === 'pro'))
    .sort((a, b) => {
      const scoreA = (a.trust_score || 0) + (a.avg_feedback_rating || 0) * 10;
      const scoreB = (b.trust_score || 0) + (b.avg_feedback_rating || 0) * 10;
      return scoreB - scoreA;
    })
    .slice(0, 6);

  // Top rated: highest average rating with at least some feedback
  const topRated = allListings
    .filter(l => (l.avg_feedback_rating || 0) > 0 || (l.metadata?.google_rating || 0) > 0)
    .sort((a, b) => {
      const ratingA = a.avg_feedback_rating || a.metadata?.google_rating || 0;
      const ratingB = b.avg_feedback_rating || b.metadata?.google_rating || 0;
      return ratingB - ratingA;
    })
    .slice(0, 6);

  // Unique cities within this destination's listings
  const cities = [...new Set(allListings.map(l => l.city).filter(Boolean))];

  return NextResponse.json({
    destination,
    totalCount,
    sections: tourismSections,
    featured,
    topRated,
    industryCounts,
    cities,
    claimedCount: allListings.filter(l => l.is_claimed).length,
    premiumCount: allListings.filter(l => l.tier === 'premium').length,
  });
}
