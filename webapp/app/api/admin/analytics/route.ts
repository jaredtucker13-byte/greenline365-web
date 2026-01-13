import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * ADMIN-ONLY Analytics API
 * Platform-level metrics for GreenLine365 ROI tracking
 * 
 * This is NOT visible to tenants - only platform admins
 * Used for:
 * - Marketing campaigns
 * - Landing page stats (once we have real data)
 * - Investor reporting
 * - Business decisions
 */

// Admin email addresses that can access this endpoint
const ADMIN_EMAILS = [
  'greenline365help@gmail.com',
  'admin@greenline365.com',
  // Add more admin emails as needed
];

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    if (!ADMIN_EMAILS.includes(user.email || '')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '30d';
    const cutoff = getDateCutoff(range);

    return getPlatformMetrics(supabase, cutoff);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    if (!ADMIN_EMAILS.includes(user.email || '')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { action, dateRange = '30d' } = body;
    const cutoff = getDateCutoff(dateRange);

    switch (action) {
      case 'platform':
        return getPlatformMetrics(supabase, cutoff);
      case 'tenants':
        return getTenantOverview(supabase, cutoff);
      case 'growth':
        return getGrowthMetrics(supabase, cutoff);
      case 'landing-stats':
        return getLandingPageStats(supabase);
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function getDateCutoff(range: string): Date {
  const now = new Date();
  switch (range) {
    case 'today': return new Date(now.setHours(0, 0, 0, 0));
    case '7d': return new Date(now.setDate(now.getDate() - 7));
    case '30d': return new Date(now.setDate(now.getDate() - 30));
    case '90d': return new Date(now.setDate(now.getDate() - 90));
    case 'all': return new Date('2020-01-01');
    default: return new Date(now.setDate(now.getDate() - 30));
  }
}

/**
 * Platform-wide metrics (all tenants aggregated)
 */
async function getPlatformMetrics(supabase: any, since: Date) {
  // Get all unique users (tenants)
  const { data: profiles } = await supabase
    .from('memory_core_profiles')
    .select('user_id, display_name, business_name, created_at');

  // Get total events across all users
  const { data: events } = await supabase
    .from('memory_event_journal')
    .select('event_type, user_id, occurred_at')
    .gte('occurred_at', since.toISOString());

  // Get total blog posts
  const { data: blogs } = await supabase
    .from('blog_posts')
    .select('id, status, author_id')
    .gte('created_at', since.toISOString());

  // Get total knowledge chunks
  const { data: knowledge } = await supabase
    .from('memory_knowledge_chunks')
    .select('id, user_id')
    .eq('is_active', true);

  // Aggregate metrics
  const totalTenants = profiles?.length || 0;
  const activeTenants = new Set(events?.map((e: any) => e.user_id) || []).size;
  const totalEvents = events?.length || 0;
  const totalBlogs = blogs?.length || 0;
  const publishedBlogs = blogs?.filter((b: any) => b.status === 'published').length || 0;
  const totalKnowledge = knowledge?.length || 0;

  // Event breakdown
  const eventsByType = (events || []).reduce((acc: any, e: any) => {
    acc[e.event_type] = (acc[e.event_type] || 0) + 1;
    return acc;
  }, {});

  return NextResponse.json({
    platformMetrics: {
      totalTenants,
      activeTenants,
      totalEvents,
      totalBlogs,
      publishedBlogs,
      totalKnowledge,
      avgEventsPerTenant: totalTenants > 0 ? (totalEvents / totalTenants).toFixed(1) : 0,
      avgBlogsPerTenant: totalTenants > 0 ? (totalBlogs / totalTenants).toFixed(1) : 0,
    },
    eventBreakdown: eventsByType,
    period: {
      since: since.toISOString(),
      until: new Date().toISOString(),
    },
  });
}

/**
 * Overview of all tenants
 */
async function getTenantOverview(supabase: any, since: Date) {
  // Get all profiles with their activity counts
  const { data: profiles } = await supabase
    .from('memory_core_profiles')
    .select('user_id, display_name, business_name, industry, location, created_at');

  if (!profiles || profiles.length === 0) {
    return NextResponse.json({ tenants: [], total: 0 });
  }

  // Get activity counts per user
  const { data: events } = await supabase
    .from('memory_event_journal')
    .select('user_id')
    .gte('occurred_at', since.toISOString());

  const activityByUser = (events || []).reduce((acc: any, e: any) => {
    acc[e.user_id] = (acc[e.user_id] || 0) + 1;
    return acc;
  }, {});

  const tenants = profiles.map((p: any) => ({
    userId: p.user_id,
    displayName: p.display_name,
    businessName: p.business_name,
    industry: p.industry,
    location: p.location,
    joinedAt: p.created_at,
    activityCount: activityByUser[p.user_id] || 0,
  })).sort((a: any, b: any) => b.activityCount - a.activityCount);

  return NextResponse.json({
    tenants,
    total: tenants.length,
  });
}

/**
 * Growth metrics over time
 */
async function getGrowthMetrics(supabase: any, since: Date) {
  // Get signups by day
  const { data: profiles } = await supabase
    .from('memory_core_profiles')
    .select('created_at')
    .gte('created_at', since.toISOString())
    .order('created_at');

  // Group by day
  const signupsByDay = (profiles || []).reduce((acc: any, p: any) => {
    const day = new Date(p.created_at).toISOString().split('T')[0];
    acc[day] = (acc[day] || 0) + 1;
    return acc;
  }, {});

  // Get events by day
  const { data: events } = await supabase
    .from('memory_event_journal')
    .select('occurred_at')
    .gte('occurred_at', since.toISOString());

  const eventsByDay = (events || []).reduce((acc: any, e: any) => {
    const day = new Date(e.occurred_at).toISOString().split('T')[0];
    acc[day] = (acc[day] || 0) + 1;
    return acc;
  }, {});

  return NextResponse.json({
    signupsByDay,
    eventsByDay,
    totalNewSignups: profiles?.length || 0,
    totalEvents: events?.length || 0,
  });
}

/**
 * Stats for landing page (to replace fake "500+" numbers)
 * Only returns real data - returns 0 if no data
 */
async function getLandingPageStats(supabase: any) {
  // Get real counts
  const { count: totalTenants } = await supabase
    .from('memory_core_profiles')
    .select('*', { count: 'exact', head: true });

  const { count: totalBlogs } = await supabase
    .from('blog_posts')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'published');

  const { count: totalImages } = await supabase
    .from('memory_event_journal')
    .select('*', { count: 'exact', head: true })
    .eq('event_type', 'image_generated');

  // Calculate "hours saved" estimate (rough)
  // Assume: 1 blog = 2 hours, 1 image = 0.5 hours saved
  const hoursSaved = ((totalBlogs || 0) * 2) + ((totalImages || 0) * 0.5);

  return NextResponse.json({
    // These are the REAL stats to show on landing page
    businesses: totalTenants || 0,
    blogsCreated: totalBlogs || 0,
    imagesGenerated: totalImages || 0,
    hoursSaved: Math.round(hoursSaved),
    
    // Formatted for display
    display: {
      businesses: formatNumber(totalTenants || 0),
      blogs: formatNumber(totalBlogs || 0),
      images: formatNumber(totalImages || 0),
      hours: formatNumber(Math.round(hoursSaved)),
    },
    
    // When to show real stats vs placeholder
    showRealStats: (totalTenants || 0) >= 10,
  });
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}
