import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Retell from 'retell-sdk';

/**
 * Retell AI Webhook Handler
 * 
 * Receives call events from Retell AI and logs them to Supabase
 * Events: call_started, call_ended, call_analyzed
 * 
 * POST /api/retell/webhook
 */

const RETELL_API_KEY = process.env.RETELL_API_KEY || '';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const signature = request.headers.get('x-retell-signature') || '';
    
    // Verify webhook signature
    if (RETELL_API_KEY) {
      const bodyString = JSON.stringify(body);
      const isValid = Retell.verify(bodyString, RETELL_API_KEY, signature);
      
      if (!isValid) {
        console.error('[Retell Webhook] Invalid signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }
    
    const event = body.event;
    const callData = body.call || {};
    
    console.log(`[Retell Webhook] Event: ${event}, Call ID: ${callData.call_id}`);
    
    const supabase = await createClient();
    
    // Extract business_id from metadata or agent configuration
    const businessId = callData.metadata?.business_id || 
                       callData.retell_llm_dynamic_variables?.business_id;
    
    if (!businessId) {
      console.error('[Retell Webhook] No business_id in call metadata');
      return NextResponse.json({ error: 'Missing business_id' }, { status: 400 });
    }
    
    switch (event) {
      case 'call_started':
        await handleCallStarted(supabase, callData, businessId);
        break;
        
      case 'call_ended':
        await handleCallEnded(supabase, callData, businessId);
        break;
        
      case 'call_analyzed':
        await handleCallAnalyzed(supabase, callData, businessId);
        break;
        
      default:
        console.log(`[Retell Webhook] Unknown event: ${event}`);
    }
    
    return new NextResponse(null, { status: 204 });
    
  } catch (error: any) {
    console.error('[Retell Webhook] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function handleCallStarted(supabase: any, callData: any, businessId: string) {
  const { error } = await supabase.from('call_logs').insert({
    business_id: businessId,
    call_id: callData.call_id,
    call_type: callData.call_type === 'phone_call' ? 'inbound' : 'web_call',
    caller_phone: callData.from_number,
    caller_name: callData.retell_llm_dynamic_variables?.customer_name,
    caller_email: callData.retell_llm_dynamic_variables?.customer_email,
    started_at: new Date(callData.start_timestamp).toISOString(),
    retell_metadata: {
      agent_id: callData.agent_id,
      direction: callData.direction,
      to_number: callData.to_number,
    },
  });
  
  if (error) {
    console.error('[Retell] Error inserting call_started:', error);
  }
}

async function handleCallEnded(supabase: any, callData: any, businessId: string) {
  const duration = callData.end_timestamp && callData.start_timestamp
    ? Math.round((callData.end_timestamp - callData.start_timestamp) / 1000)
    : null;

  const { error } = await supabase
    .from('call_logs')
    .update({
      ended_at: callData.end_timestamp
        ? new Date(callData.end_timestamp).toISOString()
        : new Date().toISOString(),
      duration_seconds: duration,
      conversation_summary: callData.transcript,
      recording_url: callData.recording_url,
      retell_metadata: {
        disconnection_reason: callData.disconnection_reason,
        transcript_object: callData.transcript_object,
      },
    })
    .eq('call_id', callData.call_id);

  if (error) {
    console.error('[Retell] Error updating call_ended:', error);
  }

  // Brain journal — log voice call so chat agents can recall it
  const callerName = callData.retell_llm_dynamic_variables?.customer_name || callData.from_number;
  const callerPhone = callData.from_number;
  const callerEmail = callData.retell_llm_dynamic_variables?.customer_email;

  await supabase.from('memory_event_journal').insert({
    event_type: 'voice_call',
    event_category: 'call',
    title: `Voice call${callerName ? ` with ${callerName}` : ''} (${duration ? Math.round(duration / 60) + ' min' : 'unknown duration'})`,
    description: callData.transcript ? callData.transcript.substring(0, 500) : 'No transcript available',
    metadata: {
      call_id: callData.call_id,
      caller_phone: callerPhone,
      caller_email: callerEmail,
      caller_name: callerName,
      duration_seconds: duration,
      agent_id: callData.agent_id,
      disconnection_reason: callData.disconnection_reason,
    },
    tags: [
      'voice_call',
      `agent:${callData.agent_id || 'retell'}`,
      ...(callerPhone ? [`phone:${callerPhone}`] : []),
    ],
    search_text: [callerName, callerPhone, callerEmail, callData.transcript?.substring(0, 200)].filter(Boolean).join(' '),
    ai_generated: false,
  }).then(() => {}).catch(() => {}); // Fire and forget
}

async function handleCallAnalyzed(supabase: any, callData: any, businessId: string) {
  const analysis = callData.call_analysis || {};
  
  // Determine intent from analysis
  let intentDetected = 'inquiry';
  let actionTaken = 'none';
  let cancellationAttempted = false;
  let cancellationNudged = false;
  let nudgeSuccessful = false;
  
  const summary = (analysis.call_summary || '').toLowerCase();
  
  if (summary.includes('book') || summary.includes('appointment') || summary.includes('schedule')) {
    intentDetected = 'booking';
    if (analysis.call_successful) actionTaken = 'booked';
  } else if (summary.includes('cancel')) {
    intentDetected = 'cancellation';
    cancellationAttempted = true;
    // Check if nudge was successful (rescheduled instead of cancelled)
    if (summary.includes('reschedule') || summary.includes('moved')) {
      cancellationNudged = true;
      nudgeSuccessful = true;
      actionTaken = 'rescheduled';
    } else {
      actionTaken = 'cancelled';
    }
  } else if (summary.includes('reschedule')) {
    intentDetected = 'reschedule';
    if (analysis.call_successful) actionTaken = 'rescheduled';
  } else if (summary.includes('transfer') || summary.includes('sales')) {
    intentDetected = 'sales';
    actionTaken = 'transferred';
  }
  
  const { error } = await supabase
    .from('call_logs')
    .update({
      intent_detected: intentDetected,
      action_taken: actionTaken,
      cancellation_attempted: cancellationAttempted,
      cancellation_nudged: cancellationNudged,
      nudge_successful: nudgeSuccessful,
      conversation_summary: analysis.call_summary,
      retell_metadata: {
        user_sentiment: analysis.user_sentiment,
        call_successful: analysis.call_successful,
        in_voicemail: analysis.in_voicemail,
        custom_analysis: analysis.custom_analysis_data,
      },
    })
    .eq('call_id', callData.call_id);
  
  if (error) {
    console.error('[Retell] Error updating call_analyzed:', error);
  }
  
  // Brain: upsert contact to brain_people so chat agents recognize them
  const callerName = callData.retell_llm_dynamic_variables?.customer_name;
  const callerPhone = callData.from_number;
  const callerEmail = callData.retell_llm_dynamic_variables?.customer_email;

  if (callerName && businessId) {
    await supabase.from('brain_people').upsert({
      business_id: businessId,
      name: callerName,
      relationship: intentDetected === 'booking' ? 'customer' : 'prospect',
      contact_info: {
        phone: callerPhone,
        email: callerEmail,
      },
      notes: analysis.call_summary?.substring(0, 500),
      context: `Voice call on ${new Date().toLocaleDateString()}. Intent: ${intentDetected}. Action: ${actionTaken}. Sentiment: ${analysis.user_sentiment || 'unknown'}`,
      last_contact: new Date().toISOString(),
    }, {
      onConflict: 'business_id,name',
      ignoreDuplicates: false,
    }).then(() => {}).catch(() => {});

    // Brain edge: contact → call
    if (callerPhone) {
      await supabase.from('brain_edges').insert({
        business_id: businessId,
        source_type: 'contact',
        source_id: callerPhone,
        target_type: 'voice_call',
        target_id: callData.call_id,
        relationship: 'had_call',
        strength: 1.0,
        metadata: {
          intent: intentDetected,
          action: actionTaken,
          sentiment: analysis.user_sentiment,
        },
        created_by: 'retell_webhook',
      }).then(() => {}).catch(() => {});
    }
  }

  // Create audit log for cancellation attempts
  if (cancellationAttempted) {
    await supabase.from('call_audits').insert({
      business_id: businessId,
      call_log_id: null, // We'd need to query for this
      audit_type: nudgeSuccessful ? 'success' : 'nudge_failure',
      description: nudgeSuccessful 
        ? 'Successfully nudged cancellation to reschedule'
        : 'Customer proceeded with cancellation',
      severity: nudgeSuccessful ? 'low' : 'medium',
      context_snapshot: {
        intent: intentDetected,
        action: actionTaken,
        sentiment: analysis.user_sentiment,
      },
    });
  }
}
