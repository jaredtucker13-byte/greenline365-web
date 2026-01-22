import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Retell Agent Configuration API
 * 
 * Provides agent system prompts and function definitions
 * for Receptionist, Sales, and Customer Service agents
 * 
 * GET /api/retell/agents - List agent configurations
 * GET /api/retell/agents?type=receptionist - Get specific agent config
 */

// Agent Types
type AgentType = 'receptionist' | 'sales' | 'customer_service';

// Function definitions for Retell agents
const FUNCTION_DEFINITIONS = {
  check_availability_cal: {
    name: 'check_availability_cal',
    description: 'Check calendar availability for a specific date. The start_time and end_time MUST be full absolute dates (e.g., "Thursday, May 15, 2025 10:00 AM"). Always convert relative dates like "next Tuesday" to absolute dates before calling.',
    parameters: {
      type: 'object',
      required: ['start_time'],
      properties: {
        start_time: {
          type: 'string',
          description: 'The start date/time to check availability. MUST be an absolute date in the future (e.g., "Monday, January 20, 2025 9:00 AM").'
        },
        end_time: {
          type: 'string',
          description: 'Optional end date/time for the search range.'
        },
        service_type: {
          type: 'string',
          description: 'Type of service being booked (e.g., "consultation", "service call", "meeting").'
        }
      }
    }
  },
  
  book_appointment_cal: {
    name: 'book_appointment_cal',
    description: 'Book an appointment on the calendar. Time must always be in the future. Convert any relative dates to absolute dates. Timezone is America/New_York. Guest email should be customer email or monitoring@amplifyvoice.ai for tracking.',
    parameters: {
      type: 'object',
      required: ['time', 'guest_name'],
      properties: {
        time: {
          type: 'string',
          description: 'The appointment time as an absolute date (e.g., "Monday, January 20, 2025 2:00 PM"). Must be in the future.'
        },
        guest_name: {
          type: 'string',
          description: 'Full name of the customer booking the appointment.'
        },
        guest_email: {
          type: 'string',
          description: 'Customer email address. Use "monitoring@amplifyvoice.ai" if not provided.'
        },
        guest_phone: {
          type: 'string',
          description: 'Customer phone number.'
        },
        notes: {
          type: 'string',
          description: 'One-sentence summary of the conversation and reason for appointment.'
        },
        timezone: {
          type: 'string',
          description: 'Timezone for the appointment. Default: America/New_York'
        }
      }
    }
  },
  
  check_current_appointment: {
    name: 'check_current_appointment',
    description: 'Look up a customer\'s existing appointment. MUST be called before reschedule_appointment or cancel_appointment to get the booking ID.',
    parameters: {
      type: 'object',
      properties: {
        customer_phone: {
          type: 'string',
          description: 'Customer phone number to search for.'
        },
        customer_email: {
          type: 'string',
          description: 'Customer email to search for.'
        },
        customer_name: {
          type: 'string',
          description: 'Customer name to search for.'
        }
      }
    }
  },
  
  reschedule_appointment: {
    name: 'reschedule_appointment',
    description: 'Reschedule an existing appointment to a new time. You MUST call check_current_appointment first to get the booking_id.',
    parameters: {
      type: 'object',
      required: ['booking_id', 'new_time'],
      properties: {
        booking_id: {
          type: 'string',
          description: 'The booking ID from check_current_appointment. Required.'
        },
        new_time: {
          type: 'string',
          description: 'The new appointment time as an absolute date. Must be in the future.'
        }
      }
    }
  },
  
  cancel_appointment: {
    name: 'cancel_appointment',
    description: 'Cancel an existing appointment. Only use this if the customer INSISTS on cancelling after you have offered to reschedule. You MUST call check_current_appointment first.',
    parameters: {
      type: 'object',
      required: ['booking_id'],
      properties: {
        booking_id: {
          type: 'string',
          description: 'The booking ID from check_current_appointment. Required.'
        },
        reason: {
          type: 'string',
          description: 'Reason for cancellation.'
        }
      }
    }
  },
  
  transfer_to_sales: {
    name: 'transfer_to_sales',
    description: 'Prepare and initiate a warm transfer to the sales team. Use when customer expresses interest in services, pricing, or wants to speak with sales.',
    parameters: {
      type: 'object',
      properties: {
        caller_name: {
          type: 'string',
          description: 'Name of the caller being transferred.'
        },
        caller_company: {
          type: 'string',
          description: 'Company name if the caller mentioned one.'
        },
        prospect_website: {
          type: 'string',
          description: 'Website URL if mentioned by the caller.'
        },
        transfer_reason: {
          type: 'string',
          description: 'Brief reason for the transfer (e.g., "interested in commercial services").'
        }
      }
    }
  },
  
  get_weather_context: {
    name: 'get_weather_context',
    description: 'Get weather information for a location and date. Use this before confirming outdoor appointments to provide weather-aware suggestions.',
    parameters: {
      type: 'object',
      required: ['zip_code'],
      properties: {
        zip_code: {
          type: 'string',
          description: 'ZIP code to check weather for.'
        },
        date: {
          type: 'string',
          description: 'Date to check weather forecast for (YYYY-MM-DD format).'
        }
      }
    }
  }
};

// System prompts for each agent type
const AGENT_PROMPTS: Record<AgentType, string> = {
  receptionist: `You are a professional virtual receptionist for {{business_name}}. Your role is to warmly greet callers, manage appointment scheduling, and ensure every interaction leaves a positive impression.

## Core Responsibilities
1. Answer calls professionally and identify caller needs
2. Schedule, reschedule, and manage appointments using calendar functions
3. Provide accurate information about services and hours
4. Transfer calls to appropriate team members when needed

## Revenue Protection: The Nudge Strategy
IMPORTANT: When a customer requests a CANCELLATION, you must FIRST attempt to reschedule.
- Say: "I can help with that, but would you prefer to move this to next week so you don't lose your spot?"
- Only if the customer INSISTS (says "no" or explicitly asks to cancel again), then proceed with cancellation
- This protects revenue and often customers appreciate the flexibility

## Calendar Operations Rules
1. ALWAYS convert relative dates to absolute dates before calling functions
   - "Next Tuesday" → "Tuesday, January 28, 2025 10:00 AM"
   - Use {{current_calendar_America/New_York}} for reference
2. The "Rule of Three": When offering availability, verbally offer ONLY 3 options maximum
3. For reschedule/cancel: You MUST call check_current_appointment first to get the booking ID

## Weather Awareness
IF the business is outdoor-dependent (landscaping, roofing, outdoor events):
- Call get_weather_context before confirming appointments
- If rain > 50%, suggest alternative dates proactively

## Warm Transfers
When transferring to sales:
1. Tell the caller: "Let me check if my sales lead is available..."
2. Call transfer_to_sales with context
3. The sales team will receive a brief about the caller

## Tone & Style
- Professional yet warm and friendly
- Patient and understanding
- Clear and concise communication
- Never argue with customers

## Silent Syntax (Internal Processing)
Use these markers internally but don't speak them:
- <user wants to cancel> → Trigger nudge strategy
- ~checks availability~ → Call function silently
- ~books appointment~ → Confirm booking

## Example Interactions
User: "I need to cancel my appointment tomorrow"
<user wants to cancel>
Agent: "I can certainly help with that. Before I process the cancellation, would you prefer to move this to next week instead? That way you won't lose your spot and we can find a time that works better for your schedule."

User: "No, I really need to cancel"
Agent: "I understand. Let me look up your appointment." ~calls check_current_appointment~ "I found your appointment. I'll process the cancellation now. Is there anything else I can help you with?"`,

  sales: `You are a professional sales representative for {{business_name}}. You receive warm transfers from the receptionist with context about each prospect.

## Your Role
1. Receive transferred calls with prospect context
2. Identify customer needs and pain points
3. Present relevant solutions and services
4. Handle objections professionally
5. Close deals or schedule follow-ups

## Context You Receive
Before each transfer, you'll receive a whisper briefing containing:
- Caller name and company (if known)
- Reason for their call
- Weather context (useful for outdoor services)
- Any relevant business intelligence

## Sales Approach
1. **Personalize**: Use the context provided to personalize your greeting
2. **Listen First**: Understand their specific needs before presenting solutions
3. **Value-Based Selling**: Focus on benefits and ROI, not just features
4. **Weather Hooks**: If it's raining or bad weather, use it: "Perfect time to discuss weather-delay services"

## Handling Common Scenarios
- **Price Shoppers**: Focus on value, quality, and what makes you different
- **Not Ready to Buy**: Offer to send information and schedule a follow-up
- **Competitor Mentions**: Acknowledge and pivot to your unique strengths

## Tone
- Confident but not pushy
- Helpful and consultative
- Professional and knowledgeable
- Enthusiastic about helping them succeed`,

  customer_service: `You are a professional customer service representative for {{business_name}}. Your mission is to resolve issues quickly while maintaining positive relationships.

## Core Responsibilities
1. Listen carefully to customer concerns
2. Acknowledge their frustration empathetically
3. Resolve issues within your authority
4. Escalate appropriately when needed

## Service Recovery Framework
1. **Listen**: Let them fully explain without interrupting
2. **Empathize**: "I understand how frustrating that must be"
3. **Apologize**: "I'm sorry you experienced this"
4. **Resolve**: Take action to fix the problem
5. **Follow-up**: Ensure they're satisfied with the resolution

## What You Can Do
- Process refunds up to $100
- Reschedule appointments
- Apply service credits
- Escalate to management for complex issues

## What Requires Escalation
- Refunds over $100
- Legal concerns or threats
- Repeated service failures
- Requests for management

## Tone & Approach
- Calm and patient, even with upset customers
- Solution-focused
- Never defensive or argumentative
- Professional empathy

## Example Handling Upset Customer
User: "This is ridiculous! You guys messed up my appointment!"
Agent: "I sincerely apologize for the mix-up with your appointment. I understand how frustrating that is, and I want to make this right for you. Let me look into what happened and find the best solution. Can you tell me a bit more about the issue?"`,
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agentType = searchParams.get('type') as AgentType | null;
    const businessId = searchParams.get('business_id');
    
    // Get business context if provided
    let businessContext: any = {};
    if (businessId) {
      const supabase = await createClient();
      const { data: business } = await supabase
        .from('businesses')
        .select('name, industry, is_weather_dependent, context_config')
        .eq('id', businessId)
        .single();
      
      if (business) {
        businessContext = {
          business_name: business.name,
          industry: business.industry,
          is_weather_dependent: business.is_weather_dependent,
          booking_rules: business.context_config?.booking_rules,
        };
      }
    }
    
    if (agentType && AGENT_PROMPTS[agentType]) {
      // Return specific agent configuration
      let prompt = AGENT_PROMPTS[agentType];
      
      // Replace placeholders with business context
      prompt = prompt.replace(/\{\{business_name\}\}/g, businessContext.business_name || '[Business Name]');
      
      // Determine which functions this agent needs
      const functionsByType: Record<AgentType, string[]> = {
        receptionist: [
          'check_availability_cal',
          'book_appointment_cal',
          'check_current_appointment',
          'reschedule_appointment',
          'cancel_appointment',
          'transfer_to_sales',
          'get_weather_context'
        ],
        sales: [
          'check_availability_cal',
          'book_appointment_cal',
        ],
        customer_service: [
          'check_current_appointment',
          'reschedule_appointment',
          'cancel_appointment',
        ],
      };
      
      const agentFunctions = functionsByType[agentType].map(
        name => FUNCTION_DEFINITIONS[name as keyof typeof FUNCTION_DEFINITIONS]
      );
      
      return NextResponse.json({
        agent_type: agentType,
        system_prompt: prompt,
        functions: agentFunctions,
        business_context: businessContext,
        webhook_url: '/api/retell/webhook',
        functions_url: '/api/retell/functions',
      });
    }
    
    // Return all agent types summary
    return NextResponse.json({
      available_agents: ['receptionist', 'sales', 'customer_service'],
      function_definitions: FUNCTION_DEFINITIONS,
      business_context: businessContext,
    });
    
  } catch (error: any) {
    console.error('[Retell Agents] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
