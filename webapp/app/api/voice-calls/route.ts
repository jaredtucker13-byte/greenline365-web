import { NextRequest, NextResponse } from 'next/server';

// Retell AI API configuration
const RETELL_API_KEY = process.env.RETELL_API_KEY || 'key_f687b4174315717b05fb63c4ed01';
const RETELL_API_URL = 'https://api.retellai.com';

// Twilio configuration (for phone number provisioning)
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;

interface CallRequest {
  to_phone: string;       // Phone number to call
  from_phone?: string;    // Your Twilio number (optional, uses default)
  agent_id: string;       // Retell agent ID
  metadata?: Record<string, any>; // Custom data to pass to the agent
}

// Create an outbound call via Retell
async function createOutboundCall(callRequest: CallRequest) {
  const response = await fetch(`${RETELL_API_URL}/v2/create-phone-call`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RETELL_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      to_number: callRequest.to_phone,
      from_number: callRequest.from_phone,
      agent_id: callRequest.agent_id,
      metadata: callRequest.metadata,
      retell_llm_dynamic_variables: callRequest.metadata // Pass metadata to the agent
    })
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Retell API error: ${error}`);
  }
  
  return response.json();
}

// Get list of available agents
async function getAgents() {
  const response = await fetch(`${RETELL_API_URL}/v2/list-agents`, {
    headers: {
      'Authorization': `Bearer ${RETELL_API_KEY}`
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch agents');
  }
  
  return response.json();
}

// Get call details
async function getCallDetails(callId: string) {
  const response = await fetch(`${RETELL_API_URL}/v2/get-call/${callId}`, {
    headers: {
      'Authorization': `Bearer ${RETELL_API_KEY}`
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch call details');
  }
  
  return response.json();
}

// POST - Make an outbound call
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;
    
    switch (action) {
      case 'make_call': {
        const { to_phone, agent_id, customer_name, purpose } = params;
        
        if (!to_phone || !agent_id) {
          return NextResponse.json({
            success: false,
            error: 'Missing required fields: to_phone and agent_id'
          }, { status: 400 });
        }
        
        const result = await createOutboundCall({
          to_phone,
          agent_id,
          metadata: {
            customer_name,
            purpose,
            source: 'command_center'
          }
        });
        
        return NextResponse.json({
          success: true,
          call_id: result.call_id,
          status: result.call_status,
          message: `Call initiated to ${to_phone}`
        });
      }
      
      case 'get_call_status': {
        const { call_id } = params;
        
        if (!call_id) {
          return NextResponse.json({
            success: false,
            error: 'Missing call_id'
          }, { status: 400 });
        }
        
        const result = await getCallDetails(call_id);
        
        return NextResponse.json({
          success: true,
          call: result
        });
      }
      
      case 'list_agents': {
        const agents = await getAgents();
        return NextResponse.json({
          success: true,
          agents
        });
      }
      
      default:
        return NextResponse.json({
          success: false,
          error: 'Unknown action. Available actions: make_call, get_call_status, list_agents'
        }, { status: 400 });
    }
    
  } catch (error) {
    console.error('Voice call error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET - Get available agents and system status
export async function GET() {
  try {
    const agents = await getAgents();
    
    return NextResponse.json({
      success: true,
      system_status: 'operational',
      available_actions: [
        {
          action: 'make_call',
          description: 'Initiate an outbound call',
          required_params: ['to_phone', 'agent_id'],
          optional_params: ['customer_name', 'purpose']
        },
        {
          action: 'get_call_status',
          description: 'Get status of a call',
          required_params: ['call_id']
        },
        {
          action: 'list_agents',
          description: 'List available voice AI agents'
        }
      ],
      agents: agents.map((agent: any) => ({
        id: agent.agent_id,
        name: agent.agent_name,
        voice: agent.voice_id
      }))
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Could not fetch system status'
    }, { status: 500 });
  }
}
