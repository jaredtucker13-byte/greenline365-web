import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { createServerClient } from '@/lib/supabase/server';

interface Review {
  id: string;
  reviewer_name: string;
  rating: number;
  text: string;
  created_at: string;
  response: { text: string; responded_at: string; method: string } | null;
  ai_draft: { text: string; generated_at: string; status: string } | null;
}

/**
 * GET /api/portal/reviews?listing_id=xxx — Owner: get reviews with AI drafts
 */
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof Response) return authResult;
  const { user } = authResult;

  const { searchParams } = new URL(request.url);
  const listingId = searchParams.get('listing_id');

  if (!listingId) {
    return NextResponse.json({ error: 'listing_id required' }, { status: 400 });
  }

  const service = createServerClient();

  const { data: listing } = await service
    .from('directory_listings')
    .select('id, claimed_by, metadata')
    .eq('id', listingId)
    .single();

  if (!listing || listing.claimed_by !== user.id) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  const metadata = listing.metadata || {};
  const reviews: Review[] = (metadata.gl365_reviews || []).sort(
    (a: Review, b: Review) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const settings = metadata.review_settings || {};

  return NextResponse.json({ reviews, settings });
}
