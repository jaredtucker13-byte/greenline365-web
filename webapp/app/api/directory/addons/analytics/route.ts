import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
function getServiceClient() { return createClient(supabaseUrl, supabaseServiceKey); }

/**
 * Analytics Pro API
 * 
 * GET  /api/directory/addons/analytics?listing_id=xxx — Get analytics (requires addon)
 * POST /api/directory/addons/analytics                — Track an event (public — views, clicks, calls)
 */

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const listingId = searchParams.get('listing_id');

    if (!listingId) {
      return NextResponse.json({ error: 'listing_id required' }, { status: 400 });
    }

    const service = getServiceClient();
    const { data: listing } = await service
      .from('directory_listings')
      .select('id, claimed_by, metadata')
      .eq('id', listingId)
      .single();

    if (!listing || listing.claimed_by !== user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const metadata = listing.metadata || {};
    const analyticsEvents: any[] = metadata.analytics_events || [];
    const hasAnalyticsPro = metadata.addons?.analytics_pro?.active;

    // Basic stats (available to all claimed listings)
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const recentEvents = analyticsEvents.filter(e => new Date(e.ts) > thirtyDaysAgo);
    const weekEvents = analyticsEvents.filter(e => new Date(e.ts) > sevenDaysAgo);

    const summary = {
      total_views: recentEvents.filter(e => e.type === 'view').length,
      total_clicks: recentEvents.filter(e => e.type === 'click').length,
      total_calls: recentEvents.filter(e => e.type === 'call').length,
      total_map_clicks: recentEvents.filter(e => e.type === 'map').length,
      total_website_clicks: recentEvents.filter(e => e.type === 'website').length,
      period: '30d',
    };

    // Pro analytics — daily breakdown (only if addon active)
    if (hasAnalyticsPro) {
      const dailyBreakdown: Record<string, { views: number; clicks: number; calls: number }> = {};
      recentEvents.forEach(e => {
        const day = new Date(e.ts).toISOString().split('T')[0];
        if (!dailyBreakdown[day]) dailyBreakdown[day] = { views: 0, clicks: 0, calls: 0 };
        if (e.type === 'view') dailyBreakdown[day].views++;
        if (e.type === 'click' || e.type === 'website' || e.type === 'map') dailyBreakdown[day].clicks++;
        if (e.type === 'call') dailyBreakdown[day].calls++;
      });

      return NextResponse.json({
        summary,
        weekly: {
          views: weekEvents.filter(e => e.type === 'view').length,
          clicks: weekEvents.filter(e => e.type === 'click' || e.type === 'website' || e.type === 'map').length,
          calls: weekEvents.filter(e => e.type === 'call').length,
        },
        daily: dailyBreakdown,
        has_pro: true,
      });
    }

    return NextResponse.json({ summary, has_pro: false });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Track an event (public — no auth required)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { listing_id, event_type } = body;

    if (!listing_id || !event_type) {
      return NextResponse.json({ error: 'listing_id and event_type required' }, { status: 400 });
    }

    const validEvents = ['view', 'click', 'call', 'map', 'website', 'coupon_view'];
    if (!validEvents.includes(event_type)) {
      return NextResponse.json({ error: 'Invalid event_type' }, { status: 400 });
    }

    const service = getServiceClient();
    const { data: listing } = await service
      .from('directory_listings')
      .select('id, metadata')
      .eq('id', listing_id)
      .single();

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    const metadata = listing.metadata || {};
    const events: any[] = metadata.analytics_events || [];

    // Keep only last 90 days of events to avoid bloat
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const trimmedEvents = events.filter(e => new Date(e.ts) > ninetyDaysAgo);

    trimmedEvents.push({
      type: event_type,
      ts: new Date().toISOString(),
    });

    // Track transaction fee ONLY for high-value interactions (calls, coupon redemptions)
    const feeEvents = ['call'];
    const transactions = metadata.transactions || [];
    if (feeEvents.includes(event_type)) {
      transactions.push({
        type: event_type,
        fee: 0.60,
        timestamp: new Date().toISOString(),
      });
    }

    await service
      .from('directory_listings')
      .update({ metadata: { ...metadata, analytics_events: trimmedEvents, transactions }, updated_at: new Date().toISOString() })
      .eq('id', listing_id);

    return NextResponse.json({ tracked: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
