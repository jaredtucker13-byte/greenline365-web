import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// N8N Webhook URL (Production)
const N8N_WEBHOOK_URL = 'https://n8n.srv1f56042.hstgr.cloud/webhook-test/d25b2519-f339-49a2-be95-c7faafa9242a';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
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

    // Log user action
    if (userId) {
      await supabase.from('user_actions').insert({
        user_id: userId,
        action_type: 'daily_trend_hunter_request',
        action_category: 'trend',
        metadata: { zip_code: zipCode, trend_type: trendType }
      });
    }

    // Call N8N Webhook
    const n8nStartTime = Date.now();
    const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ zipCode, trendType }),
    });

    const n8nDuration = Date.now() - n8nStartTime;

    if (!n8nResponse.ok) {
      // Log failed request
      await supabase.from('trend_history').insert({
        user_id: userId || null,
        zip_code: zipCode,
        trend_type: trendType,
        n8n_request: { zipCode, trendType },
        n8n_response: { error: 'N8N webhook failed', status: n8nResponse.status },
        status: 'failed',
        trends_count: 0
      });

      return NextResponse.json(
        { error: 'Failed to fetch trends from N8N' },
        { status: 502 }
      );
    }

    const trendsData = await n8nResponse.json();

    // Calculate expiry (3 hours for live pulse)
    const expiresAt = trendType === 'live_pulse' 
      ? new Date(Date.now() + 3 * 60 * 60 * 1000) // 3 hours
      : null;

    // Store trends in local_trends table
    const trendsToInsert = Array.isArray(trendsData.trends) 
      ? trendsData.trends.map((trend: any) => ({
          title: trend.title || 'Trending Opportunity',
          description: trend.description || '',
          location: trend.location || zipCode,
          event_date: trend.eventDate || new Date().toISOString(),
          expected_traffic: trend.expectedTraffic || 'medium',
          category: trend.category || 'other',
          suggested_action: trend.suggestedAction || '',
          source: 'n8n_webhook',
          user_id: userId || null,
          zip_code: zipCode,
          expires_at: expiresAt,
          created_at: new Date().toISOString()
        }))
      : [];

    if (trendsToInsert.length > 0) {
      await supabase.from('local_trends').insert(trendsToInsert);
    }

    // Log successful request in trend_history
    await supabase.from('trend_history').insert({
      user_id: userId || null,
      zip_code: zipCode,
      trend_type: trendType,
      n8n_request: { zipCode, trendType },
      n8n_response: { ...trendsData, duration_ms: n8nDuration },
      trends_count: trendsToInsert.length,
      expires_at: expiresAt,
      status: 'success'
    });

    // Return formatted response
    return NextResponse.json({
      success: true,
      trends: trendsToInsert,
      metadata: {
        zipCode,
        trendType,
        trendsCount: trendsToInsert.length,
        expiresAt: expiresAt?.toISOString(),
        responseTime: n8nDuration
      }
    });

  } catch (error: any) {
    console.error('Daily Trend Hunter Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}