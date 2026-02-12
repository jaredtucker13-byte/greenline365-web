import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
function getServiceClient() { return createClient(supabaseUrl, supabaseServiceKey); }

/**
 * Featured Boost API
 * 
 * GET /api/directory/addons/featured — Get all currently featured listings (public)
 * Used by the homepage "Featured Listings" section to show boosted businesses
 */

export async function GET() {
  const service = getServiceClient();

  const { data: listings } = await service
    .from('directory_listings')
    .select('id, business_name, slug, industry, city, state, cover_image_url, tier, avg_feedback_rating, metadata')
    .eq('is_claimed', true);

  if (!listings) return NextResponse.json({ featured: [] });

  const now = new Date();
  const featured = listings.filter(l => {
    const boost = l.metadata?.addons?.featured_boost;
    return boost?.active && boost?.expires_at && new Date(boost.expires_at) > now;
  });

  return NextResponse.json({ featured });
}
