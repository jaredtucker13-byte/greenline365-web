import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Trend data structure stored in JSONB
interface TrendData {
  title: string;
  description: string;
  category: string;
  suggested_action: string;
  expected_traffic: string;
  event_date?: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Parse N8N payload
    const body = await request.json();
    const { trends, type, zipCode, city } = body;

    // Determine if this is weekly batch or 3-hour pulse
    const trendType = type || 'weekly_batch';
    const expiresAt = trendType === 'live_pulse' 
      ? new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString() // 3 hours
      : null;

    // Store trends in database
    // The local_trends table uses: id, city_name, trend_data (JSONB), source, expires_at, user_id, zip_code, created_at
    if (Array.isArray(trends) && trends.length > 0) {
      const trendsToInsert = trends.map((trend: any) => ({
        city_name: city || 'Tampa, FL',
        zip_code: zipCode || null,
        source: `n8n_${trendType}`,
        expires_at: expiresAt,
        trend_data: {
          title: trend.title || 'Trending Opportunity',
          description: trend.description || '',
          category: trend.category || 'other',
          suggested_action: trend.suggestedAction || trend.suggested_action || '',
          expected_traffic: trend.expectedTraffic || trend.expected_traffic || 'medium',
          event_date: trend.eventDate || trend.event_date || new Date().toISOString(),
        } as TrendData
      }));

      const { data, error } = await supabase
        .from('local_trends')
        .insert(trendsToInsert)
        .select();

      if (error) {
        console.error('Database insert error:', error);
        return NextResponse.json(
          { error: 'Failed to store trends', details: error.message },
          { status: 500 }
        );
      }

      // Log in trend_history
      await supabase.from('trend_history').insert({
        user_id: null, // System-generated
        zip_code: zipCode || 'system',
        trend_type: trendType,
        n8n_request: {},
        n8n_response: body,
        trends_count: trendsToInsert.length,
        expires_at: expiresAt,
        status: 'success'
      });

      return NextResponse.json({
        success: true,
        message: `Received ${trendsToInsert.length} trends`,
        type: trendType,
        stored: trendsToInsert.length
      });
    }

    return NextResponse.json({
      success: false,
      message: 'No trends provided'
    }, { status: 400 });

  } catch (error: any) {
    console.error('Receive trends error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve current trends
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'weekly_batch';

    // For live pulse, only get non-expired trends
    let query = supabase
      .from('local_trends')
      .select('*')
      .order('created_at', { ascending: false });

    if (type === 'live_pulse') {
      // Get trends that haven't expired (have expires_at in the future)
      query = query
        .eq('source', 'n8n_live_pulse')
        .gt('expires_at', new Date().toISOString());
    } else {
      // Get weekly batch trends (last 7 days, no expiry)
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      query = query
        .eq('source', 'n8n_weekly_batch')
        .gte('created_at', weekAgo);
    }

    const { data, error } = await query.limit(10);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch trends', details: error.message },
        { status: 500 }
      );
    }

    // Transform data to flatten trend_data for the frontend
    const transformedTrends = (data || []).map((item: any) => ({
      id: item.id,
      title: item.trend_data?.title || 'Trend',
      description: item.trend_data?.description || '',
      category: item.trend_data?.category || 'other',
      suggested_action: item.trend_data?.suggested_action || '',
      expected_traffic: item.trend_data?.expected_traffic || 'medium',
      event_date: item.trend_data?.event_date,
      expires_at: item.expires_at,
      created_at: item.created_at,
      city_name: item.city_name,
      zip_code: item.zip_code
    }));

    return NextResponse.json({
      success: true,
      trends: transformedTrends,
      type
    });

  } catch (error: any) {
    console.error('Get trends error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
