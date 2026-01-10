import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// N8N Webhook URL (Production) - will fallback to AI if unavailable
const N8N_WEBHOOK_URL = 'https://n8n.srv1f56042.hstgr.cloud/webhook-test/d25b2519-f339-49a2-be95-c7faafa9242a';

// ZIP code to city mapping for common areas
const ZIP_TO_CITY: Record<string, string> = {
  '33619': 'Tampa, FL',
  '33602': 'Tampa, FL',
  '33601': 'Tampa, FL',
  '33606': 'Tampa, FL',
  '33609': 'Tampa, FL',
  '10001': 'New York, NY',
  '90210': 'Beverly Hills, CA',
  '60601': 'Chicago, IL',
  '77001': 'Houston, TX',
  '85001': 'Phoenix, AZ',
};

// Generate trends using AI
async function generateTrendsWithAI(zipCode: string, city: string) {
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  
  if (!openRouterKey) {
    // Return mock trends if no API key
    return generateMockTrends(zipCode, city);
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://greenline365.com',
        'X-Title': 'GreenLine365 Trend Hunter',
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a local business trend analyst. Generate 3-4 realistic, actionable local trends for small businesses in the specified area. Focus on events, seasonal opportunities, local happenings, and weather-based opportunities.

Return ONLY valid JSON in this exact format (no markdown, no extra text):
{
  "trends": [
    {
      "title": "Event or Trend Title",
      "description": "Brief description of the opportunity",
      "location": "City, State",
      "eventDate": "2026-01-15",
      "expectedTraffic": "high|medium|low",
      "category": "sports|community|business|entertainment|weather",
      "suggestedAction": "Specific marketing action the business can take"
    }
  ]
}`
          },
          {
            role: 'user',
            content: `Generate local business trends and opportunities for ZIP code ${zipCode} (${city}). Include current seasonal events, upcoming local happenings, and actionable marketing opportunities. Today is ${new Date().toLocaleDateString()}.`
          }
        ],
        temperature: 0.7,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      console.error('OpenRouter API error:', response.status);
      return generateMockTrends(zipCode, city);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    // Parse the JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.trends || [];
    }
    
    return generateMockTrends(zipCode, city);
  } catch (error) {
    console.error('AI trend generation error:', error);
    return generateMockTrends(zipCode, city);
  }
}

// Fallback mock trends
function generateMockTrends(zipCode: string, city: string) {
  const currentMonth = new Date().getMonth();
  const trends = [];

  // Seasonal trends based on month
  if (currentMonth === 0) { // January
    trends.push({
      title: 'New Year Resolution Rush',
      description: 'Local gyms and wellness businesses see 300% increase in inquiries. Perfect time for fitness, health, and self-improvement promotions.',
      location: city,
      eventDate: new Date().toISOString(),
      expectedTraffic: 'high',
      category: 'community',
      suggestedAction: 'Promote new year specials, first-time customer discounts, or "fresh start" packages.'
    });
    trends.push({
      title: 'Super Bowl Prep Week',
      description: 'Big game coming up! Local restaurants and catering see massive party orders. Sports bars expect overflow crowds.',
      location: city,
      eventDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      expectedTraffic: 'high',
      category: 'sports',
      suggestedAction: 'Create game day specials, party platters, or watch party events. Post on social about your offerings.'
    });
  }
  
  if (currentMonth === 1) { // February
    trends.push({
      title: "Valentine's Day Rush",
      description: "Romantic dining and gift purchases peak. Restaurants, florists, and gift shops see 200%+ traffic.",
      location: city,
      eventDate: new Date(new Date().getFullYear(), 1, 14).toISOString(),
      expectedTraffic: 'high',
      category: 'community',
      suggestedAction: "Create Valentine's specials, couples packages, or gift guides. Book reservations early."
    });
  }

  // Year-round trends
  trends.push({
    title: 'Weekend Farmers Market',
    description: 'Local farmers markets draw thousands of visitors every weekend. Great opportunity for local visibility.',
    location: city,
    eventDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    expectedTraffic: 'medium',
    category: 'community',
    suggestedAction: 'Consider a booth or partnership. Great for food, crafts, and service businesses.'
  });

  trends.push({
    title: 'Local Business Networking Event',
    description: 'Chamber of Commerce hosts monthly networking. 50-100 local business owners attend.',
    location: city,
    eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    expectedTraffic: 'medium',
    category: 'business',
    suggestedAction: 'Attend and bring business cards. Great for B2B connections and referrals.'
  });

  return trends;
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { zipCode, userId, trendType = 'manual' } = body;

    // Validate zip code
    if (!zipCode || !/^\d{5}$/.test(zipCode)) {
      return NextResponse.json(
        { error: 'Valid 5-digit zip code required' },
        { status: 400 }
      );
    }

    // Get city name from ZIP or default
    const city = ZIP_TO_CITY[zipCode] || `Area ${zipCode}`;

    let trends = [];
    let source = 'ai';

    // Try N8N webhook first (with short timeout)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zipCode, trendType }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (n8nResponse.ok) {
        const n8nData = await n8nResponse.json();
        if (Array.isArray(n8nData.trends) && n8nData.trends.length > 0) {
          trends = n8nData.trends;
          source = 'n8n';
        }
      }
    } catch (n8nError) {
      console.log('N8N webhook unavailable, using AI fallback');
    }

    // Fallback to AI-generated trends
    if (trends.length === 0) {
      trends = await generateTrendsWithAI(zipCode, city);
    }

    // Format trends for response
    const formattedTrends = trends.map((trend: any, index: number) => ({
      id: `trend-${zipCode}-${index}`,
      title: trend.title || 'Local Opportunity',
      description: trend.description || '',
      location: trend.location || city,
      event_date: trend.eventDate || trend.event_date || new Date().toISOString(),
      expected_traffic: trend.expectedTraffic || trend.expected_traffic || 'medium',
      category: trend.category || 'community',
      suggested_action: trend.suggestedAction || trend.suggested_action || 'Create relevant content for your audience.',
    }));

    // Try to log to Supabase (non-blocking)
    if (supabaseKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseKey);
        await supabase.from('trend_history').insert({
          user_id: userId || null,
          zip_code: zipCode,
          trend_type: trendType,
          n8n_request: { zipCode, trendType },
          n8n_response: { trends: formattedTrends, source },
          trends_count: formattedTrends.length,
          status: 'success'
        });
      } catch (e) {
        // Ignore Supabase errors - don't fail the request
        console.log('Supabase logging skipped');
      }
    }

    // Return response
    return NextResponse.json({
      success: true,
      trends: formattedTrends,
      metadata: {
        zipCode,
        city,
        trendType,
        trendsCount: formattedTrends.length,
        source,
        expiresAt: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(), // 3 hours
      }
    });

  } catch (error: any) {
    console.error('Daily Trend Hunter Error:', error);
    
    // Even on error, return some useful trends
    const zipCode = '00000';
    const fallbackTrends = generateMockTrends(zipCode, 'Your Area');
    
    return NextResponse.json({
      success: true,
      trends: fallbackTrends.map((t, i) => ({ ...t, id: `fallback-${i}` })),
      metadata: {
        zipCode,
        trendType: 'fallback',
        trendsCount: fallbackTrends.length,
        source: 'fallback',
      }
    });
  }
}
