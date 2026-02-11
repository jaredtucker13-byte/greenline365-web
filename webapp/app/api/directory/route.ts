import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getTierLimits } from '@/lib/feature-gates';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
function getServiceClient() { return createClient(supabaseUrl, supabaseServiceKey); }

/** Apply photo gating: limit visible photos based on tier + claim status */
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
    total_photos_available: allPhotos.length,
    cover_image_url: allPhotos[0] || listing.cover_image_url || null,
    has_property_intelligence: limits.hasPropertyIntelligence && isClaimed,
    search_weight: limits.searchWeight,
  };
}

/** Sort listings by weighted ranking: Property Intelligence > Paid tiers > Free */
function applyWeightedRanking(listings: any[]) {
  return listings.sort((a, b) => {
    // Property Intelligence badge holders first
    if (a.has_property_intelligence && !b.has_property_intelligence) return -1;
    if (!a.has_property_intelligence && b.has_property_intelligence) return 1;
    // Then by search weight (premium > pro > free)
    if (a.search_weight !== b.search_weight) return b.search_weight - a.search_weight;
    // Then by trust score
    return (b.trust_score || 0) - (a.trust_score || 0);
  });
}

// GET /api/directory - Public search
export async function GET(request: NextRequest) {
  const supabase = getServiceClient();
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search');
  const industry = searchParams.get('industry');
  const city = searchParams.get('city');
  const zip = searchParams.get('zip');
  const tier = searchParams.get('tier');
  const slug = searchParams.get('slug');
  const limit = parseInt(searchParams.get('limit') || '24');

  // Single listing by slug
  if (slug) {
    const { data, error } = await supabase
      .from('directory_listings')
      .select('*, directory_badges(id, badge_type, badge_label, badge_color, badge_icon, is_active, earned_at), directory_feedback(id, rating, feedback_text, feedback_type, submitter_name, created_at)')
      .eq('slug', slug)
      .eq('is_published', true)
      .single();

    if (error) return NextResponse.json({ error: 'Listing not found' }, { status: 404 });

    // Filter active badges only
    if (data.directory_badges) {
      data.directory_badges = data.directory_badges.filter((b: any) => b.is_active);
    }
    return NextResponse.json(applyPhotoGating(data));
  }

  // Search/list
  let query = supabase
    .from('directory_listings')
    .select('id, business_name, slug, industry, subcategories, description, phone, website, city, state, zip_code, logo_url, cover_image_url, gallery_images, tier, is_claimed, trust_score, avg_feedback_rating, total_feedback_count, directory_badges(id, badge_type, badge_label, badge_color, is_active)')
    .eq('is_published', true)
    .order('trust_score', { ascending: false })
    .limit(limit);

  if (industry && industry !== 'all') query = query.eq('industry', industry);
  if (city) query = query.ilike('city', `%${city}%`);
  if (zip) query = query.eq('zip_code', zip);
  if (tier && tier !== 'all') query = query.eq('tier', tier);
  if (search) query = query.or(`business_name.ilike.%${search}%,description.ilike.%${search}%,industry.ilike.%${search}%`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Filter active badges + apply photo gating
  const listings = (data || []).map((l: any) => {
    const gated = applyPhotoGating(l);
    return {
      ...gated,
      directory_badges: (l.directory_badges || []).filter((b: any) => b.is_active),
    };
  });

  return NextResponse.json(listings);
}

// POST /api/directory - Create listing (AI scraper or manual)
export async function POST(request: NextRequest) {
  const supabase = getServiceClient();
  const body = await request.json();
  const { business_name, industry, website, phone, email, address_line1, city, state, zip_code, description, tenant_id, logo_url } = body;

  if (!business_name || !industry) {
    return NextResponse.json({ error: 'business_name and industry required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('directory_listings')
    .insert({
      business_name, industry, description: description || null,
      website: website || null, phone: phone || null, email: email || null,
      address_line1: address_line1 || null, city: city || null, state: state || null, zip_code: zip_code || null,
      logo_url: logo_url || null,
      tenant_id: tenant_id || null,
      tier: 'free',
      is_claimed: !!tenant_id,
      claimed_by: null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

// PATCH /api/directory - Update listing
export async function PATCH(request: NextRequest) {
  const supabase = getServiceClient();
  const body = await request.json();
  const { id, ...updates } = body;

  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const { data, error } = await supabase
    .from('directory_listings')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
