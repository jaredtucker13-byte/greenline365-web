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

// GET /api/directory/guide?destination=st-pete-beach
// Returns all listings for a destination, grouped by tourism category
export async function GET(request: NextRequest) {
  const supabase = getServiceClient();
  const { searchParams } = new URL(request.url);
  const destination = searchParams.get('destination');

  if (!destination) {
    return NextResponse.json({ error: 'destination parameter required' }, { status: 400 });
  }

  // Single query: get ALL listings for this destination
  const { data, error } = await supabase
    .from('directory_listings')
    .select('id, business_name, slug, industry, subcategories, description, phone, website, city, state, zip_code, cover_image_url, gallery_images, tier, is_claimed, trust_score, avg_feedback_rating, total_feedback_count, tags, metadata')
    .eq('is_published', true)
    .contains('tags', [`destination:${destination}`])
    .order('trust_score', { ascending: false })
    .limit(200);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const allListings = (data || []).map(applyPhotoGating);

  // Group by tourism category
  const grouped: Record<string, any[]> = {};
  let totalCount = 0;

  for (const cat of TOURISM_CATEGORIES) {
    const tag = `tourism:${cat}`;
    const catListings = allListings.filter(l => (l.tags || []).includes(tag));
    grouped[cat] = catListings;
    totalCount += catListings.length;
  }

  return NextResponse.json({
    destination,
    totalCount,
    sections: grouped,
  });
}
