import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Retell API
const RETELL_API_KEY = process.env.RETELL_API_KEY;
const RETELL_API_URL = 'https://api.retellai.com';

interface ScheduleCallRequest {
  lead_name: string;
  lead_phone: string;
  lead_email?: string;
  purpose?: string;
  notes?: string;
  scheduled_for?: string;  // ISO date string, or null for immediate
  call_immediately?: boolean;
  tenant_id?: string;
}

// Make an outbound call via Retell
async function makeOutboundCall(
  toPhone: string, 
  agentId: string, 
  metadata: Record<string, any>,
  fromPhone?: string
) {
  const response = await fetch(`${RETELL_API_URL}/v2/create-phone-call`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RETELL_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      to_number: toPhone,
      from_number: fromPhone,
      agent_id: agentId,
      metadata,
      retell_llm_dynamic_variables: metadata
    })
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Retell API error: ${error}`);
  }
  
  return response.json();
}

// Get tenant by ID or default
async function getTenant(tenantId?: string) {
  if (tenantId) {
    const { data } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .single();
    return data;
  }
  
  // Get default tenant
  const { data } = await supabase
    .from('tenants')
    .select('*')
    .eq('business_name', 'GreenLine365')
    .single();
  return data;
}

export async function POST(request: NextRequest) {
  try {
    const body: ScheduleCallRequest = await request.json();
    const { 
      lead_name, 
      lead_phone, 
      lead_email, 
      purpose = 'follow_up',
      notes,
      scheduled_for,
      call_immediately = false,
      tenant_id
    } = body;
    
    // Validate required fields
    if (!lead_name || !lead_phone) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: lead_name and lead_phone'
      }, { status: 400 });
    }
    
    // Get tenant
    const tenant = await getTenant(tenant_id);
    
    // Save to scheduled_calls table
    const { data: scheduledCall, error: dbError } = await supabase
      .from('scheduled_calls')
      .insert({
        tenant_id: tenant?.id,
        lead_name,
        lead_phone,
        lead_email,
        purpose,
        notes,
        scheduled_for: scheduled_for || (call_immediately ? new Date().toISOString() : null),
        call_immediately,
        status: call_immediately ? 'in_progress' : 'pending'
      })
      .select()
      .single();
    
    if (dbError) {
      console.error('DB Error:', dbError);
      // Continue anyway - we can still make the call
    }
    
    // If call_immediately, trigger the Retell call now
    if (call_immediately && RETELL_API_KEY && tenant?.retell_agent_id) {
      try {
        const callResult = await makeOutboundCall(
          lead_phone,
          tenant.retell_agent_id,
          {
            lead_name,
            lead_email,
            purpose,
            notes,
            tenant_name: tenant.business_name,
            source: 'chat_widget'
          },
          tenant.twilio_phone_number
        );
        
        // Update scheduled call with Retell call ID
        if (scheduledCall?.id) {
          await supabase
            .from('scheduled_calls')
            .update({ 
              retell_call_id: callResult.call_id,
              status: 'in_progress'
            })
            .eq('id', scheduledCall.id);
        }
        
        return NextResponse.json({
          success: true,
          message: `Call initiated to ${lead_name} at ${lead_phone}`,
          call_id: callResult.call_id,
          scheduled_call_id: scheduledCall?.id
        });
        
      } catch (callError) {
        console.error('Call error:', callError);
        
        // Update status to failed
        if (scheduledCall?.id) {
          await supabase
            .from('scheduled_calls')
            .update({ status: 'failed' })
            .eq('id', scheduledCall.id);
        }
        
        return NextResponse.json({
          success: false,
          error: 'Failed to initiate call',
          scheduled_call_id: scheduledCall?.id,
          message: 'Call scheduled for manual follow-up'
        }, { status: 500 });
      }
    }
    
    // Call scheduled for later
    return NextResponse.json({
      success: true,
      message: scheduled_for 
        ? `Call scheduled for ${new Date(scheduled_for).toLocaleString()}`
        : 'Lead saved for follow-up',
      scheduled_call_id: scheduledCall?.id
    });
    
  } catch (error) {
    console.error('Schedule call error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET - List scheduled/pending calls
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';
    const limit = parseInt(searchParams.get('limit') || '50');
    
    const { data: calls, error } = await supabase
      .from('scheduled_calls')
      .select(`
        *,
        tenants:tenant_id (business_name)
      `)
      .eq('status', status)
      .order('scheduled_for', { ascending: true })
      .limit(limit);
    
    if (error) {
      throw error;
    }
    
    return NextResponse.json({
      success: true,
      calls,
      count: calls?.length || 0
    });
    
  } catch (error) {
    console.error('Get calls error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
