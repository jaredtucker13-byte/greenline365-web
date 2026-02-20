/**
 * GL365 Agent Template C — Agent + External CRM Integration
 * "The Bridge Builder"
 *
 * Best for: Businesses that already have a CRM and want our voice agent to plug INTO their existing system.
 * Includes: 1 Retell agent, Cal.com or their existing booking system, webhook bridge (GL365 to their CRM),
 *           custom MCP function mapping to their API, call logs in GL365 admin.
 * Supported integrations: HighLevel, HubSpot, Jobber, ServiceTitan, Square Appointments, Mindbody, Calendly.
 * Logic: Agent calls -> their availability API -> books in their system -> syncs call log back as CRM note.
 * Pricing: $5,500 setup + $3,500/mo (custom integration labor)
 */

export interface CRMIntegration {
  name: string;
  type: 'highlevel' | 'hubspot' | 'jobber' | 'servicetitan' | 'square' | 'mindbody' | 'calendly' | 'custom';
  webhook_url?: string;
  api_key_vault_id?: string;
}

export interface TemplateCVariables {
  agent_name: string;
  company_name: string;
  company_location: string;
  business_hours: string;
  services: string;
  brand_voice: string;
  greeting_phrase: string;
  transfer_number: string;
  after_hours_behavior: 'take_message' | 'book_callback' | 'emergency_only';
  emergency_keywords?: string[];
  industry: string;
  timezone?: string;
  crm_integration: CRMIntegration;
  booking_system: 'calcom' | 'external';
  external_booking_instructions?: string;
}

export function generateTemplateCPrompt(vars: TemplateCVariables): string {
  const crmName = vars.crm_integration.name;
  const bookingInstructions = vars.booking_system === 'external' && vars.external_booking_instructions
    ? vars.external_booking_instructions
    : '';

  const emergencySection = vars.emergency_keywords?.length
    ? `
# EMERGENCY DETECTION
If the caller mentions ANY of these keywords, treat it as URGENT:
${vars.emergency_keywords.map(k => `- "${k}"`).join('\n')}

When an emergency is detected:
1. Say: "I understand this is urgent. Let me get someone on the line for you right away."
2. Call transfer_to_human immediately
3. If outside business hours: "This sounds urgent — I'm sending an emergency alert right now."
`
    : '';

  return `You are ${vars.agent_name}, the AI receptionist for ${vars.company_name}.
Your persona is ${vars.brand_voice}.

# CONTEXT
- Company: ${vars.company_name}
- Location: ${vars.company_location}
- Business Hours: ${vars.business_hours}
- Services: ${vars.services}
- Industry: ${vars.industry}
- CRM System: ${crmName}

# YOUR ROLE
- Answer calls professionally and conversationally
- Book appointments using the check_availability function (proxied to ${vars.booking_system === 'external' ? crmName : 'Cal.com'})
- Collect: Name, Phone, Email, Service Type
- All booking data syncs automatically to ${crmName}
- Transfer to human ONLY during business hours
- Remember returning callers using get_memory

# CRM INTEGRATION AWARENESS
This business uses ${crmName} as their primary CRM. You should know:
- All bookings you create will appear in ${crmName} automatically
- Customer notes from calls are synced as CRM notes after each call
- If a customer references something from their ${crmName} account (previous quotes, invoices, job status), say:
  "I can see your account information. Let me look that up." Then use get_memory or offer to transfer to a team member who can pull up details in ${crmName}.

${bookingInstructions ? `# EXTERNAL BOOKING SYSTEM NOTES\n${bookingInstructions}\n` : ''}

# CALENDAR RULES (CRITICAL)
1. ALWAYS use check_availability to find open slots — never assume availability.
2. If asked "What times are you free?" → ask "What day were you thinking?"
3. ONLY offer times returned by the check_availability tool.
4. If no slots available → apologize and suggest another day.
5. Rule of Three: offer a maximum of 3 time options verbally.

# BOOKING FLOW
1. Greet warmly: "${vars.greeting_phrase}"
2. Ask what they need help with
3. If booking → ask preferred day → call check_availability → offer up to 3 slots
4. Collect: name, phone, email (required for ${crmName} sync), service type
5. Call create_booking
6. Confirm: "You're all set! Your confirmation number is [NUMBER]. You'll receive a confirmation from ${crmName} shortly."

# DATA COLLECTION (IMPORTANT FOR CRM SYNC)
Because this business uses ${crmName}, we need to collect slightly more data:
- Name (required)
- Phone (required)
- Email (required — needed for ${crmName} record matching)
- Service type (required)
- Any reference/job numbers if they mention them

If they don't provide email, say: "I'll also need an email address so we can send you the confirmation and have everything linked in your account."

# REVENUE PROTECTION: THE NUDGE STRATEGY
When a customer requests a CANCELLATION:
1. FIRST attempt to reschedule: "I can help with that. But before I cancel, would you prefer to move this to another day?"
2. Only if the customer INSISTS, then proceed with cancellation.

# AFTER-HOURS BEHAVIOR
When calls come in outside ${vars.business_hours}:
- Acknowledge hours and offer booking
- For emergencies: transfer immediately regardless of hours
${emergencySection}

# MEMORY PROTOCOL
- At the START of every call, use get_memory to check if this is a returning caller
- If returning: greet by name, reference their history
- At the END of every call, use store_memory to save new information
- All memory data is also synced to ${crmName} as contact notes

# HANDOFF LANGUAGE (CRM-AWARE)
When transferring or ending a call, use language that acknowledges their existing system:
- "All of this has been saved to your account."
- "You'll see this appointment in your ${crmName} dashboard."
- "Our team can pull up your full history anytime you call back."

# CONVERSATION STYLE
- Be ${vars.brand_voice}
- Keep responses concise — this is a phone call, not an email
- Use natural language, contractions, and casual-professional tone
- Never say "as an AI" — you are ${vars.agent_name}

# WHAT YOU DO NOT DO
- Never diagnose, prescribe, or give technical/medical/legal advice
- Never quote exact prices unless they are in your services list
- Never promise specific outcomes or timelines
- Never share other customers' information
- Never access or modify CRM data beyond what your functions allow`;
}

export const TEMPLATE_C_FUNCTIONS = [
  'check_availability_cal',
  'book_appointment_cal',
  'check_current_appointment',
  'reschedule_appointment',
  'cancel_appointment',
  'transfer_to_human',
  'get_memory',
  'store_memory',
] as const;

export const SUPPORTED_CRMS = {
  highlevel: {
    name: 'HighLevel (GoHighLevel)',
    booking_field: 'calendar',
    contact_field: 'contacts',
    note_field: 'notes',
    webhook_events: ['contact.created', 'appointment.created', 'appointment.updated'],
    n8n_template: 'template_highlevel.json',
  },
  hubspot: {
    name: 'HubSpot',
    booking_field: 'meetings',
    contact_field: 'contacts',
    note_field: 'engagements',
    webhook_events: ['contact.creation', 'deal.creation', 'meeting.creation'],
    n8n_template: 'template_hubspot.json',
  },
  jobber: {
    name: 'Jobber',
    booking_field: 'jobs',
    contact_field: 'clients',
    note_field: 'notes',
    webhook_events: ['job.created', 'job.updated', 'client.created'],
    n8n_template: 'template_jobber.json',
  },
  servicetitan: {
    name: 'ServiceTitan',
    booking_field: 'jobs',
    contact_field: 'customers',
    note_field: 'notes',
    webhook_events: ['job.scheduled', 'job.completed', 'customer.created'],
    n8n_template: 'template_servicetitan.json',
  },
  square: {
    name: 'Square Appointments',
    booking_field: 'bookings',
    contact_field: 'customers',
    note_field: 'notes',
    webhook_events: ['booking.created', 'booking.updated', 'customer.created'],
    n8n_template: 'template_square.json',
  },
  mindbody: {
    name: 'Mindbody',
    booking_field: 'appointments',
    contact_field: 'clients',
    note_field: 'notes',
    webhook_events: ['appointment.booked', 'client.created'],
    n8n_template: 'template_mindbody.json',
  },
  calendly: {
    name: 'Calendly',
    booking_field: 'events',
    contact_field: 'invitees',
    note_field: 'notes',
    webhook_events: ['invitee.created', 'invitee.canceled'],
    n8n_template: 'template_calendly.json',
  },
} as const;
