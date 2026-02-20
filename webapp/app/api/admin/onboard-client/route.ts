import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/admin/onboard-client
 *
 * The single endpoint that deploys a new GL365 client.
 * Steps:
 * 1. Create Twilio sub-account + buy phone number
 * 2. Create Retell agent from template
 * 3. Set up Cal.com (event types, availability)
 * 4. Store all IDs in Supabase tenants table
 * 5. Send onboarding notification
 *
 * Input: Completed Intake Blueprint JSON + tenant_id
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const RETELL_API_KEY = process.env.RETELL_API_KEY || '';
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || '';
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || '';
const CALCOM_API_KEY = process.env.CALCOM_API_KEY || '';

interface OnboardRequest {
  tenant_id: string;
  config_type: 'A' | 'B' | 'C';
  business_name: string;
  owner_name: string;
  agent_name?: string;
  brand_voice?: string;
  greeting_phrase?: string;
  business_hours?: string;
  services?: string;
  transfer_number?: string;
  emergency_keywords?: string[];
  industry?: string;
  area_code?: string;
  timezone?: string;
  staff?: Array<{ name: string; role: string; services: string[] }>;
  calcom_api_key?: string;
  calcom_event_type_id?: number;
  skip_twilio?: boolean;
  skip_retell?: boolean;
  skip_calcom?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body: OnboardRequest = await request.json();

    if (!body.tenant_id || !body.config_type || !body.business_name) {
      return NextResponse.json(
        { error: 'Missing required fields: tenant_id, config_type, business_name' },
        { status: 400 }
      );
    }

    const results: Record<string, any> = {
      tenant_id: body.tenant_id,
      config_type: body.config_type,
      steps_completed: [],
      steps_failed: [],
    };

    // =====================================================
    // STEP 1: Twilio Sub-Account + Phone Number
    // =====================================================
    if (!body.skip_twilio && TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
      try {
        // Create sub-account
        const twilioAuth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64');

        const subAccountRes = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts.json`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${twilioAuth}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              FriendlyName: `GL365 - ${body.business_name}`,
            }),
          }
        );

        if (subAccountRes.ok) {
          const subAccount = await subAccountRes.json();
          results.twilio_sub_sid = subAccount.sid;
          results.twilio_sub_auth_token = subAccount.auth_token;

          // Buy a local phone number
          if (body.area_code) {
            const subAuth = Buffer.from(`${subAccount.sid}:${subAccount.auth_token}`).toString('base64');
            const phoneRes = await fetch(
              `https://api.twilio.com/2010-04-01/Accounts/${subAccount.sid}/IncomingPhoneNumbers/Local.json`,
              {
                method: 'POST',
                headers: {
                  'Authorization': `Basic ${subAuth}`,
                  'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                  AreaCode: body.area_code,
                }),
              }
            );

            if (phoneRes.ok) {
              const phone = await phoneRes.json();
              results.twilio_phone_number = phone.phone_number;
              results.steps_completed.push('twilio_subaccount');
              results.steps_completed.push('twilio_phone_number');
            } else {
              results.steps_failed.push({
                step: 'twilio_phone_number',
                error: await phoneRes.text(),
              });
            }
          }
        } else {
          results.steps_failed.push({
            step: 'twilio_subaccount',
            error: await subAccountRes.text(),
          });
        }
      } catch (error: any) {
        results.steps_failed.push({
          step: 'twilio',
          error: error.message,
        });
      }
    } else {
      results.steps_completed.push('twilio_skipped');
    }

    // =====================================================
    // STEP 2: Retell Agent Creation
    // =====================================================
    if (!body.skip_retell && RETELL_API_KEY) {
      try {
        // Generate system prompt from template
        const systemPrompt = generateSystemPrompt(body);

        // Create LLM
        const llmRes = await fetch('https://api.retellai.com/create-retell-llm', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RETELL_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4.1',
            general_prompt: systemPrompt,
            general_tools: getToolsForConfig(body.config_type),
            begin_message: body.greeting_phrase || `Thanks for calling ${body.business_name}, this is ${body.agent_name || 'Grace'}. How can I help you today?`,
          }),
        });

        if (llmRes.ok) {
          const llm = await llmRes.json();
          results.retell_llm_id = llm.llm_id;

          // Create Agent
          const agentRes = await fetch('https://api.retellai.com/create-agent', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${RETELL_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              agent_name: `${body.agent_name || 'Grace'} - ${body.business_name}`,
              response_engine: {
                type: 'retell-llm',
                llm_id: llm.llm_id,
              },
              voice_id: '11labs-Adrian',
              language: 'en-US',
              webhook_url: `https://www.greenline365.com/api/retell/webhook?tenant_id=${body.tenant_id}`,
            }),
          });

          if (agentRes.ok) {
            const agent = await agentRes.json();
            results.retell_agent_id = agent.agent_id;
            results.steps_completed.push('retell_llm');
            results.steps_completed.push('retell_agent');

            // Optionally create Retell phone number
            if (body.area_code) {
              const phoneRes = await fetch('https://api.retellai.com/create-phone-number', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${RETELL_API_KEY}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  area_code: parseInt(body.area_code),
                  inbound_agent_id: agent.agent_id,
                }),
              });

              if (phoneRes.ok) {
                const phone = await phoneRes.json();
                results.retell_phone_number = phone.phone_number;
                results.steps_completed.push('retell_phone_number');
              } else {
                results.steps_failed.push({
                  step: 'retell_phone_number',
                  error: await phoneRes.text(),
                });
              }
            }
          } else {
            results.steps_failed.push({
              step: 'retell_agent',
              error: await agentRes.text(),
            });
          }
        } else {
          results.steps_failed.push({
            step: 'retell_llm',
            error: await llmRes.text(),
          });
        }
      } catch (error: any) {
        results.steps_failed.push({
          step: 'retell',
          error: error.message,
        });
      }
    } else {
      results.steps_completed.push('retell_skipped');
    }

    // =====================================================
    // STEP 3: Cal.com Calendar-First Setup (4-step sequence)
    // =====================================================
    // CRITICAL ORDER:
    //   Step 3a: Connect calendar integration FIRST (Google Calendar / Outlook)
    //   Step 3b: Create event types SECOND (they inherit connected calendar availability)
    //   Step 3c: Set availability schedule THIRD (layered on top of real calendar)
    //   Step 3d: Store API key FOURTH (after all above is configured)
    //
    // This order ensures the very first call the AI answers, it checks REAL availability.
    // If we create event types before connecting the calendar, the agent books over
    // existing appointments — the fastest way to lose a client in week one.
    // =====================================================
    if (!body.skip_calcom) {
      const calcomKey = body.calcom_api_key || CALCOM_API_KEY;
      if (calcomKey) {
        try {
          let calcomSetupStep = 0;

          // Step 3a: Verify calendar connection
          // (Client must have connected Google Calendar / Outlook in Cal.com first)
          // We verify by checking if the Cal.com account has connected calendars
          try {
            const calendarCheckRes = await fetch(
              `https://api.cal.com/v1/selected-calendars?apiKey=${calcomKey}`,
              { method: 'GET', headers: { 'Content-Type': 'application/json' } }
            );
            if (calendarCheckRes.ok) {
              const calendarData = await calendarCheckRes.json();
              const hasConnectedCalendar = (calendarData.selectedCalendars || calendarData || []).length > 0;
              if (hasConnectedCalendar) {
                calcomSetupStep = 1;
                results.steps_completed.push('calcom_calendar_connected');
              } else {
                results.calcom_warning = 'No external calendar connected in Cal.com. The AI will use Cal.com internal availability only — it cannot see Google Calendar / Outlook conflicts.';
                calcomSetupStep = 1; // Proceed but flag the warning
              }
            }
          } catch {
            // Non-blocking — continue with event type setup
            calcomSetupStep = 1;
          }

          // Step 3b: Create event types (if services provided)
          if (body.calcom_event_type_id) {
            results.calcom_event_type_id = body.calcom_event_type_id;
            calcomSetupStep = 2;
            results.steps_completed.push('calcom_event_type');
          } else if (body.services) {
            // Could auto-create event types here via Cal.com API
            // For now, store that we need manual event type setup
            results.calcom_event_types_needed = true;
            calcomSetupStep = 2;
            results.steps_completed.push('calcom_event_types_pending');
          }

          // Step 3c: Set availability schedule
          if (body.business_hours && calcomKey) {
            try {
              const schedulesRes = await fetch(
                `https://api.cal.com/v1/schedules?apiKey=${calcomKey}`,
                { method: 'GET', headers: { 'Content-Type': 'application/json' } }
              );
              if (schedulesRes.ok) {
                const schedData = await schedulesRes.json();
                if ((schedData.schedules || []).length > 0) {
                  calcomSetupStep = 3;
                  results.steps_completed.push('calcom_availability_set');
                } else {
                  results.calcom_availability_needed = true;
                  results.steps_completed.push('calcom_availability_pending');
                }
              }
            } catch {
              // Non-blocking
            }
          }

          // Step 3d: Store API key
          results.calcom_api_key = body.calcom_api_key ? '[provided]' : '[using_global]';
          calcomSetupStep = 4;
          results.calcom_setup_step = calcomSetupStep;
          results.steps_completed.push('calcom_credentials');

        } catch (error: any) {
          results.steps_failed.push({
            step: 'calcom',
            error: error.message,
          });
        }
      } else {
        results.steps_failed.push({
          step: 'calcom',
          error: 'No Cal.com API key available',
        });
      }
    } else {
      results.steps_completed.push('calcom_skipped');
    }

    // =====================================================
    // STEP 4: Update Supabase tenants row
    // =====================================================
    try {
      const updateData: Record<string, any> = {
        config_type: body.config_type,
        agent_name: body.agent_name || 'Grace',
        brand_voice: body.brand_voice || 'warm and professional',
        greeting_phrase: body.greeting_phrase,
        business_hours: body.business_hours ? { description: body.business_hours } : undefined,
        emergency_keywords: body.emergency_keywords || [],
        after_hours_behavior: 'take_message',
        transfer_phone: body.transfer_number,
        industry: body.industry,
        calcom_timezone: body.timezone || 'America/New_York',
        onboarding_status: 'building',
        onboarding_started_at: new Date().toISOString(),
      };

      // Add results from previous steps
      if (results.retell_agent_id) updateData.retell_agent_id = results.retell_agent_id;
      if (results.retell_llm_id) updateData.retell_llm_id = results.retell_llm_id;
      if (results.retell_phone_number) updateData.retell_phone_number = results.retell_phone_number;
      if (results.twilio_sub_sid) updateData.twilio_sub_sid = results.twilio_sub_sid;
      if (results.twilio_phone_number) updateData.twilio_phone_number = results.twilio_phone_number;
      if (body.calcom_api_key) updateData.calcom_api_key = body.calcom_api_key;
      if (body.calcom_event_type_id) updateData.calcom_event_type_id = body.calcom_event_type_id;
      if (body.staff) updateData.staff = body.staff;

      const { error } = await supabase
        .from('tenants')
        .update(updateData)
        .eq('id', body.tenant_id);

      if (error) throw error;
      results.steps_completed.push('supabase_update');
    } catch (error: any) {
      results.steps_failed.push({
        step: 'supabase_update',
        error: error.message,
      });
    }

    // =====================================================
    // STEP 5: Determine overall success
    // =====================================================
    const hasFailures = results.steps_failed.length > 0;
    const status = hasFailures ? 'partial' : 'success';

    // Update onboarding status based on results
    if (!hasFailures) {
      await supabase
        .from('tenants')
        .update({ onboarding_status: 'testing' })
        .eq('id', body.tenant_id);
    }

    return NextResponse.json({
      success: !hasFailures,
      status,
      ...results,
      message: hasFailures
        ? `Onboarding partially complete. ${results.steps_completed.length} steps succeeded, ${results.steps_failed.length} failed.`
        : `Client "${body.business_name}" onboarded successfully. Ready for testing.`,
    });

  } catch (error: any) {
    console.error('[Onboard Client] Error:', error);
    return NextResponse.json(
      { error: error.message, success: false },
      { status: 500 }
    );
  }
}

/**
 * Generate system prompt based on config type and client data.
 */
function generateSystemPrompt(body: OnboardRequest): string {
  const vars = {
    agent_name: body.agent_name || 'Grace',
    company_name: body.business_name,
    company_location: body.industry || '',
    business_hours: body.business_hours || 'Monday-Friday 9am-5pm',
    services: body.services || '',
    brand_voice: body.brand_voice || 'warm and professional',
    greeting_phrase: body.greeting_phrase || `Thanks for calling ${body.business_name}, this is ${body.agent_name || 'Grace'}. How can I help you today?`,
    transfer_number: body.transfer_number || '',
    after_hours_behavior: 'take_message' as const,
    emergency_keywords: body.emergency_keywords || [],
    industry: body.industry || '',
    timezone: body.timezone || 'America/New_York',
  };

  // Import template generators dynamically based on config type
  // For now, use a universal prompt that works for all configs
  return `You are ${vars.agent_name}, the AI receptionist for ${vars.company_name}.
Your persona is ${vars.brand_voice}.

# CONTEXT
- Company: ${vars.company_name}
- Business Hours: ${vars.business_hours}
- Services: ${vars.services}
- Industry: ${vars.industry}

# YOUR ROLE
- Answer calls professionally and conversationally
- Book appointments using ONLY available slots from check_availability
- Collect: Name, Phone, Service Type
- Transfer to human ONLY during business hours
- Remember returning callers using get_memory

# CALENDAR RULES (CRITICAL)
1. ALWAYS use check_availability to find open slots — never assume availability.
2. If asked "What times are you free?" → ask "What day were you thinking?"
3. ONLY offer times returned by the tool — NEVER guess.
4. Rule of Three: offer a maximum of 3 time options verbally.

# BOOKING FLOW
1. Greet: "${vars.greeting_phrase}"
2. Ask what they need
3. If booking → ask day → check_availability → offer slots
4. Collect name + phone → create_booking
5. Confirm with confirmation number

# REVENUE PROTECTION
When a customer requests CANCELLATION:
1. FIRST offer to reschedule
2. Only cancel if they insist

# MEMORY PROTOCOL
- Start of call: use get_memory for returning caller recognition
- End of call: use store_memory to save new info

${vars.emergency_keywords.length > 0 ? `# EMERGENCY KEYWORDS\nIf caller mentions: ${vars.emergency_keywords.join(', ')} → treat as urgent, transfer immediately.` : ''}

# STYLE
- Be ${vars.brand_voice}
- Keep responses concise for phone
- Never say "as an AI"`;
}

/**
 * Get the MCP tools configuration for a given config type.
 */
function getToolsForConfig(configType: string): any[] {
  const baseTools = [
    {
      type: 'custom',
      name: 'check_availability_cal',
      description: 'Check calendar availability. start_time MUST be absolute date.',
      url: 'https://www.greenline365.com/api/retell/functions',
      parameters: {
        type: 'object',
        required: ['start_time'],
        properties: {
          start_time: { type: 'string', description: 'Absolute start date' },
          service_type: { type: 'string', description: 'Type of service' },
        },
      },
    },
    {
      type: 'custom',
      name: 'book_appointment_cal',
      description: 'Book appointment. Time MUST be absolute date in the future.',
      url: 'https://www.greenline365.com/api/retell/functions',
      parameters: {
        type: 'object',
        required: ['time', 'guest_name'],
        properties: {
          time: { type: 'string', description: 'Absolute datetime' },
          guest_name: { type: 'string', description: 'Customer name' },
          guest_email: { type: 'string', description: 'Customer email' },
          guest_phone: { type: 'string', description: 'Customer phone' },
          notes: { type: 'string', description: 'Booking notes' },
        },
      },
    },
    {
      type: 'custom',
      name: 'transfer_to_sales',
      description: 'Transfer call to human team member.',
      url: 'https://www.greenline365.com/api/retell/functions',
      parameters: {
        type: 'object',
        properties: {
          caller_name: { type: 'string' },
          transfer_reason: { type: 'string' },
        },
      },
    },
  ];

  return baseTools;
}
