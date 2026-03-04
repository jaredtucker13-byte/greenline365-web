/**
 * Daily Trend Hunter API — Two-Stage AI Pipeline
 *
 * SOP Architecture:
 * Stage 1: Perplexity Sonar — Internet scanner (raw web search data)
 * Stage 2: Claude Sonnet 4.6 — Manager/Router (processes raw data into polished,
 *          actionable opportunities with deal suggestions. This is the model
 *          that produces the final output the user sees.)
 *
 * Perplexity finds the data. Sonnet 4.6 makes it smart.
 *
 * This replaces the old n8n workflow entirely.
 * Runs on Vercel cron every 3 hours + manual trigger from admin.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// ZIP code to city mapping
const ZIP_TO_CITY: Record<string, string> = {
  '33619': 'Tampa, FL',
  '33602': 'Tampa, FL',
  '33601': 'Tampa, FL',
  '33606': 'Tampa, FL',
  '33609': 'Tampa, FL',
  '33610': 'Tampa, FL',
  '33611': 'Tampa, FL',
  '33612': 'Tampa, FL',
  '33613': 'Tampa, FL',
  '33614': 'Tampa, FL',
  '33615': 'Tampa, FL',
  '33616': 'Tampa, FL',
  '33617': 'Tampa, FL',
  '33618': 'Tampa, FL',
  '33620': 'Tampa, FL',
  '33621': 'Tampa, FL',
  '10001': 'New York, NY',
  '90210': 'Beverly Hills, CA',
  '60601': 'Chicago, IL',
  '77001': 'Houston, TX',
  '85001': 'Phoenix, AZ',
};

// Get current season for the region
function getSeason(zipCode: string): string {
  const month = new Date().getMonth();
  // Florida-specific seasons (different from northern states)
  const isFloridaZip = zipCode.startsWith('33') || zipCode.startsWith('34') || zipCode.startsWith('32');

  if (isFloridaZip) {
    if (month >= 5 && month <= 9) return 'summer (hot & rainy season)';
    if (month >= 10 || month <= 1) return 'winter (peak tourist season, snowbird season)';
    if (month >= 2 && month <= 4) return 'spring (spring break, festival season)';
  }

  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'fall';
  return 'winter';
}

// Get day context
function getDayContext(): string {
  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();
  const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day];

  let timeOfDay = 'morning';
  if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
  if (hour >= 17) timeOfDay = 'evening';

  const isWeekend = day === 0 || day === 6;
  return `${dayName} ${timeOfDay}${isWeekend ? ' (weekend)' : ' (weekday)'}`;
}

/**
 * STAGE 1: Perplexity Sonar — Internet Scanner
 * Searches the real web for raw local data (events, weather, news, happenings)
 * Returns raw, unprocessed intelligence for Stage 2 to refine
 */
async function stage1_PerplexityScan(zipCode: string, city: string): Promise<string> {
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  if (!openRouterKey) return '';

  const season = getSeason(zipCode);
  const dayContext = getDayContext();
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
  });

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${openRouterKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://greenline365.com',
      'X-Title': 'GreenLine365 Trend Hunter - Scanner',
    },
    body: JSON.stringify({
      model: 'perplexity/sonar-pro',
      messages: [
        {
          role: 'system',
          content: `You are a local intelligence scanner. Your job is to search the internet and return RAW, FACTUAL data about what's happening in a specific area. Include specifics: dates, times, locations, weather numbers, event names, team names, etc. Be thorough and factual. Do not editorialize or suggest actions — just report what you find.`
        },
        {
          role: 'user',
          content: `Search for everything happening in ${city} (ZIP: ${zipCode}) right now.

Today is ${today}. It's ${dayContext}. Season: ${season}.

I need:
1. Current weather (temperature, conditions, forecast for next 48 hours)
2. Local events today and this week (sports games, festivals, markets, concerts, community events)
3. Any trending local news or happenings
4. Upcoming holidays or observances in the next 2 weeks
5. Seasonal patterns (tourist season status, school calendar, etc.)
6. Any viral or trending topics specific to ${city}

Be specific with dates, times, venues, and details. Return as much factual data as possible.`
        }
      ],
      temperature: 0.3, // Low temp for factual accuracy
      max_tokens: 1500,
    }),
  });

  if (!response.ok) {
    console.error('Perplexity scan error:', response.status);
    return '';
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

/**
 * STAGE 2: Claude Sonnet 4.6 — Manager / Smart Router
 * Takes raw Perplexity data and produces the final polished output.
 * This is THE model that makes all smart decisions and generates what the user sees.
 *
 * Responsibilities:
 * - Filter for business relevance
 * - Generate positive, opportunity-focused summaries
 * - Create specific blast deal suggestions
 * - Assign vibe scores and urgency levels
 * - Write the copy the business owner sees
 */
async function stage2_SonnetManager(rawIntel: string, zipCode: string, city: string): Promise<any[]> {
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  if (!openRouterKey) return [];

  const season = getSeason(zipCode);
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
  });

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${openRouterKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://greenline365.com',
      'X-Title': 'GreenLine365 Trend Hunter - Manager',
    },
    body: JSON.stringify({
      model: 'anthropic/claude-sonnet-4-6',
      messages: [
        {
          role: 'system',
          content: `You are the GreenLine365 Local Pulse Manager — you take raw local intelligence data and transform it into positive, actionable business opportunities with specific blast deal suggestions.

YOUR ROLE: You are the smart manager. You process raw data and produce the FINAL polished output that business owners see. Every output must be:
- POSITIVE vibes only — every trend is an OPPORTUNITY, never a problem
- ACTIONABLE — each trend comes with a specific deal the owner can create right now
- REVENUE-FOCUSED — the goal is to turn slow times into busy times
- CREATIVE — think like a marketing genius brainstorming with the business owner

Deal types to suggest:
- BOGO (Buy 1 Get 1) — great for food, drinks, services
- Percent Off — seasonal clearance, slow-day specials
- Dollar Off — premium service discounts, AC/home maintenance
- Free Item — loss leaders that drive traffic (free coffee, free sample)
- Bundle — package deals (service + add-on)
- Custom — unique promotions (flash happy hours, loyalty rewards)

For service businesses (HVAC, plumbing, landscaping, etc.): Think seasonal maintenance deals, "we're in your area" specials, early-bird booking discounts.

Return ONLY valid JSON (no markdown, no backticks):
{
  "trends": [
    {
      "title": "Short punchy title (what's happening)",
      "description": "2-3 sentences on the opportunity and why it matters for businesses",
      "category": "weather|sports|community|entertainment|holiday|seasonal|food|business",
      "expected_traffic": "high|medium|low",
      "vibe_score": 85,
      "suggested_action": "Specific one-line promotional idea",
      "suggested_deal": {
        "deal_type": "bogo|percent_off|dollar_off|free_item|bundle|custom",
        "example_title": "Buy 1 Get 1 Free Iced Coffee",
        "example_value": "Buy 1 Get 1",
        "time_window": "2-5pm today",
        "why_it_works": "One sentence on why this deal fits the moment"
      },
      "event_date": "YYYY-MM-DD"
    }
  ],
  "weather_summary": "Current weather in one line",
  "season_vibe": "What makes this time of year special for businesses"
}`
        },
        {
          role: 'user',
          content: `Here is raw local intelligence data for ${city} (ZIP: ${zipCode}).
Today: ${today}. Season: ${season}.

--- RAW INTEL FROM SCANNER ---
${rawIntel || `No live scanner data available. Use your knowledge of ${city} seasonal patterns, typical weather for ${season}, and common local events for this time of year to generate opportunities.`}
--- END RAW INTEL ---

Transform this into 4-6 positive, actionable business opportunities with specific blast deal suggestions. Each opportunity should help a local business turn this moment into revenue. Think about all types of businesses: restaurants, coffee shops, salons, HVAC companies, gyms, retail shops, etc.

Remember: positive vibes only. Every trend is a revenue opportunity.`
        }
      ],
      temperature: 0.7,
      max_tokens: 1500,
    }),
  });

  if (!response.ok) {
    console.error('Sonnet Manager error:', response.status);
    return [];
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';

  // Parse JSON from response
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    const parsed = JSON.parse(jsonMatch[0]);
    return parsed.trends || [];
  }

  return [];
}

/**
 * Combined two-stage pipeline: Perplexity scans → Sonnet 4.6 manages
 */
async function runTwoStagePipeline(zipCode: string, city: string): Promise<any[]> {
  // Stage 1: Get raw internet data
  const rawIntel = await stage1_PerplexityScan(zipCode, city);

  // Stage 2: Process with Sonnet 4.6 (even if Stage 1 failed, Sonnet can work from seasonal knowledge)
  const trends = await stage2_SonnetManager(rawIntel, zipCode, city);

  return trends;
}

/**
 * Last resort: Seasonal fallback trends (no API needed)
 */
function generateSeasonalFallbacks(zipCode: string, city: string): any[] {
  const month = new Date().getMonth();
  const season = getSeason(zipCode);
  const isFloridaZip = zipCode.startsWith('33') || zipCode.startsWith('34');

  const baseTrends = [];

  // Monthly seasonal opportunities
  const monthlyTrends: Record<number, any[]> = {
    0: [ // January
      {
        title: 'New Year New You Season',
        description: 'Resolution season is in full swing. Fitness, wellness, and self-improvement businesses see massive demand.',
        category: 'seasonal',
        expected_traffic: 'high',
        vibe_score: 90,
        suggested_action: 'Run a "Fresh Start" promotion — new customer specials, first-visit discounts',
        suggested_deal: { deal_type: 'percent_off', example_title: '25% Off Your Fresh Start', example_value: '25%', time_window: 'All January', why_it_works: 'Resolution energy is at its peak' },
      },
      {
        title: 'Super Bowl Watch Parties',
        description: 'The big game is coming! Restaurants, bars, and catering businesses are in prime position.',
        category: 'sports',
        expected_traffic: 'high',
        vibe_score: 95,
        suggested_action: 'Create a game day platter special or watch party event',
        suggested_deal: { deal_type: 'bundle', example_title: 'Game Day Party Pack', example_value: 'Wings + Drinks Bundle', time_window: 'Game day', why_it_works: 'Everyone needs food for the party' },
      },
    ],
    1: [ // February
      {
        title: "Valentine's Day is Coming",
        description: "Love is in the air! Restaurants, florists, salons, and gift shops see huge traffic.",
        category: 'holiday',
        expected_traffic: 'high',
        vibe_score: 92,
        suggested_action: "Create couples packages, romantic specials, or last-minute gift promotions",
        suggested_deal: { deal_type: 'bundle', example_title: "Couples Date Night Special", example_value: "Dinner for 2 + Dessert", time_window: "Feb 10-14", why_it_works: "Everyone scrambles for Valentine's plans" },
      },
    ],
    2: [ // March
      {
        title: 'Spring Break Traffic',
        description: isFloridaZip ? 'Spring breakers are flooding Florida! Tourist areas are packed.' : 'Families are planning spring activities.',
        category: 'seasonal',
        expected_traffic: 'high',
        vibe_score: 88,
        suggested_action: 'Run a spring break special for visitors or a "locals-only" deal',
        suggested_deal: { deal_type: 'percent_off', example_title: 'Spring Break Special', example_value: '20% off', time_window: 'All March', why_it_works: 'Massive foot traffic from tourists' },
      },
    ],
    3: [ // April
      {
        title: 'Tax Refund Season',
        description: 'Tax refunds are hitting bank accounts. Consumers are ready to spend!',
        category: 'business',
        expected_traffic: 'medium',
        vibe_score: 85,
        suggested_action: 'Promote your premium offerings — people have extra cash to spend',
        suggested_deal: { deal_type: 'dollar_off', example_title: '$20 Off Premium Service', example_value: '$20', time_window: 'April', why_it_works: 'Refund checks are in the bank' },
      },
    ],
    4: [ // May
      {
        title: "Mother's Day Prep",
        description: "Mother's Day is one of the biggest spending holidays. Restaurants, spas, and gift shops thrive.",
        category: 'holiday',
        expected_traffic: 'high',
        vibe_score: 93,
        suggested_action: "Create a Mother's Day package or brunch special",
        suggested_deal: { deal_type: 'bundle', example_title: "Mom's Day Spa Package", example_value: "Service + Gift", time_window: "May 1-12", why_it_works: "Nobody wants to forget Mom" },
      },
    ],
    5: [ // June
      {
        title: 'Summer Kickoff',
        description: isFloridaZip ? 'Summer heat is here! Ice cream, cold drinks, and indoor activities boom.' : 'School is out, families are spending.',
        category: 'seasonal',
        expected_traffic: 'medium',
        vibe_score: 87,
        suggested_action: 'Launch summer specials — cold treats, cool-down deals, family packages',
        suggested_deal: { deal_type: 'bogo', example_title: 'BOGO Iced Drinks', example_value: 'Buy 1 Get 1', time_window: '2-5pm daily', why_it_works: 'Everyone needs to cool down' },
      },
    ],
    6: [ // July
      {
        title: '4th of July Celebrations',
        description: 'Independence Day means BBQs, gatherings, and fireworks. Food and entertainment businesses thrive.',
        category: 'holiday',
        expected_traffic: 'high',
        vibe_score: 94,
        suggested_action: 'Run a patriotic special or host a viewing event',
        suggested_deal: { deal_type: 'percent_off', example_title: 'Freedom Day Special', example_value: '30% off', time_window: 'July 3-5', why_it_works: 'Everyone is celebrating and spending' },
      },
    ],
    7: [ // August
      {
        title: 'Back to School Rush',
        description: 'Families are prepping for school. Great time for family-oriented businesses.',
        category: 'community',
        expected_traffic: 'medium',
        vibe_score: 82,
        suggested_action: 'Offer a back-to-school deal or family special',
        suggested_deal: { deal_type: 'percent_off', example_title: 'Back to School 15% Off', example_value: '15%', time_window: 'August', why_it_works: 'Families are in spending mode' },
      },
    ],
    8: [ // September
      {
        title: 'NFL Season Kickoff',
        description: 'Football is back! Sports bars, restaurants, and catering see weekly game-day surges.',
        category: 'sports',
        expected_traffic: 'high',
        vibe_score: 91,
        suggested_action: 'Create weekly game day specials that keep customers coming back',
        suggested_deal: { deal_type: 'bogo', example_title: 'Game Day BOGO Wings', example_value: 'Buy 1 Get 1', time_window: 'Every Sunday', why_it_works: 'Football = food + friends' },
      },
    ],
    9: [ // October
      {
        title: 'Halloween Season',
        description: 'Costume parties, trick-or-treating, and fall activities drive foot traffic.',
        category: 'holiday',
        expected_traffic: 'high',
        vibe_score: 89,
        suggested_action: 'Host a spooky event or run a Halloween-themed promotion',
        suggested_deal: { deal_type: 'free_item', example_title: 'Free Treat with Purchase', example_value: 'Free candy bag', time_window: 'Oct 25-31', why_it_works: 'Everyone loves Halloween freebies' },
      },
    ],
    10: [ // November
      {
        title: 'Black Friday / Small Business Saturday',
        description: 'The biggest shopping weekend of the year. Small businesses can compete with creative deals.',
        category: 'business',
        expected_traffic: 'high',
        vibe_score: 96,
        suggested_action: 'Create an exclusive doorbuster or loyalty reward for Small Business Saturday',
        suggested_deal: { deal_type: 'percent_off', example_title: 'Small Biz Saturday 40% Off', example_value: '40%', time_window: 'Nov 29', why_it_works: 'Consumers actively seek small businesses' },
      },
    ],
    11: [ // December
      {
        title: 'Holiday Shopping Season',
        description: 'Gift-giving season is in full swing. Last-minute shoppers drive huge traffic.',
        category: 'holiday',
        expected_traffic: 'high',
        vibe_score: 95,
        suggested_action: 'Run last-minute gift specials, gift cards, or holiday bundles',
        suggested_deal: { deal_type: 'bundle', example_title: 'Holiday Gift Bundle', example_value: 'Product + Gift Wrap', time_window: 'Dec 15-24', why_it_works: 'Last-minute gifters will pay premium' },
      },
    ],
  };

  // Add monthly trends
  if (monthlyTrends[month]) {
    baseTrends.push(...monthlyTrends[month]);
  }

  // Add a generic weather-based trend
  if (isFloridaZip && month >= 5 && month <= 9) {
    baseTrends.push({
      title: 'Hot Day = Cold Deals',
      description: 'Florida heat means everyone is looking for ways to cool down. Perfect for beverage, ice cream, and indoor businesses.',
      category: 'weather',
      expected_traffic: 'medium',
      vibe_score: 83,
      suggested_action: 'Run a "Beat the Heat" special on cold items or indoor services',
      suggested_deal: { deal_type: 'bogo', example_title: 'Beat the Heat BOGO', example_value: 'Buy 1 Get 1 Free', time_window: '12-4pm', why_it_works: 'Peak heat hours = peak demand for cold stuff' },
    });
  }

  // Add a community trend
  baseTrends.push({
    title: 'Weekend Farmers Market',
    description: `Local farmers markets in ${city} draw steady crowds. Great visibility opportunity for food, crafts, and service businesses.`,
    category: 'community',
    expected_traffic: 'medium',
    vibe_score: 78,
    suggested_action: 'Set up a booth, offer samples, or partner with market vendors',
    suggested_deal: { deal_type: 'free_item', example_title: 'Free Sample + Coupon', example_value: 'Free tasting', time_window: 'This weekend', why_it_works: 'Market-goers are already in buying mode' },
  });

  return baseTrends.map((t, i) => ({
    ...t,
    location: city,
    event_date: new Date().toISOString(),
  }));
}

/**
 * POST — Trigger a trend scan (manual or from cron)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { zipCode, userId, source: requestSource } = body;

    // Validate zip code
    if (!zipCode || !/^\d{5}$/.test(zipCode)) {
      return NextResponse.json(
        { error: 'Valid 5-digit zip code required' },
        { status: 400 }
      );
    }

    const city = ZIP_TO_CITY[zipCode] || `Area ${zipCode}`;
    let trends: any[] = [];
    let source = 'two_stage_pipeline';
    let weatherSummary = '';
    let seasonVibe = '';

    // PRIMARY: Two-stage pipeline (Perplexity scans → Sonnet 4.6 manages)
    try {
      trends = await runTwoStagePipeline(zipCode, city);
      if (trends.length > 0) {
        source = 'two_stage_pipeline';
      }
    } catch (error) {
      console.error('Two-stage pipeline failed:', error);
    }

    // FALLBACK: Sonnet 4.6 alone (no Perplexity data, uses seasonal knowledge)
    if (trends.length === 0) {
      try {
        trends = await stage2_SonnetManager('', zipCode, city);
        source = 'sonnet_only';
      } catch (error) {
        console.error('Sonnet-only fallback failed:', error);
      }
    }

    // LAST RESORT: Hardcoded seasonal fallbacks (no API needed)
    if (trends.length === 0) {
      trends = generateSeasonalFallbacks(zipCode, city);
      source = 'seasonal_fallback';
    }

    // Format trends consistently
    const formattedTrends = trends.map((trend: any, index: number) => ({
      id: `pulse-${zipCode}-${Date.now()}-${index}`,
      title: trend.title || 'Local Opportunity',
      description: trend.description || '',
      location: trend.location || city,
      event_date: trend.event_date || trend.eventDate || new Date().toISOString(),
      expected_traffic: trend.expected_traffic || trend.expectedTraffic || 'medium',
      category: trend.category || 'community',
      suggested_action: trend.suggested_action || trend.suggestedAction || '',
      vibe_score: trend.vibe_score || trend.vibeScore || 80,
      suggested_deal: trend.suggested_deal || trend.suggestedDeal || null,
    }));

    // Store in Supabase
    if (supabaseKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Store each trend in local_trends table
        const trendsToInsert = formattedTrends.map((t: any) => ({
          city_name: city,
          zip_code: zipCode,
          source: `pulse_${source}`,
          expires_at: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
          trend_data: {
            title: t.title,
            description: t.description,
            category: t.category,
            suggested_action: t.suggested_action,
            expected_traffic: t.expected_traffic,
            event_date: t.event_date,
          },
          sentiment: 'positive',
          vibe_score: t.vibe_score,
          season: getSeason(zipCode),
          suggested_deal: t.suggested_deal || {},
        }));

        await supabase.from('local_trends').insert(trendsToInsert);

        // Log to trend_history
        await supabase.from('trend_history').insert({
          user_id: userId || null,
          zip_code: zipCode,
          trend_type: requestSource || 'manual',
          n8n_request: { zipCode, source: requestSource },
          n8n_response: { trends: formattedTrends, source, weatherSummary, seasonVibe },
          trends_count: formattedTrends.length,
          status: 'success',
        });
      } catch (e) {
        console.error('Supabase storage error (non-blocking):', e);
      }
    }

    return NextResponse.json({
      success: true,
      trends: formattedTrends,
      metadata: {
        zipCode,
        city,
        source,
        season: getSeason(zipCode),
        dayContext: getDayContext(),
        trendsCount: formattedTrends.length,
        expiresAt: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
        weatherSummary,
        seasonVibe,
      },
    });
  } catch (error: any) {
    console.error('Trend Hunter Error:', error);

    // Even on total failure, return seasonal fallbacks
    const fallbacks = generateSeasonalFallbacks('33619', 'Tampa, FL');
    return NextResponse.json({
      success: true,
      trends: fallbacks.map((t, i) => ({ ...t, id: `fallback-${i}` })),
      metadata: {
        zipCode: '33619',
        city: 'Tampa, FL',
        source: 'emergency_fallback',
        season: getSeason('33619'),
        trendsCount: fallbacks.length,
        expiresAt: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
      },
    });
  }
}

/**
 * GET — Retrieve current/cached trends
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const zipCode = searchParams.get('zipCode') || '33619';
    const city = ZIP_TO_CITY[zipCode] || `Area ${zipCode}`;

    if (!supabaseKey) {
      // No DB — return fresh seasonal fallbacks
      const fallbacks = generateSeasonalFallbacks(zipCode, city);
      return NextResponse.json({
        success: true,
        trends: fallbacks.map((t, i) => ({ ...t, id: `seasonal-${i}` })),
        metadata: { zipCode, city, source: 'seasonal_fallback', cached: false },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get non-expired trends for this ZIP code
    const { data, error } = await supabase
      .from('local_trends')
      .select('*')
      .eq('zip_code', zipCode)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(10);

    if (error || !data || data.length === 0) {
      // No cached trends — return seasonal fallbacks
      const fallbacks = generateSeasonalFallbacks(zipCode, city);
      return NextResponse.json({
        success: true,
        trends: fallbacks.map((t, i) => ({ ...t, id: `seasonal-${i}` })),
        metadata: { zipCode, city, source: 'seasonal_fallback', cached: false },
      });
    }

    // Transform DB records to API format
    const trends = data.map((item: any) => ({
      id: item.id,
      title: item.trend_data?.title || 'Opportunity',
      description: item.trend_data?.description || '',
      location: item.city_name,
      event_date: item.trend_data?.event_date || item.created_at,
      expected_traffic: item.trend_data?.expected_traffic || 'medium',
      category: item.trend_data?.category || 'community',
      suggested_action: item.trend_data?.suggested_action || '',
      vibe_score: item.vibe_score || 80,
      suggested_deal: item.suggested_deal || null,
      expires_at: item.expires_at,
      created_at: item.created_at,
    }));

    return NextResponse.json({
      success: true,
      trends,
      metadata: {
        zipCode,
        city,
        source: data[0]?.source || 'cached',
        cached: true,
        season: getSeason(zipCode),
        trendsCount: trends.length,
        expiresAt: data[0]?.expires_at,
      },
    });
  } catch (error: any) {
    console.error('Trend retrieval error:', error);
    const fallbacks = generateSeasonalFallbacks('33619', 'Tampa, FL');
    return NextResponse.json({
      success: true,
      trends: fallbacks.map((t, i) => ({ ...t, id: `fallback-${i}` })),
      metadata: { source: 'error_fallback' },
    });
  }
}
