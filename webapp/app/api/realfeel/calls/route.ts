import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Call Logs API
 * 
 * Manages call logging for the Real-Feel AI booking system
 * Tracks call context, outcomes, and nudge strategy success
 * 
 * POST /api/realfeel/calls - Create call log
 * GET /api/realfeel/calls - List call logs
 * PATCH /api/realfeel/calls - Update call log
 */

interface CreateCallLogRequest {
  business_id: string;
  call_id?: string;
  call_type?: 'inbound' | 'outbound' | 'warm_transfer';
  caller_phone?: string;
  caller_email?: string;
  caller_name?: string;
  weather_context?: object;
  perplexity_brief?: string;
  prospect_website?: string;
}

interface UpdateCallLogRequest {
  call_log_id: string;
  conversation_summary?: string;
  intent_detected?: string;
  action_taken?: string;
  booking_id?: string;
  cancellation_attempted?: boolean;
  cancellation_nudged?: boolean;
  nudge_successful?: boolean;
  transferred_to?: string;
  whisper_content?: string;
  duration_seconds?: number;
  recording_url?: string;
  ended_at?: string;
}

// POST - Create new call log
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const body: CreateCallLogRequest = await request.json();
    const { business_id, ...callData } = body;
    
    if (!business_id) {
      return NextResponse.json({ error: 'business_id required' }, { status: 400 });
    }
    
    // Verify business exists
    const { data: business } = await supabase
      .from('businesses')
      .select('id, name, context_config')
      .eq('id', business_id)
      .single();
    
    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }
    
    // Create call log
    const { data: callLog, error } = await supabase
      .from('call_logs')
      .insert({
        business_id,
        ...callData,
        started_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return NextResponse.json({
      success: true,
      call_log: callLog,
      business_context: {
        name: business.name,
        nudge_cancellations: business.context_config?.booking_rules?.nudge_cancellations ?? true,
        max_options: business.context_config?.booking_rules?.max_availability_options ?? 3
      }
    });
    
  } catch (error: any) {
    console.error('[Call Logs POST] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET - List call logs
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('business_id');
    const callId = searchParams.get('call_id');
    const limit = parseInt(searchParams.get('limit') || '50');
    const intent = searchParams.get('intent');
    
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
    
    let query = supabase
      .from('call_logs')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (callId) {
      query = query.eq('call_id', callId);
    }
    
    if (intent) {
      query = query.eq('intent_detected', intent);
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw error;
    }
    
    // Calculate stats
    const stats = {
      total_calls: data?.length || 0,
      cancellation_attempts: data?.filter(c => c.cancellation_attempted).length || 0,
      successful_nudges: data?.filter(c => c.nudge_successful).length || 0,
      bookings_made: data?.filter(c => c.action_taken === 'booked').length || 0,
      transfers: data?.filter(c => c.call_type === 'warm_transfer').length || 0
    };
    
    return NextResponse.json({
      success: true,
      calls: data,
      stats
    });
    
  } catch (error: any) {
    console.error('[Call Logs GET] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH - Update call log
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const body: UpdateCallLogRequest = await request.json();
    const { call_log_id, ...updateData } = body;
    
    if (!call_log_id) {
      return NextResponse.json({ error: 'call_log_id required' }, { status: 400 });
    }
    
    // Update call log
    const { data: callLog, error } = await supabase
      .from('call_logs')
      .update({
        ...updateData,
        ...(updateData.ended_at ? {} : { ended_at: new Date().toISOString() })
      })
      .eq('id', call_log_id)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    // If this was a cancellation attempt, log audit
    if (updateData.cancellation_attempted) {
      const auditType = updateData.nudge_successful 
        ? 'success' 
        : updateData.cancellation_nudged 
          ? 'nudge_failure' 
          : 'success';
      
      await supabase.from('call_audits').insert({
        business_id: callLog.business_id,
        call_log_id,
        audit_type: auditType,
        description: updateData.nudge_successful 
          ? 'Successfully nudged cancellation to reschedule'
          : updateData.cancellation_nudged
            ? 'Nudge attempted but customer insisted on cancellation'
            : 'Cancellation processed without nudge opportunity',
        severity: updateData.nudge_successful ? 'low' : 'medium',
        context_snapshot: {
          intent: updateData.intent_detected,
          action: updateData.action_taken,
          nudge_attempted: updateData.cancellation_nudged
        }
      });
    }
    
    return NextResponse.json({
      success: true,
      call_log: callLog
    });
    
  } catch (error: any) {
    console.error('[Call Logs PATCH] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
