import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Parse N8N payload
    const body = await request.json();
    const { trends, type, zipCode, city } = body;

    // Determine if this is weekly batch or 3-hour pulse
    const trendType = type || 'weekly_batch';
    const expiresAt = trendType === 'live_pulse' 
      ? new Date(Date.now() + 3 * 60 * 60 * 1000) // 3 hours
      : null;

    // Store trends in database
    if (Array.isArray(trends) && trends.length > 0) {
      const trendsToInsert = trends.map((trend: any) => ({
        title: trend.title || 'Trending Opportunity',
        description: trend.description || '',
        location: trend.location || city || zipCode || 'Unknown',
        event_date: trend.eventDate || new Date().toISOString(),
        expected_traffic: trend.expectedTraffic || 'medium',
        category: trend.category || 'other',
        suggested_action: trend.suggestedAction || '',
        source: 'n8n_scheduled',
        zip_code: zipCode || null,
        expires_at: expiresAt,
        created_at: new Date().toISOString()
      }));

      const { data, error } = await supabase
        .from('local_trends')
        .insert(trendsToInsert);

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
      .eq('source', 'n8n_scheduled')
      .order('created_at', { ascending: false });

    if (type === 'live_pulse') {
      query = query.gt('expires_at', new Date().toISOString());
    } else {
      // Get latest weekly batch (last 7 days)
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      query = query
        .gte('created_at', weekAgo)
        .is('expires_at', null);
    }

    const { data, error } = await query.limit(10);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch trends', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      trends: data || [],
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
