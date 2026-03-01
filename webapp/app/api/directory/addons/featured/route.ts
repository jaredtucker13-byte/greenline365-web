import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
function getServiceClient() { return createClient(supabaseUrl, supabaseServiceKey); }

/**
 * Featured Boost API
 *
 * GET /api/directory/addons/featured — Get featured listings (public)
 *
 * Query params:
 *   ?limit=12      — max slots to return (default: all active boosts)
 *   ?backfill=true — fill remaining slots with random claimed listings
 *
 * Used by BoostedShowcase component and homepage "Featured Listings" section.
 */

export async function GET(request: NextRequest) {
  const service = getServiceClient();
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '0', 10);
  const backfill = searchParams.get('backfill') === 'true';

  // Fetch all claimed listings with enough data for both boost check and display
  const { data: listings } = await service
    .from('directory_listings')
    .select('id, business_name, slug, industry, city, state, cover_image_url, tier, avg_feedback_rating, metadata')
    .eq('is_claimed', true);

  if (!listings) return NextResponse.json({ slots: [], boostedCount: 0, backfilledCount: 0, featured: [] });

  const now = new Date();

  // Separate boosted (sponsored) listings from the rest
  const boosted: Array<typeof listings[0] & { is_sponsored: boolean }> = [];
  const nonBoosted: typeof listings = [];

  for (const l of listings) {
    const boost = l.metadata?.addons?.featured_boost;
    if (boost?.active && boost?.expires_at && new Date(boost.expires_at) > now) {
      boosted.push({ ...l, is_sponsored: true });
    } else {
      nonBoosted.push(l);
    }
  }

  // Build slots array
  let slots: Array<typeof listings[0] & { is_sponsored: boolean }> = [...boosted];

  // Backfill remaining slots with random claimed listings if requested
  if (backfill && limit > 0 && slots.length < limit) {
    const remaining = limit - slots.length;
    // Shuffle non-boosted listings and take what we need
    const shuffled = nonBoosted.sort(() => Math.random() - 0.5);
    const backfillSlots = shuffled.slice(0, remaining).map(l => ({ ...l, is_sponsored: false }));
    slots = [...slots, ...backfillSlots];
  }

  // Apply limit if specified
  if (limit > 0) {
    slots = slots.slice(0, limit);
  }

  return NextResponse.json({
    slots,
    boostedCount: boosted.length,
    backfilledCount: Math.max(0, slots.length - boosted.length),
    // Backwards compatibility: also return `featured` array
    featured: boosted,
  });
}
