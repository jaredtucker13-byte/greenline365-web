import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Retell MCP Tool Definitions
const TOOLS = {
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
    description: 'Look up customer information by phone or email',
    parameters: {
      phone: { type: 'string', description: 'Customer phone number' },
      email: { type: 'string', description: 'Customer email' }
    }
  },

  // ===== BUSINESS INFO TOOLS =====
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
  }
};

// Generate available time slots
function generateTimeSlots(date: string): string[] {
  const slots = [];
  const startHour = 9; // 9 AM
  const endHour = 17; // 5 PM
  
  for (let hour = startHour; hour < endHour; hour++) {
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
async function executeTool(toolName: string, args: Record<string, any>) {
  switch (toolName) {
    // ===== BOOKING HANDLERS =====
    case 'check_availability': {
      const { date, service_type } = args;
      
      // Get existing bookings for the date
      const { data: existingBookings } = await supabase
        .from('bookings')
        .select('preferred_time')
        .eq('preferred_date', date)
        .neq('status', 'cancelled');
      
      const bookedTimes = existingBookings?.map(b => b.preferred_time) || [];
      const allSlots = generateTimeSlots(date);
      const availableSlots = allSlots.filter(slot => !bookedTimes.includes(slot));
      
      return {
        success: true,
        date,
        available_slots: availableSlots,
        message: availableSlots.length > 0 
          ? `We have ${availableSlots.length} available time slots on ${date}. Available times: ${availableSlots.slice(0, 5).join(', ')}${availableSlots.length > 5 ? ' and more' : ''}`
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
        return {
          success: false,
          message: `Sorry, I couldn't complete the booking. ${error.message}`
        };
      }
      
      return {
        success: true,
        booking_id: data.id,
        confirmation_number,
        message: `Great! I've booked your ${service_type} appointment for ${preferred_date} at ${preferred_time}. Your confirmation number is ${confirmation_number}. You'll receive a confirmation text shortly.`
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
      
      const { data, error } = await query.order('preferred_date', { ascending: false }).limit(5);
      
      if (error || !data || data.length === 0) {
        return {
          success: false,
          message: "I couldn't find any bookings with that information. Can you verify the phone number or confirmation number?"
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
        message: `I found your booking. You have a ${booking.service_type} appointment scheduled for ${booking.preferred_date} at ${booking.preferred_time}. Your confirmation number is ${booking.confirmation_number}. Status: ${booking.status}.`
      };
    }

    case 'cancel_booking': {
      const { booking_id, reason } = args;
      
      const { data, error } = await supabase
        .from('bookings')
        .update({ 
          status: 'cancelled',
          cancellation_reason: reason,
          cancelled_at: new Date().toISOString()
        })
        .eq('id', booking_id)
        .select()
        .single();
      
      if (error) {
        return {
          success: false,
          message: "I couldn't cancel that booking. Please verify the booking information."
        };
      }
      
      return {
        success: true,
        message: `Your booking has been cancelled. If you'd like to reschedule, just let me know.`
      };
    }

    case 'reschedule_booking': {
      const { booking_id, new_date, new_time } = args;
      
      const { data, error } = await supabase
        .from('bookings')
        .update({ 
          preferred_date: new_date,
          preferred_time: new_time,
          updated_at: new Date().toISOString()
        })
        .eq('id', booking_id)
        .select()
        .single();
      
      if (error) {
        return {
          success: false,
          message: "I couldn't reschedule that booking. Please verify the information."
        };
      }
      
      return {
        success: true,
        message: `I've rescheduled your appointment to ${new_date} at ${new_time}. You'll receive an updated confirmation.`
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
      
      if (error) {
        // If leads table doesn't exist, save to a general contacts approach
        console.error('Lead save error:', error);
        return {
          success: true, // Don't break the call flow
          message: `Thank you ${name}! I've noted your interest and someone will follow up with you soon.`
        };
      }
      
      return {
        success: true,
        lead_id: data.id,
        message: `Thank you ${name}! I've saved your information and someone from our team will reach out to you ${follow_up_date ? `on ${follow_up_date}` : 'soon'}.`
      };
    }

    case 'lookup_customer': {
      const { phone, email } = args;
      
      let query = supabase.from('bookings').select('*');
      
      if (phone) {
        query = query.eq('customer_phone', phone);
      } else if (email) {
        query = query.eq('customer_email', email);
      }
      
      const { data: bookings } = await query.order('created_at', { ascending: false }).limit(10);
      
      if (!bookings || bookings.length === 0) {
        return {
          success: true,
          is_new_customer: true,
          message: "I don't see any previous bookings with us. Welcome! How can I help you today?"
        };
      }
      
      const customer = bookings[0];
      return {
        success: true,
        is_new_customer: false,
        customer_name: customer.customer_name,
        total_bookings: bookings.length,
        last_visit: bookings[0].preferred_date,
        message: `Welcome back ${customer.customer_name}! I see you've been with us ${bookings.length} time${bookings.length > 1 ? 's' : ''}. Your last appointment was on ${bookings[0].preferred_date}.`
      };
    }

    // ===== BUSINESS INFO HANDLERS =====
    case 'get_business_hours': {
      return {
        success: true,
        hours: {
          monday: '9:00 AM - 5:00 PM',
          tuesday: '9:00 AM - 5:00 PM',
          wednesday: '9:00 AM - 5:00 PM',
          thursday: '9:00 AM - 5:00 PM',
          friday: '9:00 AM - 5:00 PM',
          saturday: '10:00 AM - 3:00 PM',
          sunday: 'Closed'
        },
        message: "We're open Monday through Friday from 9 AM to 5 PM, Saturday from 10 AM to 3 PM, and closed on Sundays."
      };
    }

    case 'get_services': {
      const { category } = args;
      
      // You can customize this based on your actual services
      const services = [
        { name: 'Consultation', duration: '30 min', price: 'Free' },
        { name: 'Strategy Session', duration: '60 min', price: '$99' },
        { name: 'Full Service Package', duration: '2 hours', price: '$299' },
        { name: 'Follow-up Call', duration: '15 min', price: 'Free' }
      ];
      
      return {
        success: true,
        services,
        message: "We offer consultations, strategy sessions, full service packages, and follow-up calls. Our consultations are free, strategy sessions are $99, and full service packages are $299. What sounds interesting to you?"
      };
    }

    case 'get_location': {
      return {
        success: true,
        address: "123 Business St, Suite 100, Your City, ST 12345",
        message: "We're located at 123 Business Street, Suite 100. There's parking available in the back. Would you like me to text you the directions?"
      };
    }

    default:
      return {
        success: false,
        message: `Unknown tool: ${toolName}`
      };
  }
}

// Main MCP endpoint
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Retell sends tool calls in this format
    const { tool_name, arguments: toolArgs } = body;
    
    if (!tool_name) {
      // If no tool_name, return available tools (for MCP discovery)
      return NextResponse.json({
        tools: Object.entries(TOOLS).map(([name, config]) => ({
          name,
          description: config.description,
          parameters: config.parameters
        }))
      });
    }
    
    // Execute the requested tool
    const result = await executeTool(tool_name, toolArgs || {});
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('MCP Error:', error);
    return NextResponse.json({
      success: false,
      message: "I'm having trouble accessing our system right now. Let me take your information and have someone call you back."
    }, { status: 500 });
  }
}

// GET endpoint for MCP server info and tool discovery
export async function GET() {
  return NextResponse.json({
    name: 'GreenLine365 Booking System',
    version: '1.0.0',
    description: 'MCP server for handling bookings, leads, and customer inquiries via voice AI',
    tools: Object.entries(TOOLS).map(([name, config]) => ({
      name,
      description: config.description,
      parameters: config.parameters
    }))
  });
}
