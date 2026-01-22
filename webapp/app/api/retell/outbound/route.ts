import { NextRequest, NextResponse } from 'next/server';
import Retell from 'retell-sdk';
import { createClient } from '@/lib/supabase/server';

/**
 * Outbound Call API - Trigger Retell to call a prospect
 * 
 * POST /api/retell/outbound
 * 
 * Used by the Concierge widget to initiate demo calls
 */

const RETELL_API_KEY = process.env.RETELL_API_KEY || '';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      phone_number, 
      customer_name,
      customer_email,
      call_type = 'demo',  // 'demo', 'sales', 'support', 'followup'
      agent_id,            // Optional: specific agent to use
      metadata = {}        // Additional context to pass to agent
    } = body;
    
    if (!phone_number) {
      return NextResponse.json({ 
        error: 'Phone number is required' 
      }, { status: 400 });
    }
    
    if (!RETELL_API_KEY) {
      return NextResponse.json({ 
        error: 'Retell API not configured',
        mock: true,
        message: 'In production, this would trigger a call to ' + phone_number
      }, { status: 200 });
    }
    
    // Format phone number to E.164
    const formattedPhone = formatPhoneE164(phone_number);
    if (!formattedPhone) {
      return NextResponse.json({ 
        error: 'Invalid phone number format. Please use format: +1XXXXXXXXXX or (XXX) XXX-XXXX' 
      }, { status: 400 });
    }
    
    // Initialize Retell client
    const retell = new Retell({ apiKey: RETELL_API_KEY });
    
    // Determine which agent to use based on call type
    const agentConfig = getAgentConfig(call_type, agent_id);
    
    // Create the outbound call
    const callResponse = await retell.call.createPhoneCall({
      from_number: agentConfig.from_number,
      to_number: formattedPhone,
      override_agent_id: agentConfig.agent_id,
      retell_llm_dynamic_variables: {
        customer_name: customer_name || 'there',
        customer_phone: formattedPhone,
        customer_email: customer_email || '',
        call_type: call_type,
        ...metadata
      },
      metadata: {
        source: 'concierge_widget',
        call_type,
        customer_name,
        customer_email,
        initiated_at: new Date().toISOString()
      }
    });
    
    // Log the call to Supabase
    const supabase = await createClient();
    await supabase.from('call_logs').insert({
      call_id: callResponse.call_id,
      call_type: 'outbound',
      caller_phone: formattedPhone,
      caller_name: customer_name,
      caller_email: customer_email,
      intent_detected: call_type,
      started_at: new Date().toISOString(),
      retell_metadata: {
        agent_id: agentConfig.agent_id,
        from_number: agentConfig.from_number,
        source: 'concierge_widget'
      }
    });
    
    return NextResponse.json({
      success: true,
      call_id: callResponse.call_id,
      message: `We're calling you now at ${formattedPhone}. Please answer the call!`,
      estimated_wait: '10-15 seconds'
    });
    
  } catch (error: any) {
    console.error('[Outbound Call] Error:', error);
    
    // Handle specific Retell errors
    if (error.message?.includes('invalid phone')) {
      return NextResponse.json({ 
        error: 'Invalid phone number. Please check and try again.' 
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      error: 'Failed to initiate call. Please try again.',
      details: error.message 
    }, { status: 500 });
  }
}

// Format phone number to E.164 format (+1XXXXXXXXXX)
function formatPhoneE164(phone: string): string | null {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');
  
  // Handle different formats
  if (digits.length === 10) {
    // US number without country code
    return `+1${digits}`;
  } else if (digits.length === 11 && digits.startsWith('1')) {
    // US number with country code
    return `+${digits}`;
  } else if (digits.length > 10) {
    // International number
    return `+${digits}`;
  }
  
  return null;
}

// Get agent configuration based on call type
function getAgentConfig(callType: string, overrideAgentId?: string) {
  // These would be your actual Retell agent IDs and phone numbers
  const configs: Record<string, { agent_id: string; from_number: string }> = {
    demo: {
      agent_id: overrideAgentId || process.env.RETELL_DEMO_AGENT_ID || '',
      from_number: process.env.RETELL_OUTBOUND_NUMBER || ''
    },
    sales: {
      agent_id: overrideAgentId || process.env.RETELL_SALES_AGENT_ID || '',
      from_number: process.env.RETELL_OUTBOUND_NUMBER || ''
    },
    support: {
      agent_id: overrideAgentId || process.env.RETELL_SUPPORT_AGENT_ID || '',
      from_number: process.env.RETELL_OUTBOUND_NUMBER || ''
    },
    followup: {
      agent_id: overrideAgentId || process.env.RETELL_FOLLOWUP_AGENT_ID || '',
      from_number: process.env.RETELL_OUTBOUND_NUMBER || ''
    }
  };
  
  return configs[callType] || configs.demo;
}

// GET - Check call status
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const callId = searchParams.get('call_id');
  
  if (!callId) {
    return NextResponse.json({ error: 'call_id required' }, { status: 400 });
  }
  
  if (!RETELL_API_KEY) {
    return NextResponse.json({ 
      mock: true,
      status: 'completed',
      message: 'Mock call status'
    });
  }
  
  try {
    const retell = new Retell({ apiKey: RETELL_API_KEY });
    const call = await retell.call.retrieve(callId);
    
    return NextResponse.json({
      success: true,
      call_id: callId,
      status: call.call_status,
      duration: call.end_timestamp && call.start_timestamp 
        ? Math.round((call.end_timestamp - call.start_timestamp) / 1000)
        : null,
      recording_url: call.recording_url
    });
    
  } catch (error: any) {
    console.error('[Outbound Status] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
