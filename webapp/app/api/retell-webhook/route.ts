import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Retell webhook events
interface RetellWebhookEvent {
  event: string;
  call: {
    call_id: string;
    call_status: string;
    start_timestamp?: number;
    end_timestamp?: number;
    duration_ms?: number;
    from_number?: string;
    to_number?: string;
    direction?: string;
    agent_id?: string;
    transcript?: string;
    recording_url?: string;
    call_analysis?: {
      call_summary?: string;
      user_sentiment?: string;
      call_successful?: boolean;
      custom_analysis_data?: Record<string, any>;
    };
    metadata?: Record<string, any>;
  };
}

export async function POST(request: NextRequest) {
  try {
    const event: RetellWebhookEvent = await request.json();
    
    console.log('Retell webhook received:', event.event, event.call?.call_id);
    
    const { call } = event;
    
    switch (event.event) {
      case 'call_started': {
        // Log call start
        await supabase.from('call_logs').insert({
          retell_call_id: call.call_id,
          from_number: call.from_number,
          to_number: call.to_number,
          direction: call.direction,
          agent_id: call.agent_id,
          status: 'in_progress',
          started_at: call.start_timestamp ? new Date(call.start_timestamp).toISOString() : new Date().toISOString(),
          metadata: call.metadata || {}
        });
        
        // Update scheduled_calls if this was an outbound call we initiated
        if (call.metadata?.scheduled_call_id) {
          await supabase
            .from('scheduled_calls')
            .update({ 
              status: 'in_progress',
              retell_call_id: call.call_id
            })
            .eq('id', call.metadata.scheduled_call_id);
        }
        
        break;
      }
      
      case 'call_ended': {
        const durationSeconds = call.duration_ms ? Math.round(call.duration_ms / 1000) : null;
        const analysis = call.call_analysis;
        
        // Update call log
        await supabase
          .from('call_logs')
          .update({
            status: call.call_status,
            duration_seconds: durationSeconds,
            ended_at: call.end_timestamp ? new Date(call.end_timestamp).toISOString() : new Date().toISOString(),
            transcript: call.transcript,
            summary: analysis?.call_summary,
            sentiment: analysis?.user_sentiment,
            metadata: {
              ...call.metadata,
              recording_url: call.recording_url,
              call_successful: analysis?.call_successful,
              custom_analysis: analysis?.custom_analysis_data
            }
          })
          .eq('retell_call_id', call.call_id);
        
        // Update scheduled_calls if applicable
        if (call.metadata?.scheduled_call_id) {
          await supabase
            .from('scheduled_calls')
            .update({
              status: 'completed',
              call_duration_seconds: durationSeconds,
              transcript: call.transcript,
              call_outcome: determineCallOutcome(analysis),
              completed_at: new Date().toISOString()
            })
            .eq('id', call.metadata.scheduled_call_id);
        }
        
        // If a booking was created during the call, link it
        if (call.metadata?.booking_id) {
          await supabase
            .from('call_logs')
            .update({ booking_id: call.metadata.booking_id })
            .eq('retell_call_id', call.call_id);
        }
        
        // If a lead was captured, link it
        if (call.metadata?.lead_id) {
          await supabase
            .from('call_logs')
            .update({ lead_id: call.metadata.lead_id })
            .eq('retell_call_id', call.call_id);
        }
        
        break;
      }
      
      case 'call_analyzed': {
        // Update with analysis results
        const analysis = call.call_analysis;
        
        await supabase
          .from('call_logs')
          .update({
            summary: analysis?.call_summary,
            sentiment: analysis?.user_sentiment,
            metadata: supabase.rpc('jsonb_merge', {
              original: {},
              updates: {
                call_successful: analysis?.call_successful,
                custom_analysis: analysis?.custom_analysis_data
              }
            })
          })
          .eq('retell_call_id', call.call_id);
        
        break;
      }
    }
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Webhook error:', error);
    // Still return 200 to prevent Retell from retrying
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}

// Determine call outcome from analysis
function determineCallOutcome(analysis?: RetellWebhookEvent['call']['call_analysis']): string {
  if (!analysis) return 'unknown';
  
  if (analysis.call_successful) {
    return 'booked';
  }
  
  const summary = analysis.call_summary?.toLowerCase() || '';
  
  if (summary.includes('voicemail') || summary.includes('left message')) {
    return 'voicemail';
  }
  if (summary.includes('callback') || summary.includes('call back')) {
    return 'callback_requested';
  }
  if (summary.includes('not interested') || summary.includes('declined')) {
    return 'not_interested';
  }
  if (summary.includes('no answer') || summary.includes('didn\'t answer')) {
    return 'no_answer';
  }
  
  return 'completed';
}

// GET endpoint for testing
export async function GET() {
  return NextResponse.json({
    status: 'active',
    endpoint: '/api/retell-webhook',
    description: 'Webhook endpoint for Retell AI call events',
    events_handled: ['call_started', 'call_ended', 'call_analyzed']
  });
}
