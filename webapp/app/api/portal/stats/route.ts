import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { createServerClient } from '@/lib/supabase/server';
import { resolveFeatures, hasFeature } from '@/lib/services/feature-resolution';

/**
 * GET /api/portal/stats?listing_id=xxx — Get listing stats
 *
 * Returns basic stats for all tiers.
 * Returns advanced stats (charts data) only if analytics_advanced feature is true.
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

  // Verify ownership
  const { data: listing } = await service
    .from('directory_listings')
    .select('id, claimed_by, total_feedback_count, avg_feedback_rating, trust_score')
    .eq('id', listingId)
    .single();

  if (!listing || listing.claimed_by !== user.id) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  // Basic stats from listing_stats table
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [viewsRes, clicksRes] = await Promise.all([
    service
      .from('listing_stats')
      .select('id', { count: 'exact', head: true })
      .eq('listing_id', listingId)
      .eq('event_type', 'view')
      .gte('created_at', thirtyDaysAgo.toISOString()),
    service
      .from('listing_stats')
      .select('id', { count: 'exact', head: true })
      .eq('listing_id', listingId)
      .in('event_type', ['click', 'call', 'website', 'direction'])
      .gte('created_at', thirtyDaysAgo.toISOString()),
  ]);

  const basicStats = {
    views_30d: viewsRes.count || 0,
    clicks_30d: clicksRes.count || 0,
    reviews_count: listing.total_feedback_count || 0,
    avg_rating: listing.avg_feedback_rating || 0,
    trust_score: listing.trust_score || 0,
  };

  // Check for advanced analytics
  const features = await resolveFeatures(user.id, listingId);
  const hasAdvanced = hasFeature(features, 'analytics_advanced');

  let advancedStats = null;

  if (hasAdvanced) {
    // Get daily view counts for chart data (last 30 days)
    const { data: dailyStats } = await service
      .from('listing_stats')
      .select('event_type, created_at')
      .eq('listing_id', listingId)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: true });

    // Group by day
    const dailyViews: Record<string, number> = {};
    const dailyClicks: Record<string, number> = {};

    for (const stat of dailyStats || []) {
      const day = stat.created_at.split('T')[0];
      if (stat.event_type === 'view') {
        dailyViews[day] = (dailyViews[day] || 0) + 1;
      } else {
        dailyClicks[day] = (dailyClicks[day] || 0) + 1;
      }
    }

    // Get top referrers
    const { data: referrerData } = await service
      .from('listing_stats')
      .select('referrer')
      .eq('listing_id', listingId)
      .not('referrer', 'is', null)
      .gte('created_at', thirtyDaysAgo.toISOString());

    const referrerCounts: Record<string, number> = {};
    for (const r of referrerData || []) {
      if (r.referrer) {
        referrerCounts[r.referrer] = (referrerCounts[r.referrer] || 0) + 1;
      }
    }

    const topReferrers = Object.entries(referrerCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([source, count]) => ({ source, count }));

    // Click-through rate
    const totalViews = basicStats.views_30d;
    const totalClicks = basicStats.clicks_30d;
    const ctr = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(1) : '0.0';

    advancedStats = {
      daily_views: dailyViews,
      daily_clicks: dailyClicks,
      top_referrers: topReferrers,
      click_through_rate: parseFloat(ctr),
    };
  }

  return NextResponse.json({
    basic: basicStats,
    advanced: advancedStats,
    has_advanced: hasAdvanced,
  });
}
