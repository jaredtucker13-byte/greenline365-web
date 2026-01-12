import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Analytics API - Real Data for Two-Sided Metrics
 * 
 * 1. Platform metrics (prove GreenLine365 ROI)
 * 2. Tenant metrics (help their social growth)
 * 3. Pattern discovery (insights they didn't know)
 */

interface AnalyticsQuery {
  action: 'overview' | 'content' | 'events' | 'patterns' | 'timeline';
  dateRange?: 'today' | '7d' | '30d' | '90d' | 'all';
  category?: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: AnalyticsQuery = await request.json();
    const { action, dateRange = '30d' } = body;

    // Calculate date cutoff
    const cutoffDate = getDateCutoff(dateRange);

    switch (action) {
      case 'overview':
        return getOverviewMetrics(supabase, user.id, cutoffDate);
      case 'content':
        return getContentMetrics(supabase, user.id, cutoffDate);
      case 'events':
        return getEventMetrics(supabase, user.id, cutoffDate, body.category);
      case 'patterns':
        return discoverPatterns(supabase, user.id, cutoffDate);
      case 'timeline':
        return getActivityTimeline(supabase, user.id, cutoffDate);
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('[Analytics API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function getDateCutoff(range: string): Date {
  const now = new Date();
  switch (range) {
    case 'today':
      return new Date(now.setHours(0, 0, 0, 0));
    case '7d':
      return new Date(now.setDate(now.getDate() - 7));
    case '30d':
      return new Date(now.setDate(now.getDate() - 30));
    case '90d':
      return new Date(now.setDate(now.getDate() - 90));
    case 'all':
      return new Date('2020-01-01');
    default:
      return new Date(now.setDate(now.getDate() - 30));
  }
}

async function getOverviewMetrics(supabase: any, userId: string, since: Date) {
  // Parallel queries for performance
  const [eventsResult, blogsResult, knowledgeResult] = await Promise.all([
    // Total events by category
    supabase
      .from('memory_event_journal')
      .select('event_category, event_type')
      .eq('user_id', userId)
      .gte('occurred_at', since.toISOString()),
    
    // Blog posts
    supabase
      .from('blog_posts')
      .select('id, status, created_at')
      .eq('author_id', userId)
      .gte('created_at', since.toISOString()),
    
    // Knowledge chunks
    supabase
      .from('memory_knowledge_chunks')
      .select('id, category')
      .eq('user_id', userId)
      .eq('is_active', true),
  ]);

  const events = eventsResult.data || [];
  const blogs = blogsResult.data || [];
  const knowledge = knowledgeResult.data || [];

  // Calculate metrics
  const eventsByCategory = events.reduce((acc: any, e: any) => {
    acc[e.event_category] = (acc[e.event_category] || 0) + 1;
    return acc;
  }, {});

  const eventsByType = events.reduce((acc: any, e: any) => {
    acc[e.event_type] = (acc[e.event_type] || 0) + 1;
    return acc;
  }, {});

  const blogsByStatus = blogs.reduce((acc: any, b: any) => {
    acc[b.status] = (acc[b.status] || 0) + 1;
    return acc;
  }, {});

  return NextResponse.json({
    summary: {
      totalEvents: events.length,
      totalBlogs: blogs.length,
      publishedBlogs: blogsByStatus['published'] || 0,
      draftBlogs: blogsByStatus['draft'] || 0,
      knowledgeChunks: knowledge.length,
      imagesGenerated: eventsByType['image_generated'] || 0,
      emailsSent: eventsByType['email_sent'] || 0,
      smsSent: eventsByType['sms_sent'] || 0,
    },
    breakdown: {
      byCategory: eventsByCategory,
      byType: eventsByType,
      blogStatus: blogsByStatus,
    },
    period: {
      since: since.toISOString(),
      until: new Date().toISOString(),
    },
  });
}

async function getContentMetrics(supabase: any, userId: string, since: Date) {
  // Get blog posts with analytics
  const { data: blogs } = await supabase
    .from('blog_posts')
    .select(`
      id, title, status, created_at, published_at,
      blog_analytics(views, unique_visitors, avg_time_on_page)
    `)
    .eq('author_id', userId)
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: false });

  // Get image generation events
  const { data: imageEvents } = await supabase
    .from('memory_event_journal')
    .select('metadata, occurred_at')
    .eq('user_id', userId)
    .eq('event_type', 'image_generated')
    .gte('occurred_at', since.toISOString());

  // Calculate content velocity (content created per week)
  const weeksSinceStart = Math.max(1, (Date.now() - since.getTime()) / (7 * 24 * 60 * 60 * 1000));
  const contentVelocity = ((blogs?.length || 0) / weeksSinceStart).toFixed(1);

  return NextResponse.json({
    blogs: {
      total: blogs?.length || 0,
      list: blogs?.slice(0, 10) || [],
      velocity: `${contentVelocity} posts/week`,
    },
    images: {
      total: imageEvents?.length || 0,
      recentPrompts: imageEvents?.slice(0, 5).map((e: any) => ({
        prompt: e.metadata?.prompt?.slice(0, 100),
        model: e.metadata?.model,
        date: e.occurred_at,
      })) || [],
    },
  });
}

async function getEventMetrics(supabase: any, userId: string, since: Date, category?: string) {
  let query = supabase
    .from('memory_event_journal')
    .select('*')
    .eq('user_id', userId)
    .gte('occurred_at', since.toISOString())
    .order('occurred_at', { ascending: false })
    .limit(100);

  if (category) {
    query = query.eq('event_category', category);
  }

  const { data: events } = await query;

  // Group by day for trend analysis
  const byDay = (events || []).reduce((acc: any, e: any) => {
    const day = new Date(e.occurred_at).toISOString().split('T')[0];
    if (!acc[day]) acc[day] = { total: 0, byType: {} };
    acc[day].total++;
    acc[day].byType[e.event_type] = (acc[day].byType[e.event_type] || 0) + 1;
    return acc;
  }, {});

  return NextResponse.json({
    events: events || [],
    byDay,
    total: events?.length || 0,
  });
}

async function discoverPatterns(supabase: any, userId: string, since: Date) {
  // Get all events for pattern analysis
  const { data: events } = await supabase
    .from('memory_event_journal')
    .select('event_type, event_category, metadata, occurred_at, outcome')
    .eq('user_id', userId)
    .gte('occurred_at', since.toISOString())
    .order('occurred_at', { ascending: false });

  if (!events || events.length === 0) {
    return NextResponse.json({
      patterns: [],
      insights: ['Not enough data yet. Keep using the platform to discover patterns!'],
    });
  }

  const patterns: string[] = [];
  const insights: string[] = [];

  // Pattern 1: Most active day of week
  const dayActivity: Record<number, number> = {};
  events.forEach((e: any) => {
    const day = new Date(e.occurred_at).getDay();
    dayActivity[day] = (dayActivity[day] || 0) + 1;
  });
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const mostActiveDay = Object.entries(dayActivity).sort((a, b) => b[1] - a[1])[0];
  if (mostActiveDay) {
    patterns.push(`Most active on ${dayNames[parseInt(mostActiveDay[0])]}`);
  }

  // Pattern 2: Most active hour
  const hourActivity: Record<number, number> = {};
  events.forEach((e: any) => {
    const hour = new Date(e.occurred_at).getHours();
    hourActivity[hour] = (hourActivity[hour] || 0) + 1;
  });
  const mostActiveHour = Object.entries(hourActivity).sort((a, b) => b[1] - a[1])[0];
  if (mostActiveHour) {
    const hour = parseInt(mostActiveHour[0]);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    patterns.push(`Peak activity around ${displayHour}${period}`);
  }

  // Pattern 3: Content creation streak
  const uniqueDays = new Set(events.map((e: any) => new Date(e.occurred_at).toISOString().split('T')[0]));
  if (uniqueDays.size >= 7) {
    patterns.push(`Active on ${uniqueDays.size} different days`);
  }

  // Pattern 4: Most common event type
  const typeCount: Record<string, number> = {};
  events.forEach((e: any) => {
    typeCount[e.event_type] = (typeCount[e.event_type] || 0) + 1;
  });
  const topEventType = Object.entries(typeCount).sort((a, b) => b[1] - a[1])[0];
  if (topEventType) {
    const readableType = topEventType[0].replace(/_/g, ' ');
    patterns.push(`Top activity: ${readableType} (${topEventType[1]} times)`);
  }

  // Insights based on patterns
  const imageCount = typeCount['image_generated'] || 0;
  const blogCount = typeCount['blog_created'] || typeCount['blog_published'] || 0;
  
  if (imageCount > blogCount * 2) {
    insights.push('💡 You generate a lot of images! Consider publishing more blog posts to maximize their value.');
  }
  
  if (blogCount > 0 && imageCount === 0) {
    insights.push('💡 Try using the AI image generator to make your blog posts more visually engaging.');
  }

  const emailCount = typeCount['email_sent'] || 0;
  if (blogCount > 3 && emailCount === 0) {
    insights.push('💡 You have content ready! Consider sending an email campaign to promote your latest posts.');
  }

  if (events.length >= 10) {
    insights.push(`📊 You've logged ${events.length} activities. The AI is learning your patterns!`);
  }

  return NextResponse.json({
    patterns,
    insights,
    stats: {
      totalEvents: events.length,
      uniqueDays: uniqueDays.size,
      topEventTypes: Object.entries(typeCount).sort((a, b) => b[1] - a[1]).slice(0, 5),
    },
  });
}

async function getActivityTimeline(supabase: any, userId: string, since: Date) {
  const { data: events } = await supabase
    .from('memory_event_journal')
    .select('event_type, event_category, title, description, occurred_at, outcome, metadata')
    .eq('user_id', userId)
    .gte('occurred_at', since.toISOString())
    .order('occurred_at', { ascending: false })
    .limit(50);

  // Group by date
  const grouped = (events || []).reduce((acc: any, e: any) => {
    const date = new Date(e.occurred_at).toISOString().split('T')[0];
    if (!acc[date]) acc[date] = [];
    acc[date].push({
      type: e.event_type,
      category: e.event_category,
      title: e.title,
      description: e.description,
      time: new Date(e.occurred_at).toLocaleTimeString(),
      outcome: e.outcome,
    });
    return acc;
  }, {});

  return NextResponse.json({
    timeline: grouped,
    totalEvents: events?.length || 0,
  });
}

// GET endpoint for simple overview
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '30d';
    const cutoff = getDateCutoff(range);

    return getOverviewMetrics(supabase, user.id, cutoff);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
