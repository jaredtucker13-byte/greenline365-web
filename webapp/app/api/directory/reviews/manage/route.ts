import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
function getServiceClient() { return createClient(supabaseUrl, supabaseServiceKey); }

/**
 * GET /api/directory/reviews/manage?listing_id=xxx
 * Owner-only: returns reviews WITH AI drafts, settings, and activity log
 */

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const listingId = searchParams.get('listing_id');

    if (!listingId) return NextResponse.json({ error: 'listing_id required' }, { status: 400 });

    const service = getServiceClient();
    const { data: listing } = await service
      .from('directory_listings')
      .select('id, business_name, claimed_by, metadata')
      .eq('id', listingId)
      .single();

    if (!listing || listing.claimed_by !== user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const metadata = listing.metadata || {};
    const reviews = metadata.gl365_reviews || [];
    const settings = metadata.review_settings || { auto_respond: false };
    const activityLog = metadata.review_activity_log || [];

    // Calculate stats
    const totalReviews = reviews.length;
    const avgRating = totalReviews > 0 ? reviews.reduce((s: number, r: any) => s + r.rating, 0) / totalReviews : 0;
    const pendingDrafts = reviews.filter((r: any) => r.ai_draft?.status === 'pending' && !r.response).length;
    const respondedCount = reviews.filter((r: any) => r.response).length;
    const autoResponded = reviews.filter((r: any) => r.response?.method === 'ai_auto').length;

    // Sort newest first
    reviews.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json({
      reviews,
      settings,
      stats: {
        total_reviews: totalReviews,
        average_rating: Math.round(avgRating * 10) / 10,
        pending_drafts: pendingDrafts,
        responded: respondedCount,
        response_rate: totalReviews > 0 ? Math.round((respondedCount / totalReviews) * 100) : 0,
        auto_responded: autoResponded,
      },
      activity_log: activityLog.slice(-20), // Last 20 events
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
