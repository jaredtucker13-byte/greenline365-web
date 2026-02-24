/**
 * Daily Trend Hunter Cron — Native replacement for n8n GL365_daily_trend_hunter.json
 *
 * Runs daily at 7 AM. For each active client business:
 * 1. Searches for local trends, events, and news in their city
 * 2. Validates content through "Vibe Rules" (brand safety)
 * 3. Generates content suggestions tied to local trends
 * 4. Stores in brain + notifies business owner
 *
 * GET /api/cron/daily-trend-hunter
 *   Protected by CRON_SECRET header.
 *
 * POST /api/cron/daily-trend-hunter
 *   Manual trigger for a specific business.
 *   Body: { businessId: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { callOpenRouter, callOpenRouterJSON } from '@/lib/openrouter';
import { notify } from '@/lib/notifications';

// ── Vibe Rules — Brand Safety Gate ─────────────────────────────────

const FORBIDDEN_WORDS = [
  'synergy', 'blast', 'skyrocket', 'guaranteed', '100%',
  'crypto', 'investment', 'get rich', 'make money fast',
  'limited time only', 'act now', 'once in a lifetime',
];

const COPYRIGHT_RISKS = [
  'disney', 'marvel', 'star wars', 'mickey mouse', 'nike',
  'nintendo', 'coca-cola', 'mcdonald', 'starbucks',
];

function vibeCheck(text: string): { approved: boolean; violations: string[] } {
  const lower = text.toLowerCase();
  const violations: string[] = [];

  for (const word of FORBIDDEN_WORDS) {
    if (lower.includes(word)) {
      violations.push(`Forbidden word: "${word}"`);
    }
  }

  for (const brand of COPYRIGHT_RISKS) {
    if (lower.includes(brand)) {
      violations.push(`Copyright risk: "${brand}"`);
    }
  }

  return {
    approved: violations.length === 0,
    violations,
  };
}

// ── Cron Handler (scheduled) ───────────────────────────────────────

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServerClient();

  try {
    // Get all active businesses with their location data
    const { data: businesses } = await supabase
      .from('businesses')
      .select('id, name, city, state, industry, context_config')
      .eq('is_active', true);

    if (!businesses?.length) {
      return NextResponse.json({ message: 'No active businesses', trends: 0 });
    }

    let trendsGenerated = 0;
    let errors = 0;

    for (const business of businesses) {
      try {
        const city = business.city || business.context_config?.city;
        if (!city) continue; // Can't hunt trends without a location

        const result = await huntTrendsForBusiness(supabase, business);
        if (result) trendsGenerated++;
      } catch (error) {
        errors++;
        console.error(`[Trend Hunter] Error for ${business.name}:`, error);
      }
    }

    return NextResponse.json({
      message: `Processed ${businesses.length} businesses`,
      trends_generated: trendsGenerated,
      errors,
    });

  } catch (error: any) {
    console.error('[Trend Hunter] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ── Manual Trigger (for specific business) ─────────────────────────

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const body = await request.json();
    const { businessId } = body;

    if (!businessId) {
      return NextResponse.json({ error: 'businessId required' }, { status: 400 });
    }

    const { data: business } = await supabase
      .from('businesses')
      .select('id, name, city, state, industry, context_config')
      .eq('id', businessId)
      .single();

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const result = await huntTrendsForBusiness(supabase, business);

    return NextResponse.json({
      success: true,
      trends: result,
    });

  } catch (error: any) {
    console.error('[Trend Hunter] Manual trigger error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ── Core Trend Hunting Logic ───────────────────────────────────────

interface TrendResult {
  trends: Array<{
    headline: string;
    summary: string;
    content_angle: string;
    suggested_post: string;
    hashtags: string[];
    relevance: string;
  }>;
  city: string;
  generated_at: string;
}

async function huntTrendsForBusiness(supabase: any, business: any): Promise<TrendResult | null> {
  const city = business.city || business.context_config?.city;
  const state = business.state || business.context_config?.state || 'FL';
  const industry = business.industry || 'local business';

  // Step 1: Search for local trends using Perplexity (real-time web)
  let trendData: string;
  try {
    const searchResult = await callOpenRouter({
      model: 'perplexity/sonar-pro',
      messages: [{
        role: 'user',
        content: `What are the top 3 interesting local news stories, events, or community happenings in ${city}, ${state} today or this week? Focus on:
- Local festivals, events, or community gatherings
- Sports news (local teams)
- New business openings or expansions
- Weather-related opportunities
- Seasonal trends

IGNORE: Crime, politics, accidents, negative news.
Be specific with dates, names, and locations.`,
      }],
      temperature: 0.5,
      max_tokens: 800,
      caller: 'GL365 Trend Hunter - Search',
    });
    trendData = searchResult.content;
  } catch {
    // Fallback: Generate seasonal content suggestions without web search
    trendData = `No real-time search available. Generate seasonal content ideas for a ${industry} in ${city}, ${state} for the current time of year.`;
  }

  // Step 2: Generate content suggestions from trends
  const { parsed: trends } = await callOpenRouterJSON<TrendResult>({
    model: 'anthropic/claude-sonnet-4.6',
    messages: [{
      role: 'system',
      content: `You are a local marketing content strategist. Given local trends/events, create content suggestions for a ${industry} business called "${business.name}" in ${city}, ${state}.

Return JSON:
{
  "trends": [
    {
      "headline": "Short trend headline",
      "summary": "1-2 sentence summary of the trend/event",
      "content_angle": "How this business can tie into this trend",
      "suggested_post": "A ready-to-post social media caption (2-3 sentences, casual, engaging)",
      "hashtags": ["#LocalHashtag", "#CityName", "#Industry"],
      "relevance": "high|medium|low"
    }
  ],
  "city": "${city}",
  "generated_at": "${new Date().toISOString()}"
}

Generate exactly 3 trend-based content suggestions. Make them specific, timely, and tied to the local area.`,
    }, {
      role: 'user',
      content: `Local trends data:\n${trendData}`,
    }],
    temperature: 0.7,
    max_tokens: 1200,
    caller: 'GL365 Trend Hunter - Content',
  });

  // Step 3: Vibe check all content
  const approvedTrends = trends.trends.filter(trend => {
    const check = vibeCheck(trend.suggested_post + ' ' + trend.headline);
    if (!check.approved) {
      console.warn(`[Trend Hunter] Rejected for ${business.name}: ${check.violations.join(', ')}`);
    }
    return check.approved;
  });

  if (approvedTrends.length === 0) {
    return null;
  }

  trends.trends = approvedTrends;

  // Step 4: Store in brain (knowledge warehouse + journal)
  // Store as knowledge chunk for future content creation
  await supabase.from('memory_knowledge_chunks').insert({
    category: 'local_trends',
    subcategory: city.toLowerCase().replace(/\s+/g, '_'),
    title: `${city} Trends — ${new Date().toLocaleDateString()}`,
    content: JSON.stringify(trends),
    source: 'trend_hunter',
    confidence: 0.8,
    priority: 7,
    is_active: true,
  }).catch(() => {});

  // Log as brain event
  await supabase.from('memory_event_journal').insert({
    event_type: 'trend_hunt',
    event_category: 'content',
    title: `Daily trends for ${business.name} in ${city}`,
    description: approvedTrends.map(t => t.headline).join(', '),
    metadata: {
      business_id: business.id,
      city,
      state,
      trend_count: approvedTrends.length,
      trends: approvedTrends,
    },
    tags: ['trend_hunter', `city:${city.toLowerCase()}`, `industry:${industry}`],
    search_text: `trends ${city} ${state} ${industry} ${approvedTrends.map(t => t.headline).join(' ')}`,
    ai_generated: true,
    ai_model_used: 'perplexity/sonar-pro + claude-sonnet-4.6',
  }).catch(() => {});

  // Step 5: Notify business owner
  await notify({
    businessId: business.id,
    title: `Today's Trends in ${city}`,
    body: approvedTrends.map(t => t.headline).join(' | '),
    category: 'content',
    severity: 'info',
    sourceType: 'trend_hunt',
    sourceId: business.id,
    actionUrl: '/admin-v2/content-forge',
    actionLabel: 'Create Content',
    channels: ['dashboard'],
  }).catch(() => {});

  return trends;
}
