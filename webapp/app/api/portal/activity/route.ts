import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { createServerClient } from '@/lib/supabase/server';

const EVENT_DESCRIPTIONS: Record<string, string> = {
  view: 'Someone viewed your listing',
  click: 'Someone clicked your listing',
  call: 'Someone tapped to call',
  direction: 'Someone requested directions',
  website: 'Someone visited your website',
};

/**
 * GET /api/portal/activity?listing_id=xxx — Recent activity feed for a listing
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof Response) return authResult;
    const { user } = authResult;

    const { searchParams } = new URL(request.url);
    const listingId = searchParams.get('listing_id');

    if (!listingId) {
      return NextResponse.json({ error: 'listing_id required' }, { status: 400 });
    }

    const service = createServerClient();

    // Verify ownership
    const { data: listing } = await service
      .from('directory_listings')
      .select('id, claimed_by')
      .eq('id', listingId)
      .single();

    if (!listing || listing.claimed_by !== user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Fetch last 20 events and last 10 sentiment logs in parallel
    const [statsRes, sentimentRes] = await Promise.all([
      service
        .from('listing_stats')
        .select('event_type, created_at, referrer')
        .eq('listing_id', listingId)
        .order('created_at', { ascending: false })
        .limit(20),
      service
        .from('sentiment_logs')
        .select('rating, comment, created_at')
        .eq('listing_id', listingId)
        .order('created_at', { ascending: false })
        .limit(10),
    ]);

    // Map stats events to activity items
    const statsActivities = (statsRes.data || []).map((event) => ({
      type: event.event_type,
      description: EVENT_DESCRIPTIONS[event.event_type] || `Event: ${event.event_type}`,
      timestamp: event.created_at,
      ...(event.referrer ? { referrer: event.referrer } : {}),
    }));

    // Map sentiment logs to activity items
    const sentimentActivities = (sentimentRes.data || []).map((log) => ({
      type: 'feedback',
      description: `New feedback received${log.rating ? ` (${log.rating}/5)` : ''}`,
      timestamp: log.created_at,
      ...(log.comment ? { comment: log.comment } : {}),
      ...(log.rating ? { rating: log.rating } : {}),
    }));

    // Merge and sort by timestamp desc, limit to 20
    const activities = [...statsActivities, ...sentimentActivities]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 20);

    return NextResponse.json({ activities });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[PORTAL/ACTIVITY] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
