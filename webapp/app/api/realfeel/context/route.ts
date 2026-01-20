import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Business Context Configuration API
 * 
 * Manages the "Real-Feel" context settings for each business
 * Controls weather awareness, booking rules, and warm transfer settings
 * 
 * GET /api/realfeel/context - Get business context
 * PATCH /api/realfeel/context - Update business context
 */

interface ContextConfig {
  industry_type: 'indoor' | 'outdoor' | 'hybrid' | 'saas';
  weather_gate: {
    enabled: boolean;
    rain_threshold: number;
    heat_threshold: number;
    cold_threshold: number;
    severe_weather_only: boolean;
  };
  booking_rules: {
    nudge_cancellations: boolean;
    max_availability_options: number;
    require_reschedule_id: boolean;
  };
  warm_transfer: {
    enabled: boolean;
    research_on_hold: boolean;
    whisper_duration_seconds: number;
  };
}

// GET - Get business context configuration
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('business_id');
    
    if (!businessId) {
      return NextResponse.json({ error: 'business_id required' }, { status: 400 });
    }
    
    // Verify access
    const { data: userBusiness } = await supabase
      .from('user_businesses')
      .select('role')
      .eq('user_id', user.id)
      .eq('business_id', businessId)
      .single();
    
    if (!userBusiness) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    // Get business with context config
    const { data: business, error } = await supabase
      .from('businesses')
      .select(`
        id,
        name,
        slug,
        industry,
        is_weather_dependent,
        weather_threshold,
        context_config,
        tenant_status,
        zip_code,
        retell_agent_id
      `)
      .eq('id', businessId)
      .single();
    
    if (error || !business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }
    
    // Get recent weather alerts if any
    const { data: recentAlerts } = await supabase
      .from('weather_alerts')
      .select('*')
      .eq('business_id', businessId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(5);
    
    return NextResponse.json({
      success: true,
      business: {
        id: business.id,
        name: business.name,
        slug: business.slug,
        industry: business.industry,
        zip_code: business.zip_code,
        retell_agent_id: business.retell_agent_id
      },
      weather_settings: {
        is_weather_dependent: business.is_weather_dependent,
        threshold: business.weather_threshold,
        current_status: business.tenant_status
      },
      context_config: business.context_config,
      active_alerts: recentAlerts || []
    });
    
  } catch (error: any) {
    console.error('[Context GET] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH - Update business context configuration
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { 
      business_id, 
      is_weather_dependent,
      weather_threshold,
      zip_code,
      context_config,
      retell_agent_id
    } = body;
    
    if (!business_id) {
      return NextResponse.json({ error: 'business_id required' }, { status: 400 });
    }
    
    // Verify access (owner or admin only)
    const { data: userBusiness } = await supabase
      .from('user_businesses')
      .select('role')
      .eq('user_id', user.id)
      .eq('business_id', business_id)
      .single();
    
    if (!userBusiness || !['owner', 'admin'].includes(userBusiness.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    // Get current config
    const { data: currentBusiness } = await supabase
      .from('businesses')
      .select('context_config')
      .eq('id', business_id)
      .single();
    
    // Merge context configs if partial update
    const mergedConfig = context_config 
      ? { ...currentBusiness?.context_config, ...context_config }
      : currentBusiness?.context_config;
    
    // Build update object
    const updateData: any = {};
    if (is_weather_dependent !== undefined) updateData.is_weather_dependent = is_weather_dependent;
    if (weather_threshold !== undefined) updateData.weather_threshold = weather_threshold;
    if (zip_code !== undefined) updateData.zip_code = zip_code;
    if (context_config !== undefined) updateData.context_config = mergedConfig;
    if (retell_agent_id !== undefined) updateData.retell_agent_id = retell_agent_id;
    
    // Update business
    const { data: business, error } = await supabase
      .from('businesses')
      .update(updateData)
      .eq('id', business_id)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return NextResponse.json({
      success: true,
      business: {
        id: business.id,
        name: business.name,
        is_weather_dependent: business.is_weather_dependent,
        weather_threshold: business.weather_threshold,
        zip_code: business.zip_code,
        context_config: business.context_config,
        retell_agent_id: business.retell_agent_id
      }
    });
    
  } catch (error: any) {
    console.error('[Context PATCH] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
