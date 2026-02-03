import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Cal.com Configuration
const CALCOM_API_KEY = process.env.CALCOM_API_KEY || '';
const CALCOM_EVENT_TYPE_ID = process.env.CALCOM_EVENT_TYPE_ID || '4233765';
const CALCOM_USERNAME = process.env.CALCOM_USERNAME || 'jared-tucker-2gdr7e';
const CALCOM_TIMEZONE = 'America/New_York';

// =====================================================
// MCP TOOL DEFINITIONS
// =====================================================
const TOOLS = {
  // ===== MEMORY TOOLS (Quantum Memory Protocol) =====
  get_memory: {
    description: 'Retrieve customer history and context from the memory vault. MUST be called at the start of every conversation.',
    parameters: {
      customer_phone: { type: 'string', description: 'Customer phone number', required: true }
    }
  },
  store_memory: {
    description: 'Store important details about the customer in the memory vault. Call after learning something new.',
    parameters: {
      customer_phone: { type: 'string', description: 'Customer phone number', required: true },
      customer_name: { type: 'string', description: 'Customer name if provided' },
      customer_email: { type: 'string', description: 'Customer email if provided' },
      memory_type: { type: 'string', description: 'Type: preference, history, context, objection, interest' },
      memory_key: { type: 'string', description: 'What this memory is about', required: true },
      memory_value: { type: 'string', description: 'The actual memory content', required: true }
    }
  },

  // ===== BUSINESS INFO =====
  get_business_info: {
    description: 'Get tenant-specific business context including industry, pain points, and value proposition',
    parameters: {}
  },
  get_business_hours: {
    description: 'Get business operating hours',
    parameters: {}
  },
  get_services: {
    description: 'Get list of available services and pricing',
    parameters: {}
  },

  // ===== BOOKING TOOLS (Cal.com Integration) =====
  check_availability: {
    description: 'Check available time slots for booking on Cal.com calendar. IMPORTANT: Even if the user asks for a relative date such as "next Tuesday", convert it to an absolute date format BEFORE calling this function.',
    parameters: {
      date: { type: 'string', description: 'Date to check in YYYY-MM-DD format (e.g., "2025-01-25"). Must convert relative dates like "next Tuesday" to absolute dates.' }
    }
  },
  check_availability_cal: {
    description: 'Check Cal.com calendar availability. start_time and end_time MUST be full absolute dates. Convert relative dates like "next Tuesday" to "2025 January 28 10:00 AM" format.',
    parameters: {
      start_time: { type: 'string', description: 'Full absolute start date (e.g., "2025 January 28 10:00 AM"). NEVER pass relative dates.', required: true },
      end_time: { type: 'string', description: 'Full absolute end date (e.g., "2025 January 28 6:00 PM")' }
    }
  },
  create_booking: {
    description: 'Create a new booking/appointment on Cal.com. Time MUST be full absolute date in the future. Timezone is hardcoded to America/New_York. Guest email is required.',
    parameters: {
      customer_name: { type: 'string', description: 'Full name of the customer', required: true },
      customer_phone: { type: 'string', description: 'Customer phone number in format: +1XXXXXXXXXX', required: true },
      customer_email: { type: 'string', description: 'Customer email address. Required for Cal.com booking.' },
      service_type: { type: 'string', description: 'Type of service/meeting' },
      preferred_date: { type: 'string', description: 'Date in YYYY-MM-DD format', required: true },
      preferred_time: { type: 'string', description: 'Time in HH:MM format (24hr)', required: true },
      notes: { type: 'string', description: 'Notes about the booking' }
    }
  },
  book_appointment_cal: {
    description: 'Book appointment via Cal.com. Time MUST be full absolute date (e.g., "2025 January 28 2:00 PM"). Timezone is America/New_York. Guest email required - use placeholder if not provided. rescheduleReason should be "first time booking".',
    parameters: {
      time: { type: 'string', description: 'Full absolute datetime in future (e.g., "2025 January 28 2:00 PM"). NEVER use relative dates.', required: true },
      guest_name: { type: 'string', description: 'Full name of guest', required: true },
      guest_email: { type: 'string', description: 'Guest email (use random email if not provided)', required: true },
      guest_phone: { type: 'string', description: 'Guest phone in +1XXXXXXXXXX format' },
      notes: { type: 'string', description: 'One-sentence summary of conversation/reason for booking' },
      timezone: { type: 'string', description: 'Timezone - hardcode to "America/New_York"' },
      rescheduleReason: { type: 'string', description: 'Reason - use "first time booking" for new bookings' }
    }
  },
  lookup_booking: {
    description: 'Look up existing bookings by phone, email, or confirmation number',
    parameters: {
      phone: { type: 'string' },
      email: { type: 'string' },
      confirmation_number: { type: 'string' }
    }
  },
  reschedule_booking: {
    description: 'Reschedule an existing Cal.com booking. Requires booking UID and new absolute datetime.',
    parameters: {
      booking_uid: { type: 'string', description: 'The booking UID to reschedule', required: true },
      new_time: { type: 'string', description: 'New full absolute datetime (e.g., "2025 January 30 3:00 PM")', required: true },
      reason: { type: 'string', description: 'Reason for rescheduling' }
    }
  },
  cancel_booking: {
    description: 'Cancel a Cal.com booking. Requires booking UID.',
    parameters: {
      booking_uid: { type: 'string', description: 'The booking UID to cancel', required: true },
      reason: { type: 'string', description: 'Reason for cancellation' }
    }
  },

  // ===== LEAD TOOLS =====
  save_lead: {
    description: 'Save a new lead/prospect with all captured information',
    parameters: {
      name: { type: 'string', required: true },
      phone: { type: 'string', required: true },
      email: { type: 'string' },
      interest: { type: 'string' },
      notes: { type: 'string' },
      follow_up_date: { type: 'string' }
    }
  },
  lookup_customer: {
    description: 'Check if this is a returning customer',
    parameters: {
      phone: { type: 'string', required: true }
    }
  },

  // ===== SMS TOOLS (Retell Integration) =====
  send_sms: {
    description: 'Send an SMS message to the customer. Use for: 1) Meeting confirmations with details, 2) Value bomb follow-ups with links, 3) Any info that should be in writing.',
    parameters: {
      to: { type: 'string', description: 'Phone number to send SMS to (use customer phone)', required: true },
      message: { type: 'string', description: 'The message content to send', required: true },
      type: { type: 'string', description: 'Type: confirmation, value_bomb, followup, reminder' }
    }
  },
  send_meeting_confirmation: {
    description: 'USE CASE 1: Send meeting confirmation SMS with all details (time, location, zoom link, prep notes). Call this immediately after booking is confirmed.',
    parameters: {
      to: { type: 'string', required: true },
      customer_name: { type: 'string', required: true },
      date: { type: 'string', description: 'Meeting date', required: true },
      time: { type: 'string', description: 'Meeting time', required: true },
      location: { type: 'string', description: 'Physical location or "Virtual"' },
      zoom_link: { type: 'string', description: 'Zoom/meeting link if virtual' },
      prep_notes: { type: 'string', description: 'What to bring or prepare' }
    }
  },
  send_value_bomb: {
    description: 'USE CASE 2: Send a "value bomb" - a helpful resource link based on what the customer is interested in. Send DURING the call to capture attention.',
    parameters: {
      to: { type: 'string', required: true },
      customer_name: { type: 'string', required: true },
      interest: { type: 'string', description: 'What the customer is interested in: buying, rates, services, pricing, demo', required: true },
      custom_message: { type: 'string', description: 'Optional custom message to include' }
    }
  },
  request_contact_info: {
    description: 'USE CASE 3: Perfect Transcription - Instead of asking customer to spell their name/email, send an SMS asking them to text their info back. Say: "I just texted you - please reply with your full name and email."',
    parameters: {
      to: { type: 'string', description: 'Customer phone number', required: true },
      call_id: { type: 'string', description: 'Current call ID for tracking' }
    }
  },

  // ===== PROPERTY-FIRST TOOLS =====
  lookup_property_by_address: {
    description: 'Fuzzy search for a property by address. Use when customer gives their address to find property history even if they are a new caller.',
    parameters: {
      address: { type: 'string', description: 'The address to search for (can be partial)', required: true }
    }
  },
  get_property_assets: {
    description: 'Get all assets (equipment) for a property. Returns equipment type, brand, install date, and confidence score.',
    parameters: {
      property_id: { type: 'string', description: 'The property UUID', required: true }
    }
  },
  verify_asset: {
    description: 'Update asset information after customer confirms details. Updates last_verified timestamp and any corrected metadata.',
    parameters: {
      asset_id: { type: 'string', description: 'The asset UUID', required: true },
      confirmed_correct: { type: 'boolean', description: 'True if customer confirmed asset info is correct' },
      corrections: { type: 'object', description: 'Any corrections: {brand, model, install_date, metadata}' }
    }
  },
  create_property: {
    description: 'Create a new property record for a new address.',
    parameters: {
      address_line1: { type: 'string', required: true },
      city: { type: 'string', required: true },
      state: { type: 'string', required: true },
      zip_code: { type: 'string', required: true },
      gate_code: { type: 'string' },
      property_type: { type: 'string', description: 'residential, commercial, industrial, multi-unit' }
    }
  },
  create_contact: {
    description: 'Create a new contact and optionally link to a property.',
    parameters: {
      first_name: { type: 'string', required: true },
      last_name: { type: 'string' },
      phone: { type: 'string', required: true },
      email: { type: 'string' },
      property_id: { type: 'string', description: 'Property to link this contact to' },
      role: { type: 'string', description: 'owner, tenant, property_manager, emergency_contact' }
    }
  },
  log_interaction: {
    description: 'Log a call or interaction to the property history. Called at end of call.',
    parameters: {
      property_id: { type: 'string' },
      contact_id: { type: 'string' },
      interaction_type: { type: 'string', description: 'call, sms, email, repair, installation, quote' },
      summary: { type: 'string', description: 'Brief summary of the interaction' },
      sentiment: { type: 'string', description: 'positive, neutral, negative' },
      outcome: { type: 'string', description: 'booked, callback, transferred, resolved, escalated' },
      joke_id: { type: 'number', description: 'ID of witty hook used (for non-repetition)' }
    }
  },

  // ===== CALL CONTROL =====
  transfer_to_human: {
    description: 'Transfer the call to a human team member',
    parameters: {
      reason: { type: 'string' }
    }
  },
  transfer_to_sales: {
    description: 'Transfer the call to the sales agent (Aiden)',
    parameters: {
      context: { type: 'string', description: 'Context to pass to Aiden' }
    }
  },
  transfer_to_booking: {
    description: 'Transfer the call to the booking agent (Susan)',
    parameters: {
      context: { type: 'string', description: 'Context to pass to Susan' }
    }
  }
};

// =====================================================
// HELPER FUNCTIONS
// =====================================================

// Cal.com API Helpers
async function getCalcomAvailability(date: string): Promise<string[]> {
  const startTime = `${date}T00:00:00Z`;
  const endTime = `${date}T23:59:59Z`;
  
  const response = await fetch(
    `https://api.cal.com/v1/slots?apiKey=${CALCOM_API_KEY}&eventTypeId=${CALCOM_EVENT_TYPE_ID}&startTime=${startTime}&endTime=${endTime}&timeZone=${CALCOM_TIMEZONE}`,
    { method: 'GET', headers: { 'Content-Type': 'application/json' } }
  );
  
  if (!response.ok) {
    console.error('[Cal.com] Availability error:', await response.text());
    throw new Error('Cal.com availability check failed');
  }
  
  const data = await response.json();
  const slots: string[] = [];
  
  // Parse slots from Cal.com response
  if (data.slots && typeof data.slots === 'object') {
    for (const [dateKey, dateSlots] of Object.entries(data.slots)) {
      if (Array.isArray(dateSlots)) {
        for (const slot of dateSlots) {
          const time = slot.time || slot;
          if (typeof time === 'string') {
            const d = new Date(time);
            slots.push(`${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`);
          }
        }
      }
    }
  }
  
  return slots;
}

async function createCalcomBooking(params: {
  name: string;
  email: string;
  phone?: string;
  startTime: string;
  notes?: string;
  timezone?: string;
}): Promise<{ success: boolean; uid?: string; error?: string }> {
  const { name, email, phone, startTime, notes, timezone } = params;
  
  // Format startTime for Cal.com (ISO 8601)
  const start = new Date(startTime).toISOString();
  
  const bookingData = {
    eventTypeId: parseInt(CALCOM_EVENT_TYPE_ID),
    start,
    responses: {
      name,
      email,
      phone: phone || undefined,
      notes: notes || 'Booked via AI Voice Agent'
    },
    timeZone: timezone || CALCOM_TIMEZONE,
    language: 'en',
    metadata: {
      source: 'voice_ai',
      bookedAt: new Date().toISOString()
    }
  };
  
  const response = await fetch(
    `https://api.cal.com/v1/bookings?apiKey=${CALCOM_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingData)
    }
  );
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Cal.com] Booking error:', errorText);
    return { success: false, error: errorText };
  }
  
  const result = await response.json();
  return { 
    success: true, 
    uid: result.uid || result.id?.toString()
  };
}

async function getCalcomBookings(email: string): Promise<any[]> {
  const response = await fetch(
    `https://api.cal.com/v1/bookings?apiKey=${CALCOM_API_KEY}&attendeeEmail=${encodeURIComponent(email)}`,
    { method: 'GET', headers: { 'Content-Type': 'application/json' } }
  );
  
  if (!response.ok) {
    console.error('[Cal.com] Get bookings error:', await response.text());
    return [];
  }
  
  const data = await response.json();
  return data.bookings || [];
}

async function rescheduleCalcomBooking(uid: string, newTime: string, reason?: string): Promise<{ success: boolean; error?: string }> {
  const response = await fetch(
    `https://api.cal.com/v1/bookings/${uid}?apiKey=${CALCOM_API_KEY}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        start: new Date(newTime).toISOString(),
        rescheduleReason: reason || 'Rescheduled via AI Voice Agent'
      })
    }
  );
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Cal.com] Reschedule error:', errorText);
    return { success: false, error: errorText };
  }
  
  return { success: true };
}

async function cancelCalcomBooking(uid: string, reason?: string): Promise<{ success: boolean; error?: string }> {
  const response = await fetch(
    `https://api.cal.com/v1/bookings/${uid}/cancel?apiKey=${CALCOM_API_KEY}`,
    {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cancellationReason: reason || 'Cancelled via AI Voice Agent'
      })
    }
  );
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Cal.com] Cancel error:', errorText);
    return { success: false, error: errorText };
  }
  
  return { success: true };
}

// Parse absolute date string like "2025 January 28 2:00 PM" to ISO format
function parseAbsoluteDateToISO(dateStr: string): string {
  if (!dateStr) return '';
  
  // If already ISO format, return as-is
  if (dateStr.includes('T') || /^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
    return dateStr;
  }
  
  // Try to parse various formats
  try {
    // Handle "2025 January 28 2:00 PM" format
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
    
    // Handle relative dates by returning today + offset
    const lower = dateStr.toLowerCase();
    const today = new Date();
    
    if (lower === 'today') {
      return today.toISOString().split('T')[0];
    }
    if (lower === 'tomorrow') {
      today.setDate(today.getDate() + 1);
      return today.toISOString().split('T')[0];
    }
    
    // Try parsing with different patterns
    return new Date(dateStr).toISOString();
  } catch {
    return dateStr;
  }
}

// Format date for speech output
function formatDateForSpeech(dateStr: string): string {
  try {
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

// Format time for speech output
function formatTimeForSpeech(timeStr: string): string {
  try {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    
    if (minutes === 0) {
      return `${hour12} ${period}`;
    }
    return `${hour12}:${String(minutes).padStart(2, '0')} ${period}`;
  } catch {
    return timeStr;
  }
}

async function getTenant(phoneNumber?: string) {
  // Try to find tenant by phone number
  if (phoneNumber) {
    const { data } = await supabase
      .from('tenants')
      .select('*, booking_agent:booking_agent_id(*), sales_agent:sales_agent_id(*)')
      .eq('twilio_phone_number', phoneNumber)
      .single();
    if (data) return data;
  }
  
  // Default tenant
  const { data } = await supabase
    .from('tenants')
    .select('*, booking_agent:booking_agent_id(*), sales_agent:sales_agent_id(*)')
    .eq('business_name', 'GreenLine365')
    .single();
  return data;
}

async function getAgent(agentCode: string) {
  const { data } = await supabase
    .from('agents')
    .select('*')
    .eq('agent_code', agentCode)
    .single();
  return data;
}

function generateTimeSlots(date: string): string[] {
  const slots = [];
  for (let hour = 9; hour < 17; hour++) {
    slots.push(`${hour.toString().padStart(2, '0')}:00`);
    slots.push(`${hour.toString().padStart(2, '0')}:30`);
  }
  return slots;
}

function generateConfirmationNumber(): string {
  return 'GL' + Math.random().toString(36).substring(2, 8).toUpperCase();
}

// =====================================================
// TOOL EXECUTION
// =====================================================

async function executeTool(toolName: string, args: Record<string, any>, tenant: any, agentType?: string) {
  switch (toolName) {
    
    // ===== MEMORY TOOLS =====
    case 'get_memory': {
      const { customer_phone } = args;
      
      const { data: memories } = await supabase
        .from('agent_memory')
        .select('*')
        .eq('customer_phone', customer_phone)
        .eq('tenant_id', tenant?.id)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (!memories || memories.length === 0) {
        return {
          success: true,
          is_new_customer: true,
          memories: [],
          message: "No previous interactions found. This is a new customer."
        };
      }
      
      const customerName = memories.find(m => m.customer_name)?.customer_name;
      const customerEmail = memories.find(m => m.customer_email)?.customer_email;
      
      return {
        success: true,
        is_new_customer: false,
        customer_name: customerName,
        customer_email: customerEmail,
        memories: memories.map(m => ({
          type: m.memory_type,
          key: m.memory_key,
          value: m.memory_value,
          date: m.created_at
        })),
        message: customerName 
          ? `Found ${memories.length} memories for ${customerName}. Previous interactions loaded.`
          : `Found ${memories.length} memories for this number.`
      };
    }

    case 'store_memory': {
      const { customer_phone, customer_name, customer_email, memory_type, memory_key, memory_value } = args;
      
      const { error } = await supabase
        .from('agent_memory')
        .insert({
          tenant_id: tenant?.id,
          customer_phone,
          customer_name,
          customer_email,
          memory_type: memory_type || 'context',
          memory_key,
          memory_value,
          source: 'voice_call'
        });
      
      return {
        success: !error,
        message: error 
          ? "Memory storage failed"
          : `Memory stored: ${memory_key}`
      };
    }

    // ===== BUSINESS INFO =====
    case 'get_business_info': {
      return {
        success: true,
        business_name: tenant?.business_name,
        industry: tenant?.industry,
        target_customer: tenant?.target_customer,
        pain_points: tenant?.pain_points,
        value_proposition: tenant?.value_proposition,
        context: tenant?.industry_context,
        booking_agent: tenant?.booking_agent?.agent_name,
        sales_agent: tenant?.sales_agent?.agent_name,
        message: `Business context loaded for ${tenant?.business_name}`
      };
    }

    case 'get_business_hours': {
      const hours = tenant?.business_hours || {
        monday: '9:00 AM - 5:00 PM',
        tuesday: '9:00 AM - 5:00 PM',
        wednesday: '9:00 AM - 5:00 PM',
        thursday: '9:00 AM - 5:00 PM',
        friday: '9:00 AM - 5:00 PM',
        saturday: '10:00 AM - 3:00 PM',
        sunday: 'Closed'
      };
      
      return {
        success: true,
        hours,
        message: "We're open Monday through Friday 9 to 5, Saturday 10 to 3, closed Sundays. But our AI team is here 24/7."
      };
    }

    case 'get_services': {
      const services = tenant?.services || [
        { name: 'Discovery Call', duration: '15 min', price: 'Free' },
        { name: 'Strategy Session', duration: '45 min', price: 'Free' },
        { name: 'Full Demo', duration: '60 min', price: 'Free' }
      ];
      
      return {
        success: true,
        services,
        message: "We offer discovery calls, strategy sessions, and full demos - all free."
      };
    }

    // ===== BOOKING TOOLS (Cal.com Integration) =====
    case 'check_availability':
    case 'check_availability_cal': {
      const { date, start_time, end_time } = args;
      
      // Parse date from various formats
      let checkDate = date;
      if (start_time) {
        checkDate = parseAbsoluteDateToISO(start_time);
      }
      
      if (!checkDate) {
        return {
          success: false,
          message: "What day were you thinking? I can check our availability."
        };
      }
      
      // If Cal.com is configured, use it
      if (CALCOM_API_KEY) {
        try {
          const slots = await getCalcomAvailability(checkDate);
          if (slots.length === 0) {
            return {
              success: true,
              date: checkDate,
              available_slots: [],
              message: `${formatDateForSpeech(checkDate)} is fully booked. Want to try another day?`
            };
          }
          
          // Return only first 3-4 slots (Rule of Three)
          const topSlots = slots.slice(0, 4);
          return {
            success: true,
            date: checkDate,
            available_slots: topSlots,
            message: `On ${formatDateForSpeech(checkDate)}, I have ${topSlots.map(s => formatTimeForSpeech(s)).join(', ')} available. Which time works best for you?`
          };
        } catch (error) {
          console.error('[MCP] Cal.com availability error:', error);
          // Fall back to Supabase
        }
      }
      
      // Fallback: Query existing bookings from Supabase
      const { data: existingBookings } = await supabase
        .from('bookings')
        .select('start_time, preferred_datetime')
        .gte('start_time', `${checkDate}T00:00:00`)
        .lt('start_time', `${checkDate}T23:59:59`)
        .neq('status', 'cancelled');
      
      const bookedTimes = existingBookings?.map(b => {
        const time = b.start_time || b.preferred_datetime;
        if (time) {
          const d = new Date(time);
          return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
        }
        return null;
      }).filter(Boolean) || [];
      
      const allSlots = generateTimeSlots(checkDate);
      const availableSlots = allSlots.filter(slot => !bookedTimes.includes(slot));
      
      return {
        success: true,
        date: checkDate,
        available_slots: availableSlots.slice(0, 4),
        message: availableSlots.length > 0 
          ? `On ${formatDateForSpeech(checkDate)}, I have ${availableSlots.slice(0, 4).map(s => formatTimeForSpeech(s)).join(', ')} available. What works for you?`
          : `${formatDateForSpeech(checkDate)} is fully booked. Want to try another day?`
      };
    }

    case 'create_booking':
    case 'book_appointment_cal': {
      // Handle both formats
      const customer_name = args.customer_name || args.guest_name;
      const customer_phone = args.customer_phone || args.guest_phone || '';
      const customer_email = args.customer_email || args.guest_email || `booking-${Date.now()}@placeholder.com`;
      const service_type = args.service_type || args.notes || 'Consultation';
      
      // Parse time - support both formats
      let bookingDateTime: string;
      if (args.time) {
        // Full absolute date format from Retell: "2025 January 28 2:00 PM"
        bookingDateTime = parseAbsoluteDateToISO(args.time);
      } else if (args.preferred_date && args.preferred_time) {
        bookingDateTime = `${args.preferred_date}T${args.preferred_time}:00`;
      } else {
        return {
          success: false,
          message: "I need to confirm the date and time. What day and time would you like?"
        };
      }
      
      if (!customer_name) {
        return {
          success: false,
          message: "I'll need your name to complete the booking. What name should I put this under?"
        };
      }
      
      // If Cal.com is configured, use it
      if (CALCOM_API_KEY) {
        try {
          const calcomResult = await createCalcomBooking({
            name: customer_name,
            email: customer_email,
            phone: customer_phone,
            startTime: bookingDateTime,
            notes: args.notes || service_type,
            timezone: args.timezone || CALCOM_TIMEZONE
          });
          
          if (calcomResult.success) {
            // Also save to Supabase for our records
            await supabase.from('bookings').insert({
              full_name: customer_name,
              phone: customer_phone,
              email: customer_email,
              notes: args.notes || service_type,
              start_time: bookingDateTime,
              confirmation_number: calcomResult.uid,
              status: 'confirmed',
              source: 'voice_ai_calcom',
              external_calendar_id: calcomResult.uid,
              business_id: tenant?.id
            });
            
            const bookingDate = new Date(bookingDateTime);
            return {
              success: true,
              confirmation_number: calcomResult.uid?.slice(-8).toUpperCase() || generateConfirmationNumber(),
              booking_uid: calcomResult.uid,
              message: `You're all set, ${customer_name}! Your appointment is confirmed for ${formatDateForSpeech(bookingDate.toISOString().split('T')[0])} at ${formatTimeForSpeech(bookingDate.toTimeString().slice(0, 5))}. Your confirmation number is ${calcomResult.uid?.slice(-8).toUpperCase()}. You'll receive a calendar invite at ${customer_email}.`
            };
          } else {
            throw new Error(calcomResult.error || 'Cal.com booking failed');
          }
        } catch (error: any) {
          console.error('[MCP] Cal.com booking error:', error);
          // Fall back to Supabase-only booking
        }
      }
      
      // Fallback: Supabase-only booking
      const confirmation_number = generateConfirmationNumber();
      
      const { data, error } = await supabase
        .from('bookings')
        .insert({
          full_name: customer_name,
          phone: customer_phone || '',
          email: customer_email,
          notes: args.notes || service_type || '',
          start_time: bookingDateTime,
          preferred_datetime: bookingDateTime,
          confirmation_number,
          status: 'confirmed',
          source: 'voice_ai',
          business_id: tenant?.id
        })
        .select()
        .single();
      
      if (error) {
        console.error('[MCP] Booking error:', error);
        return {
          success: false,
          message: "Booking system hiccup. Let me transfer you to get this sorted."
        };
      }
      
      const bookingDate = new Date(bookingDateTime);
      return {
        success: true,
        confirmation_number,
        message: `Done! Your appointment is booked for ${formatDateForSpeech(bookingDate.toISOString().split('T')[0])} at ${formatTimeForSpeech(bookingDate.toTimeString().slice(0, 5))}. Your confirmation number is ${confirmation_number}. You'll get a confirmation shortly.`
      };
    }

    case 'lookup_booking': {
      const { phone, email, confirmation_number } = args;
      
      // Try Cal.com first
      if (CALCOM_API_KEY && email) {
        try {
          const calcomBookings = await getCalcomBookings(email);
          if (calcomBookings.length > 0) {
            const booking = calcomBookings[0];
            return {
              success: true,
              booking,
              booking_uid: booking.uid,
              message: `Found it! Your appointment is ${formatDateForSpeech(booking.startTime.split('T')[0])} at ${formatTimeForSpeech(booking.startTime.split('T')[1].slice(0, 5))}. Confirmation: ${booking.uid?.slice(-8).toUpperCase()}`
            };
          }
        } catch (error) {
          console.error('[MCP] Cal.com lookup error:', error);
        }
      }
      
      // Fallback to Supabase
      let query = supabase.from('bookings').select('*');
      if (confirmation_number) {
        query = query.ilike('confirmation_number', `%${confirmation_number}%`);
      } else if (phone) {
        query = query.eq('phone', phone);
      } else if (email) {
        query = query.eq('email', email);
      }
      
      const { data } = await query.order('start_time', { ascending: false }).limit(5);
      
      if (!data || data.length === 0) {
        return {
          success: false,
          message: "I couldn't find any bookings. Would you like to schedule a new appointment?"
        };
      }
      
      const booking = data[0];
      const bookingTime = booking.start_time || booking.preferred_datetime;
      
      return {
        success: true,
        booking,
        booking_uid: booking.external_calendar_id || booking.id,
        message: `Found it! Your appointment is ${bookingTime ? formatDateForSpeech(new Date(bookingTime).toISOString().split('T')[0]) : 'scheduled'}. Confirmation: ${booking.confirmation_number || booking.id.slice(-8).toUpperCase()}`
      };
    }

    case 'reschedule_booking': {
      const { booking_uid, new_time, reason } = args;
      
      if (!booking_uid) {
        return {
          success: false,
          message: "I need your confirmation number to reschedule. Do you have it handy?"
        };
      }
      
      const newDateTime = parseAbsoluteDateToISO(new_time);
      
      if (CALCOM_API_KEY) {
        try {
          const result = await rescheduleCalcomBooking(booking_uid, newDateTime, reason);
          if (result.success) {
            // Update Supabase record
            await supabase
              .from('bookings')
              .update({ 
                start_time: newDateTime,
                updated_at: new Date().toISOString()
              })
              .eq('external_calendar_id', booking_uid);
            
            const newDate = new Date(newDateTime);
            return {
              success: true,
              message: `Done! I've rescheduled your appointment to ${formatDateForSpeech(newDate.toISOString().split('T')[0])} at ${formatTimeForSpeech(newDate.toTimeString().slice(0, 5))}. You'll receive an updated calendar invite.`
            };
          }
        } catch (error) {
          console.error('[MCP] Cal.com reschedule error:', error);
        }
      }
      
      return {
        success: false,
        message: "I had trouble rescheduling. Let me connect you with our team to sort this out."
      };
    }

    case 'cancel_booking': {
      const { booking_uid, reason } = args;
      
      if (!booking_uid) {
        return {
          success: false,
          message: "I need your confirmation number to cancel. Do you have it?"
        };
      }
      
      if (CALCOM_API_KEY) {
        try {
          const result = await cancelCalcomBooking(booking_uid, reason);
          if (result.success) {
            // Update Supabase record
            await supabase
              .from('bookings')
              .update({ 
                status: 'cancelled',
                cancellation_reason: reason,
                cancelled_at: new Date().toISOString()
              })
              .eq('external_calendar_id', booking_uid);
            
            return {
              success: true,
              message: "Your appointment has been cancelled. We're sorry to see you go! Would you like to schedule a different time in the future?"
            };
          }
        } catch (error) {
          console.error('[MCP] Cal.com cancel error:', error);
        }
      }
      
      // Fallback: Update Supabase only
      const { error } = await supabase
        .from('bookings')
        .update({
          status: 'cancelled',
          cancellation_reason: reason || 'Customer requested',
          cancelled_at: new Date().toISOString()
        })
        .or(`confirmation_number.ilike.%${booking_uid}%,id.ilike.%${booking_uid}%`);
      
      if (error) {
        return {
          success: false,
          message: "I had trouble cancelling. Let me connect you with our team."
        };
      }
      
      return {
        success: true,
        message: "Your appointment has been cancelled. Would you like to book a different time?"
      };
    }

    // ===== SMS TOOLS =====
    case 'send_sms': {
      const { to, message, type } = args;
      
      if (!to || !message) {
        return {
          success: false,
          message: "I need a phone number and message to send the text."
        };
      }
      
      try {
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL || 'http://localhost:3000';
        const response = await fetch(`${baseUrl}/api/twilio/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to, message, type: type || 'general' })
        });
        
        const result = await response.json();
        
        if (result.success) {
          return {
            success: true,
            message: "I just sent you a text message."
          };
        } else {
          console.error('[MCP] SMS send error:', result.error);
          return {
            success: false,
            message: "I had trouble sending the text. No worries, I can tell you the details over the phone."
          };
        }
      } catch (error) {
        console.error('[MCP] SMS send error:', error);
        return {
          success: false,
          message: "Couldn't send the text right now, but let me give you the info verbally."
        };
      }
    }

    case 'send_meeting_confirmation': {
      const { to, customer_name, date, time, location, zoom_link, prep_notes } = args;
      
      // Build confirmation message
      let message = `Hi ${customer_name}! Your appointment is confirmed for ${date} at ${time}.`;
      
      if (location && location !== 'Virtual') {
        message += `\n\nLocation: ${location}`;
      }
      
      if (zoom_link) {
        message += `\n\nMeeting Link: ${zoom_link}`;
      }
      
      if (prep_notes) {
        message += `\n\nPlease have ready: ${prep_notes}`;
      }
      
      message += '\n\nReply YES to confirm or call us to reschedule.';
      
      try {
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL || 'http://localhost:3000';
        const response = await fetch(`${baseUrl}/api/twilio/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to, message, type: 'confirmation' })
        });
        
        const result = await response.json();
        
        return {
          success: result.success,
          message: result.success 
            ? "I just sent you a confirmation text with all the details."
            : "I couldn't send the text, but your appointment is confirmed!"
        };
      } catch (error) {
        console.error('[MCP] Meeting confirmation SMS error:', error);
        return {
          success: false,
          message: "Your appointment is confirmed! I'll make sure you get the details."
        };
      }
    }

    case 'send_value_bomb': {
      const { to, customer_name, interest, custom_message } = args;
      
      // Build value bomb based on interest
      const valueLinks: Record<string, { title: string; url: string }> = {
        buying: { title: 'Homebuyer\'s Guide', url: 'https://greenline365.com/guides/buying' },
        rates: { title: 'Current Rate Guide', url: 'https://greenline365.com/rates' },
        services: { title: 'Our Services', url: 'https://greenline365.com/services' },
        pricing: { title: 'Pricing Calculator', url: 'https://greenline365.com/pricing' },
        demo: { title: 'Demo Overview', url: 'https://greenline365.com/demo' },
        maintenance: { title: 'Maintenance Tips', url: 'https://greenline365.com/tips' },
        emergency: { title: 'Emergency Services', url: 'https://greenline365.com/emergency' }
      };
      
      const resource = valueLinks[interest?.toLowerCase()] || valueLinks.services;
      
      let message = `Hi ${customer_name}! Here's that ${resource.title} I mentioned: ${resource.url}`;
      
      if (custom_message) {
        message += `\n\n${custom_message}`;
      }
      
      message += '\n\n- The GreenLine365 Team';
      
      try {
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL || 'http://localhost:3000';
        const response = await fetch(`${baseUrl}/api/twilio/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to, message, type: 'value_bomb' })
        });
        
        const result = await response.json();
        
        return {
          success: result.success,
          message: result.success 
            ? "I just sent you a link to check out!"
            : "I couldn't send the text, but you can find that info on our website."
        };
      } catch (error) {
        console.error('[MCP] Value bomb SMS error:', error);
        return {
          success: false,
          message: "Check out our website for that information - greenline365.com"
        };
      }
    }

    case 'request_contact_info': {
      const { to, call_id } = args;
      
      const message = `Hi! Just texted you from our call. To make sure I get your info exactly right, please reply with:\n\nFull Name:\nEmail:\n\nThanks!`;
      
      try {
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL || 'http://localhost:3000';
        const response = await fetch(`${baseUrl}/api/twilio/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            to, 
            message, 
            type: 'data_capture',
            metadata: { call_id, awaiting_reply: true }
          })
        });
        
        const result = await response.json();
        
        return {
          success: result.success,
          message: result.success 
            ? "I just sent you a text. Go ahead and reply with your full name and email, and I'll have it exactly right in our system."
            : "Let me get your info verbally instead."
        };
      } catch (error) {
        console.error('[MCP] Request contact info SMS error:', error);
        return {
          success: false,
          message: "Let me get your info verbally instead."
        };
      }
    }

    // ===== LEAD TOOLS =====
    case 'save_lead': {
      const { name, phone, email, interest, notes, follow_up_date } = args;
      
      await supabase.from('leads').insert({
        name,
        phone,
        email,
        interest,
        notes,
        follow_up_date,
        source: 'voice_ai_call',
        status: 'new'
      });
      
      // Also store in memory
      await supabase.from('agent_memory').insert({
        tenant_id: tenant?.id,
        customer_phone: phone,
        customer_name: name,
        customer_email: email,
        memory_type: 'interest',
        memory_key: 'lead_captured',
        memory_value: interest || notes || 'Lead captured via voice call',
        source: 'voice_call'
      });
      
      return {
        success: true,
        message: `Got it, ${name}. Someone will reach out ${follow_up_date ? `on ${follow_up_date}` : 'within 24 hours'}.`
      };
    }

    case 'lookup_customer': {
      const { phone } = args;
      
      const { data: bookings } = await supabase
        .from('bookings')
        .select('*')
        .eq('customer_phone', phone)
        .order('created_at', { ascending: false })
        .limit(10);
      
      const { data: memories } = await supabase
        .from('agent_memory')
        .select('*')
        .eq('customer_phone', phone)
        .limit(10);
      
      if ((!bookings || bookings.length === 0) && (!memories || memories.length === 0)) {
        return {
          success: true,
          is_returning: false,
          message: "Welcome! First time connecting with us?"
        };
      }
      
      const customerName = bookings?.[0]?.customer_name || memories?.find(m => m.customer_name)?.customer_name;
      
      return {
        success: true,
        is_returning: true,
        customer_name: customerName,
        total_bookings: bookings?.length || 0,
        message: customerName 
          ? `Hey ${customerName}! Good to hear from you again.`
          : `Welcome back! I see we've talked before.`
      };
    }

    // ===== PROPERTY-FIRST TOOLS =====
    case 'lookup_property_by_address': {
      const { address } = args;
      
      if (!address) {
        return {
          success: false,
          message: "What's the address for the property?"
        };
      }
      
      // Use pg_trgm fuzzy search
      const { data: properties, error } = await supabase
        .rpc('search_properties_fuzzy', {
          p_tenant_id: tenant?.id,
          p_search_text: address,
          p_limit: 5
        });
      
      if (error) {
        // Fallback to ILIKE if RPC not available
        const { data: fallbackProperties } = await supabase
          .from('properties')
          .select('*, assets(*)')
          .eq('tenant_id', tenant?.id)
          .or(`full_address.ilike.%${address}%,address_line1.ilike.%${address}%`)
          .limit(5);
        
        if (fallbackProperties && fallbackProperties.length > 0) {
          const prop = fallbackProperties[0];
          const primaryAsset = prop.assets?.[0];
          return {
            success: true,
            found: true,
            property_id: prop.id,
            property_address: prop.full_address,
            gate_code: prop.gate_code,
            primary_asset: primaryAsset ? {
              type: primaryAsset.asset_type,
              brand: primaryAsset.brand,
              install_year: primaryAsset.install_date ? new Date(primaryAsset.install_date).getFullYear() : null
            } : null,
            message: primaryAsset 
              ? `I found ${prop.full_address}! I see we've serviced the ${primaryAsset.asset_type} there${primaryAsset.brand ? ` - a ${primaryAsset.brand}` : ''}.`
              : `I found ${prop.full_address}! Let me pull up the service history.`
          };
        }
        
        return {
          success: true,
          found: false,
          message: "I don't have that address in our system yet. Let me get it set up for you."
        };
      }
      
      if (properties && properties.length > 0) {
        const topMatch = properties[0];
        
        // Get assets for this property
        const { data: assets } = await supabase
          .from('assets')
          .select('*')
          .eq('property_id', topMatch.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false });
        
        const primaryAsset = assets?.[0];
        
        // Check if there are multiple similar matches
        if (properties.length > 1 && properties[1].similarity_score > 0.3) {
          return {
            success: true,
            found: true,
            multiple_matches: true,
            matches: properties.slice(0, 3).map((p: any) => ({
              property_id: p.id,
              address: p.full_address,
              similarity: p.similarity_score
            })),
            message: `I found a few addresses that match. Is it ${topMatch.full_address}, or a different one?`
          };
        }
        
        return {
          success: true,
          found: true,
          property_id: topMatch.id,
          property_address: topMatch.full_address,
          primary_asset: primaryAsset ? {
            id: primaryAsset.id,
            type: primaryAsset.asset_type,
            brand: primaryAsset.brand,
            install_year: primaryAsset.install_date ? new Date(primaryAsset.install_date).getFullYear() : null,
            confidence_score: primaryAsset.confidence_score
          } : null,
          asset_count: assets?.length || 0,
          message: primaryAsset 
            ? `Found it! ${topMatch.full_address}. I see we have a ${primaryAsset.brand || ''} ${primaryAsset.asset_type} on file from ${primaryAsset.install_date ? new Date(primaryAsset.install_date).getFullYear() : 'a while back'}.`
            : `Found ${topMatch.full_address}! Let me see what equipment we have on record.`
        };
      }
      
      return {
        success: true,
        found: false,
        message: "I don't have that address in our system yet. No worries—I can get you set up as a new property!"
      };
    }

    case 'get_property_assets': {
      const { property_id } = args;
      
      if (!property_id) {
        return {
          success: false,
          message: "I need the property ID to look up the equipment."
        };
      }
      
      const { data: assets } = await supabase
        .from('assets')
        .select('*')
        .eq('property_id', property_id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      
      if (!assets || assets.length === 0) {
        return {
          success: true,
          assets: [],
          message: "I don't have any equipment on file for this property yet."
        };
      }
      
      const assetSummaries = assets.map(a => ({
        id: a.id,
        type: a.asset_type,
        brand: a.brand,
        model: a.model_number,
        install_date: a.install_date,
        install_year: a.install_date ? new Date(a.install_date).getFullYear() : null,
        confidence_score: a.confidence_score,
        last_service: a.last_service_date,
        metadata: a.metadata
      }));
      
      const primary = assetSummaries[0];
      
      return {
        success: true,
        assets: assetSummaries,
        primary_asset: primary,
        message: assets.length === 1
          ? `I have a ${primary.brand || ''} ${primary.type} on file${primary.install_year ? ` from ${primary.install_year}` : ''}.`
          : `I have ${assets.length} pieces of equipment on file. The main one is a ${primary.brand || ''} ${primary.type}${primary.install_year ? ` from ${primary.install_year}` : ''}.`
      };
    }

    case 'verify_asset': {
      const { asset_id, confirmed_correct, corrections } = args;
      
      if (!asset_id) {
        return {
          success: false,
          message: "I need the asset ID to update the records."
        };
      }
      
      const updateData: any = {
        last_verified: new Date().toISOString(),
        confidence_score: 100  // Reset to 100 after verification
      };
      
      if (corrections) {
        if (corrections.brand) updateData.brand = corrections.brand;
        if (corrections.model) updateData.model_number = corrections.model;
        if (corrections.install_date) updateData.install_date = corrections.install_date;
        if (corrections.metadata) {
          // Merge metadata
          const { data: existing } = await supabase
            .from('assets')
            .select('metadata')
            .eq('id', asset_id)
            .single();
          updateData.metadata = { ...(existing?.metadata || {}), ...corrections.metadata };
        }
      }
      
      const { error } = await supabase
        .from('assets')
        .update(updateData)
        .eq('id', asset_id);
      
      if (error) {
        console.error('[MCP] Asset verification error:', error);
        return {
          success: false,
          message: "I had trouble updating the records. No worries, the tech will confirm on-site."
        };
      }
      
      return {
        success: true,
        message: confirmed_correct 
          ? "Perfect, I've confirmed those details are current in our system."
          : "Got it! I've updated our records with the correct information."
      };
    }

    case 'create_property': {
      const { address_line1, city, state, zip_code, gate_code, property_type } = args;
      
      const { data: property, error } = await supabase
        .from('properties')
        .insert({
          tenant_id: tenant?.id,
          address_line1,
          city,
          state,
          zip_code,
          gate_code,
          property_type: property_type || 'residential',
          first_service_date: new Date().toISOString().split('T')[0]
        })
        .select()
        .single();
      
      if (error) {
        console.error('[MCP] Create property error:', error);
        return {
          success: false,
          message: "I had trouble saving the address. Let me get a human to help with that."
        };
      }
      
      return {
        success: true,
        property_id: property.id,
        property_address: property.full_address,
        message: `Great! I've added ${address_line1}, ${city} to our system.`
      };
    }

    case 'create_contact': {
      const { first_name, last_name, phone, email, property_id, role } = args;
      
      // Normalize phone
      const normalizedPhone = phone.replace(/[^0-9]/g, '');
      
      const { data: contact, error } = await supabase
        .from('contacts')
        .insert({
          tenant_id: tenant?.id,
          first_name,
          last_name,
          phone,
          email,
          property_id,
          role: role || 'owner',
          first_contact_date: new Date().toISOString().split('T')[0],
          relationship_score: 50  // Start as "regular"
        })
        .select()
        .single();
      
      if (error) {
        console.error('[MCP] Create contact error:', error);
        return {
          success: false,
          message: "I had trouble saving your info. No worries, we can get that sorted."
        };
      }
      
      return {
        success: true,
        contact_id: contact.id,
        message: `Perfect, ${first_name}! I've got you in our system now.`
      };
    }

    case 'log_interaction': {
      const { property_id, contact_id, interaction_type, summary, sentiment, outcome, joke_id } = args;
      
      const { error } = await supabase
        .from('interactions')
        .insert({
          tenant_id: tenant?.id,
          property_id,
          contact_id,
          interaction_type: interaction_type || 'call',
          summary,
          sentiment,
          outcome,
          joke_id,
          call_direction: 'inbound',
          agent_type: agentType
        });
      
      if (error) {
        console.error('[MCP] Log interaction error:', error);
      }
      
      // Update contact relationship score if sentiment was positive
      if (contact_id && sentiment === 'positive') {
        await supabase.rpc('calculate_relationship_score', { p_contact_id: contact_id });
      }
      
      return {
        success: true,
        message: "Interaction logged."
      };
    }

    // ===== CALL CONTROL =====
    case 'transfer_to_human': {
      return {
        success: true,
        action: 'transfer',
        transfer_number: tenant?.transfer_phone_number,
        message: `Absolutely. Let me get ${tenant?.owner_name || 'someone'} on the line for you.`
      };
    }

    case 'transfer_to_sales': {
      const salesAgent = tenant?.sales_agent;
      return {
        success: true,
        action: 'transfer_to_agent',
        agent: salesAgent?.agent_name || 'Aiden',
        agent_id: salesAgent?.retell_agent_id,
        context: args.context,
        message: `Let me connect you with ${salesAgent?.agent_name || 'Aiden'}, our specialist. One moment.`
      };
    }

    case 'transfer_to_booking': {
      const bookingAgent = tenant?.booking_agent;
      return {
        success: true,
        action: 'transfer_to_agent',
        agent: bookingAgent?.agent_name || 'Susan',
        agent_id: bookingAgent?.retell_agent_id,
        context: args.context,
        message: `I'll transfer you to ${bookingAgent?.agent_name || 'Susan'} to get you booked. One sec.`
      };
    }

    default:
      return {
        success: false,
        message: "I'm not sure how to help with that. Want me to connect you with someone?"
      };
  }
}

// =====================================================
// API ENDPOINTS
// =====================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Support both Retell format and our format
    // Retell sends: { name: "...", args: {...}, call: {...} }
    // Our format: { tool_name: "...", arguments: {...}, call: {...} }
    const tool_name = body.tool_name || body.name;
    const toolArgs = body.arguments || body.args || {};
    const call = body.call || {};
    
    console.log(`[MCP] Function: ${tool_name}`, JSON.stringify(toolArgs));
    
    // Get tenant context
    const tenant = await getTenant(call?.to_number);
    
    // Determine which agent is speaking (for context)
    const agentType = call?.agent_id?.includes('sales') ? 'sales' : 'booking';
    
    if (!tool_name) {
      // Return tool definitions
      return NextResponse.json({
        tools: Object.entries(TOOLS).map(([name, config]) => ({
          name,
          description: config.description,
          parameters: config.parameters
        })),
        tenant: {
          business_name: tenant?.business_name,
          booking_agent: tenant?.booking_agent?.agent_name,
          sales_agent: tenant?.sales_agent?.agent_name
        }
      });
    }
    
    const result = await executeTool(tool_name, toolArgs || {}, tenant, agentType);
    
    // Retell expects { result: "string" } format
    // Convert our response to string if needed
    if (typeof result === 'object' && result.message) {
      return NextResponse.json({ 
        result: result.message,
        ...result  // Include additional data for our own use
      });
    }
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('MCP Error:', error);
    return NextResponse.json({
      success: false,
      message: "Technical issue. Let me transfer you to get this sorted."
    }, { status: 500 });
  }
}

export async function GET() {
  const tenant = await getTenant();
  const { data: agents } = await supabase.from('agents').select('agent_name, agent_role, agent_code');
  
  return NextResponse.json({
    name: 'GreenLine365 Multi-Agent Voice AI',
    version: '3.0.0',
    description: 'Production-ready MCP with Quantum Memory Protocol and multi-agent support',
    agents: agents || [],
    default_tenant: tenant?.business_name,
    tools: Object.keys(TOOLS),
    features: [
      'Quantum Memory Protocol (get_memory/store_memory)',
      'Multi-agent routing (Susan/Aiden)',
      'NEPQ-trained sales agent',
      'Multi-tenant white-label support',
      'Full booking lifecycle',
      'Lead capture with memory persistence'
    ]
  });
}
