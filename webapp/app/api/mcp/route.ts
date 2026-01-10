import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// MCP Tool Definitions - These are returned to Retell for the AI to use
const TOOLS = {
  // ===== TENANT/BUSINESS INFO =====
  get_business_info: {
    description: 'Get information about this business including name, greeting, and AI personality',
    parameters: {}
  },
  get_business_hours: {
    description: 'Get business operating hours',
    parameters: {}
  },
  get_services: {
    description: 'Get list of available services and pricing',
    parameters: {
      category: { type: 'string', description: 'Service category filter (optional)' }
    }
  },
  get_location: {
    description: 'Get business location and directions',
    parameters: {}
  },

  // ===== BOOKING TOOLS =====
  check_availability: {
    description: 'Check available time slots for booking appointments',
    parameters: {
      date: { type: 'string', description: 'Date to check (YYYY-MM-DD format)' },
      service_type: { type: 'string', description: 'Type of service requested' }
    }
  },
  create_booking: {
    description: 'Create a new booking/appointment',
    parameters: {
      customer_name: { type: 'string', description: 'Full name of the customer', required: true },
      customer_phone: { type: 'string', description: 'Phone number', required: true },
      customer_email: { type: 'string', description: 'Email address' },
      service_type: { type: 'string', description: 'Type of service requested', required: true },
      preferred_date: { type: 'string', description: 'Preferred date (YYYY-MM-DD)', required: true },
      preferred_time: { type: 'string', description: 'Preferred time (HH:MM)', required: true },
      notes: { type: 'string', description: 'Additional notes from the call' }
    }
  },
  lookup_booking: {
    description: 'Look up an existing booking by phone number or confirmation number',
    parameters: {
      phone: { type: 'string', description: 'Customer phone number' },
      confirmation_number: { type: 'string', description: 'Booking confirmation number' }
    }
  },
  cancel_booking: {
    description: 'Cancel an existing booking',
    parameters: {
      booking_id: { type: 'string', description: 'The booking ID to cancel', required: true },
      reason: { type: 'string', description: 'Reason for cancellation' }
    }
  },
  reschedule_booking: {
    description: 'Reschedule an existing booking to a new date/time',
    parameters: {
      booking_id: { type: 'string', description: 'The booking ID to reschedule', required: true },
      new_date: { type: 'string', description: 'New date (YYYY-MM-DD)', required: true },
      new_time: { type: 'string', description: 'New time (HH:MM)', required: true }
    }
  },

  // ===== LEAD TOOLS =====
  save_lead: {
    description: 'Save a new lead/prospect from the call',
    parameters: {
      name: { type: 'string', description: 'Lead name', required: true },
      phone: { type: 'string', description: 'Phone number', required: true },
      email: { type: 'string', description: 'Email address' },
      interest: { type: 'string', description: 'What they are interested in' },
      source: { type: 'string', description: 'How they heard about us' },
      notes: { type: 'string', description: 'Call notes and conversation summary' },
      follow_up_date: { type: 'string', description: 'When to follow up (YYYY-MM-DD)' }
    }
  },
  lookup_customer: {
    description: 'Look up customer information by phone - checks if returning customer',
    parameters: {
      phone: { type: 'string', description: 'Customer phone number' }
    }
  },

  // ===== CALL CONTROL =====
  transfer_to_human: {
    description: 'Transfer the call to a human representative',
    parameters: {
      reason: { type: 'string', description: 'Reason for transfer' }
    }
  },
  end_call: {
    description: 'End the call politely',
    parameters: {
      summary: { type: 'string', description: 'Brief summary of what was accomplished' }
    }
  }
};

// Look up tenant by phone number (the Twilio number that was called)
async function getTenantByPhone(phoneNumber: string) {
  const { data: tenant } = await supabase
    .from('tenants')
    .select('*')
    .eq('twilio_phone_number', phoneNumber)
    .eq('is_active', true)
    .single();
  
  return tenant;
}

// Get default tenant (GreenLine365)
async function getDefaultTenant() {
  const { data: tenant } = await supabase
    .from('tenants')
    .select('*')
    .eq('business_name', 'GreenLine365')
    .single();
  
  return tenant;
}

// Generate available time slots based on business hours
function generateTimeSlots(date: string, businessHours: any): string[] {
  const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'lowercase' });
  const hours = businessHours?.[dayOfWeek] || '9:00 AM - 5:00 PM';
  
  if (hours.toLowerCase() === 'closed') {
    return [];
  }
  
  const slots = [];
  // Simple slot generation - 9 AM to 5 PM in 30 min increments
  for (let hour = 9; hour < 17; hour++) {
    slots.push(`${hour.toString().padStart(2, '0')}:00`);
    slots.push(`${hour.toString().padStart(2, '0')}:30`);
  }
  
  return slots;
}

// Generate confirmation number
function generateConfirmationNumber(): string {
  return 'GL' + Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Tool execution handlers
async function executeTool(toolName: string, args: Record<string, any>, tenant: any) {
  switch (toolName) {
    // ===== TENANT/BUSINESS INFO HANDLERS =====
    case 'get_business_info': {
      return {
        success: true,
        business_name: tenant?.business_name || 'GreenLine365',
        ai_agent_name: tenant?.ai_agent_name || 'Alex',
        greeting: tenant?.greeting_message || `Hi! Thanks for calling ${tenant?.business_name || 'GreenLine365'}. How can I help you today?`,
        personality: tenant?.ai_personality || 'friendly and professional',
        website: tenant?.website_url,
        message: tenant?.greeting_message || `Hi! Thanks for calling ${tenant?.business_name || 'GreenLine365'}. How can I help you today?`
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
        message: `We're open Monday through Friday from 9 AM to 5 PM, Saturday from 10 AM to 3 PM, and closed on Sundays. Our AI assistant is available 24/7 to help with bookings!`
      };
    }

    case 'get_services': {
      const services = tenant?.services || [
        { name: 'Consultation', duration: '30 min', price: 'Free' },
        { name: 'Strategy Session', duration: '60 min', price: '$99' },
        { name: 'Full Service Package', duration: '2 hours', price: '$299' }
      ];
      
      const serviceList = services.map((s: any) => `${s.name} (${s.duration}, ${s.price})`).join(', ');
      
      return {
        success: true,
        services,
        message: `We offer: ${serviceList}. Which one interests you?`
      };
    }

    case 'get_location': {
      const address = tenant?.address 
        ? `${tenant.address}, ${tenant.city}, ${tenant.state} ${tenant.zip_code}`
        : 'Available virtually - we can meet over video call!';
      
      return {
        success: true,
        address: tenant?.address,
        city: tenant?.city,
        state: tenant?.state,
        zip_code: tenant?.zip_code,
        full_address: address,
        message: tenant?.address 
          ? `We're located at ${address}. Would you like me to text you the directions?`
          : `We're available virtually! We can set up a video call at your convenience.`
      };
    }

    // ===== BOOKING HANDLERS =====
    case 'check_availability': {
      const { date } = args;
      
      // Get existing bookings for the date
      const { data: existingBookings } = await supabase
        .from('bookings')
        .select('preferred_time')
        .eq('preferred_date', date)
        .neq('status', 'cancelled');
      
      const bookedTimes = existingBookings?.map(b => b.preferred_time) || [];
      const allSlots = generateTimeSlots(date, tenant?.business_hours);
      const availableSlots = allSlots.filter(slot => !bookedTimes.includes(slot));
      
      return {
        success: true,
        date,
        available_slots: availableSlots,
        message: availableSlots.length > 0 
          ? `On ${date}, I have these times available: ${availableSlots.slice(0, 5).join(', ')}${availableSlots.length > 5 ? ' and more' : ''}. Which works best for you?`
          : `Sorry, we're fully booked on ${date}. Would you like to check another date?`
      };
    }

    case 'create_booking': {
      const { customer_name, customer_phone, customer_email, service_type, preferred_date, preferred_time, notes } = args;
      const confirmation_number = generateConfirmationNumber();
      
      const { data, error } = await supabase
        .from('bookings')
        .insert({
          customer_name,
          customer_phone,
          customer_email,
          service_type,
          preferred_date,
          preferred_time,
          notes,
          confirmation_number,
          status: 'confirmed',
          source: 'voice_ai',
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) {
        console.error('Booking error:', error);
        return {
          success: false,
          message: `I'm having trouble completing the booking. Let me transfer you to someone who can help.`
        };
      }
      
      return {
        success: true,
        booking_id: data.id,
        confirmation_number,
        message: `Perfect! I've booked your ${service_type} for ${preferred_date} at ${preferred_time}. Your confirmation number is ${confirmation_number}. You'll receive a text confirmation shortly. Is there anything else I can help you with?`
      };
    }

    case 'lookup_booking': {
      const { phone, confirmation_number } = args;
      
      let query = supabase.from('bookings').select('*');
      
      if (confirmation_number) {
        query = query.eq('confirmation_number', confirmation_number);
      } else if (phone) {
        query = query.eq('customer_phone', phone);
      }
      
      const { data } = await query.order('preferred_date', { ascending: false }).limit(5);
      
      if (!data || data.length === 0) {
        return {
          success: false,
          message: "I couldn't find any bookings with that information. Would you like to create a new booking?"
        };
      }
      
      const booking = data[0];
      return {
        success: true,
        booking: {
          id: booking.id,
          confirmation_number: booking.confirmation_number,
          service_type: booking.service_type,
          date: booking.preferred_date,
          time: booking.preferred_time,
          status: booking.status
        },
        message: `I found your booking! You have a ${booking.service_type} scheduled for ${booking.preferred_date} at ${booking.preferred_time}. Confirmation number: ${booking.confirmation_number}. Would you like to make any changes?`
      };
    }

    case 'cancel_booking': {
      const { booking_id, reason } = args;
      
      const { error } = await supabase
        .from('bookings')
        .update({ 
          status: 'cancelled',
          cancellation_reason: reason,
          cancelled_at: new Date().toISOString()
        })
        .eq('id', booking_id);
      
      if (error) {
        return {
          success: false,
          message: "I couldn't cancel that booking. Let me transfer you to someone who can help."
        };
      }
      
      return {
        success: true,
        message: `I've cancelled your booking. Would you like to reschedule for another time?`
      };
    }

    case 'reschedule_booking': {
      const { booking_id, new_date, new_time } = args;
      
      const { error } = await supabase
        .from('bookings')
        .update({ 
          preferred_date: new_date,
          preferred_time: new_time,
          updated_at: new Date().toISOString()
        })
        .eq('id', booking_id);
      
      if (error) {
        return {
          success: false,
          message: "I couldn't reschedule that booking. Let me transfer you to someone who can help."
        };
      }
      
      return {
        success: true,
        message: `Done! I've rescheduled your appointment to ${new_date} at ${new_time}. You'll receive an updated confirmation. Anything else?`
      };
    }

    // ===== LEAD HANDLERS =====
    case 'save_lead': {
      const { name, phone, email, interest, source, notes, follow_up_date } = args;
      
      const { data, error } = await supabase
        .from('leads')
        .insert({
          name,
          phone,
          email,
          interest,
          source: source || 'voice_ai_call',
          notes,
          follow_up_date,
          status: 'new',
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      return {
        success: true,
        lead_id: data?.id,
        message: `Thank you ${name}! I've saved your information. Someone from our team will reach out ${follow_up_date ? `on ${follow_up_date}` : 'within 24 hours'}.`
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
      
      if (!bookings || bookings.length === 0) {
        return {
          success: true,
          is_returning: false,
          message: "Welcome! I don't see any previous visits. Is this your first time with us?"
        };
      }
      
      const customer = bookings[0];
      return {
        success: true,
        is_returning: true,
        customer_name: customer.customer_name,
        total_visits: bookings.length,
        last_visit: customer.preferred_date,
        message: `Welcome back ${customer.customer_name}! Great to hear from you again. You've been with us ${bookings.length} time${bookings.length > 1 ? 's' : ''}. How can I help you today?`
      };
    }

    // ===== CALL CONTROL HANDLERS =====
    case 'transfer_to_human': {
      const { reason } = args;
      const transferNumber = tenant?.transfer_phone_number;
      
      return {
        success: true,
        action: 'transfer',
        transfer_number: transferNumber,
        message: transferNumber 
          ? `Absolutely, let me connect you with ${tenant?.owner_name || 'a team member'} right now.`
          : `I'll have someone call you back within the hour. Is this the best number to reach you?`
      };
    }

    case 'end_call': {
      const { summary } = args;
      
      return {
        success: true,
        action: 'end',
        message: `Thanks for calling ${tenant?.business_name || 'GreenLine365'}! ${summary ? `To recap: ${summary}. ` : ''}Have a great day!`
      };
    }

    default:
      return {
        success: false,
        message: `I'm not sure how to help with that. Would you like to speak with a team member?`
      };
  }
}

// Main MCP endpoint
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Retell sends: tool_name, arguments, and call metadata
    const { tool_name, arguments: toolArgs, call } = body;
    
    // Get tenant based on the phone number that was called
    let tenant = null;
    if (call?.to_number) {
      tenant = await getTenantByPhone(call.to_number);
    }
    
    // Fall back to default tenant
    if (!tenant) {
      tenant = await getDefaultTenant();
    }
    
    if (!tool_name) {
      // Return available tools for MCP discovery
      return NextResponse.json({
        tools: Object.entries(TOOLS).map(([name, config]) => ({
          name,
          description: config.description,
          parameters: config.parameters
        })),
        tenant: tenant ? {
          business_name: tenant.business_name,
          ai_agent_name: tenant.ai_agent_name,
          greeting: tenant.greeting_message
        } : null
      });
    }
    
    // Execute the requested tool with tenant context
    const result = await executeTool(tool_name, toolArgs || {}, tenant);
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('MCP Error:', error);
    return NextResponse.json({
      success: false,
      message: "I'm having a technical issue. Let me transfer you to someone who can help."
    }, { status: 500 });
  }
}

// GET endpoint for MCP server info
export async function GET() {
  const tenant = await getDefaultTenant();
  
  return NextResponse.json({
    name: 'GreenLine365 Multi-Tenant Voice AI',
    version: '2.0.0',
    description: 'Production-ready MCP server for multi-tenant voice AI booking system',
    features: [
      'Multi-tenant support via phone number lookup',
      'Full booking lifecycle (create, lookup, cancel, reschedule)',
      'Lead capture and customer lookup',
      'Human transfer capability',
      'Tenant-specific business info, hours, and services'
    ],
    tools: Object.entries(TOOLS).map(([name, config]) => ({
      name,
      description: config.description,
      parameters: config.parameters
    })),
    default_tenant: tenant?.business_name
  });
}
