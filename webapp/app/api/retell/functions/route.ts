import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Retell from 'retell-sdk';

/**
 * Retell AI Custom Functions Handler
 * 
 * Handles function calls from Retell agents:
 * - check_availability_cal
 * - book_appointment_cal
 * - reschedule_appointment
 * - cancel_appointment
 * - check_current_appointment
 * - transfer_to_sales
 * - get_weather_context
 * 
 * POST /api/retell/functions
 */

const RETELL_API_KEY = process.env.RETELL_API_KEY || '';
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY || '';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const signature = request.headers.get('x-retell-signature') || '';
    
    // Verify webhook signature (skip if no API key configured)
    if (RETELL_API_KEY && signature) {
      const bodyString = JSON.stringify(body);
      const isValid = Retell.verify(bodyString, RETELL_API_KEY, signature);
      
      if (!isValid) {
        console.error('[Retell Functions] Invalid signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }
    
    const functionName = body.name;
    const args = body.args || {};
    const callContext = body.call || {};
    
    console.log(`[Retell Functions] Function: ${functionName}`, args);
    
    const supabase = await createClient();
    
    // Get business context from call metadata
    const businessId = callContext.metadata?.business_id || 
                       callContext.retell_llm_dynamic_variables?.business_id;
    
    let result: string;
    
    switch (functionName) {
      case 'check_availability_cal':
        result = await checkAvailability(supabase, args, businessId);
        break;
        
      case 'book_appointment_cal':
        result = await bookAppointment(supabase, args, businessId);
        break;
        
      case 'reschedule_appointment':
        result = await rescheduleAppointment(supabase, args, businessId);
        break;
        
      case 'cancel_appointment':
        result = await cancelAppointment(supabase, args, businessId);
        break;
        
      case 'check_current_appointment':
        result = await checkCurrentAppointment(supabase, args, businessId);
        break;
        
      case 'transfer_to_sales':
        result = await prepareWarmTransfer(supabase, args, businessId, callContext);
        break;
        
      case 'get_weather_context':
        result = await getWeatherContext(args, businessId);
        break;
        
      default:
        result = `Unknown function: ${functionName}`;
    }
    
    return NextResponse.json({ result });
    
  } catch (error: any) {
    console.error('[Retell Functions] Error:', error);
    return NextResponse.json({ 
      result: 'I encountered an error. Please try again or I can connect you with a team member.'
    });
  }
}

// Check calendar availability
async function checkAvailability(
  supabase: any, 
  args: { start_time: string; end_time?: string; service_type?: string },
  businessId: string
): Promise<string> {
  try {
    const { start_time, service_type } = args;
    
    // Parse the date
    const requestedDate = new Date(start_time);
    const dateStr = requestedDate.toISOString().split('T')[0];
    
    // Query existing bookings for that date
    const { data: existingBookings } = await supabase
      .from('bookings')
      .select('time_slot, duration_minutes')
      .eq('business_id', businessId)
      .eq('date', dateStr)
      .in('status', ['confirmed', 'pending']);
    
    // Generate available slots (9 AM to 5 PM, 30-minute intervals)
    const allSlots = [];
    for (let hour = 9; hour < 17; hour++) {
      allSlots.push(`${hour}:00`);
      allSlots.push(`${hour}:30`);
    }
    
    // Filter out booked slots
    const bookedTimes = (existingBookings || []).map((b: any) => b.time_slot);
    const availableSlots = allSlots.filter(slot => !bookedTimes.includes(slot));
    
    if (availableSlots.length === 0) {
      return `I'm sorry, we don't have any availability on ${dateStr}. Would you like to check another day?`;
    }
    
    // Return only first 3 options (Rule of Three)
    const topSlots = availableSlots.slice(0, 3);
    const slotsText = topSlots.map(s => formatTime(s)).join(', ');
    
    return `On ${formatDate(dateStr)}, I have ${slotsText} available. Which time works best for you?`;
    
  } catch (error) {
    console.error('[checkAvailability] Error:', error);
    return 'I had trouble checking the calendar. Let me try again or I can have someone call you back.';
  }
}

// Book a new appointment
async function bookAppointment(
  supabase: any,
  args: {
    time: string;
    guest_name: string;
    guest_email?: string;
    guest_phone?: string;
    notes?: string;
    timezone?: string;
  },
  businessId: string
): Promise<string> {
  try {
    const { time, guest_name, guest_email, guest_phone, notes } = args;
    
    // Parse the time (expected in absolute format)
    const appointmentTime = new Date(time);
    const dateStr = appointmentTime.toISOString().split('T')[0];
    const timeSlot = `${appointmentTime.getHours()}:${String(appointmentTime.getMinutes()).padStart(2, '0')}`;
    
    // Check if slot is still available
    const { data: existing } = await supabase
      .from('bookings')
      .select('id')
      .eq('business_id', businessId)
      .eq('date', dateStr)
      .eq('time_slot', timeSlot)
      .in('status', ['confirmed', 'pending'])
      .single();
    
    if (existing) {
      return `I'm sorry, that time slot was just taken. Let me check what else is available.`;
    }
    
    // Create the booking
    const { data: booking, error } = await supabase
      .from('bookings')
      .insert({
        business_id: businessId,
        date: dateStr,
        time_slot: timeSlot,
        customer_name: guest_name,
        customer_email: guest_email || 'monitoring@amplifyvoice.ai',
        customer_phone: guest_phone,
        notes: notes || '',
        status: 'confirmed',
        source: 'retell_agent',
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return `I've booked your appointment for ${formatDate(dateStr)} at ${formatTime(timeSlot)}. You'll receive a confirmation at ${guest_email || 'your email on file'}. Is there anything else I can help you with?`;
    
  } catch (error) {
    console.error('[bookAppointment] Error:', error);
    return 'I had trouble completing the booking. Let me transfer you to someone who can help.';
  }
}

// Reschedule an existing appointment
async function rescheduleAppointment(
  supabase: any,
  args: { booking_id: string; new_time: string },
  businessId: string
): Promise<string> {
  try {
    const { booking_id, new_time } = args;
    
    // Parse new time
    const newAppointmentTime = new Date(new_time);
    const newDateStr = newAppointmentTime.toISOString().split('T')[0];
    const newTimeSlot = `${newAppointmentTime.getHours()}:${String(newAppointmentTime.getMinutes()).padStart(2, '0')}`;
    
    // Check if new slot is available
    const { data: existing } = await supabase
      .from('bookings')
      .select('id')
      .eq('business_id', businessId)
      .eq('date', newDateStr)
      .eq('time_slot', newTimeSlot)
      .in('status', ['confirmed', 'pending'])
      .neq('id', booking_id)
      .single();
    
    if (existing) {
      return `That time is not available. Would you like me to check other options?`;
    }
    
    // Update the booking
    const { error } = await supabase
      .from('bookings')
      .update({
        date: newDateStr,
        time_slot: newTimeSlot,
        updated_at: new Date().toISOString(),
      })
      .eq('id', booking_id)
      .eq('business_id', businessId);
    
    if (error) throw error;
    
    return `I've rescheduled your appointment to ${formatDate(newDateStr)} at ${formatTime(newTimeSlot)}. You'll receive an updated confirmation. Is there anything else?`;
    
  } catch (error) {
    console.error('[rescheduleAppointment] Error:', error);
    return 'I had trouble rescheduling. Let me connect you with someone who can help.';
  }
}

// Cancel an appointment (with nudge strategy)
async function cancelAppointment(
  supabase: any,
  args: { booking_id: string; reason?: string },
  businessId: string
): Promise<string> {
  try {
    const { booking_id, reason } = args;
    
    // Update booking status
    const { error } = await supabase
      .from('bookings')
      .update({
        status: 'cancelled',
        cancellation_reason: reason || 'Customer requested',
        cancelled_at: new Date().toISOString(),
      })
      .eq('id', booking_id)
      .eq('business_id', businessId);
    
    if (error) throw error;
    
    return `I've cancelled your appointment. We're sorry to see you go. Would you like to schedule a new appointment for a later date?`;
    
  } catch (error) {
    console.error('[cancelAppointment] Error:', error);
    return 'I had trouble processing the cancellation. Let me connect you with our team.';
  }
}

// Check current appointment (required before reschedule/cancel)
async function checkCurrentAppointment(
  supabase: any,
  args: { customer_phone?: string; customer_email?: string; customer_name?: string },
  businessId: string
): Promise<string> {
  try {
    const { customer_phone, customer_email, customer_name } = args;
    
    let query = supabase
      .from('bookings')
      .select('id, date, time_slot, customer_name, status')
      .eq('business_id', businessId)
      .in('status', ['confirmed', 'pending'])
      .gte('date', new Date().toISOString().split('T')[0])
      .order('date', { ascending: true })
      .limit(1);
    
    if (customer_phone) {
      query = query.eq('customer_phone', customer_phone);
    } else if (customer_email) {
      query = query.eq('customer_email', customer_email);
    } else if (customer_name) {
      query = query.ilike('customer_name', `%${customer_name}%`);
    }
    
    const { data: booking } = await query.single();
    
    if (!booking) {
      return `I couldn't find an upcoming appointment with that information. Could you provide your phone number or email address?`;
    }
    
    return `I found your appointment on ${formatDate(booking.date)} at ${formatTime(booking.time_slot)}. The booking ID is ${booking.id}. How can I help you with this appointment?`;
    
  } catch (error) {
    console.error('[checkCurrentAppointment] Error:', error);
    return 'I had trouble looking up your appointment. Can you provide more details?';
  }
}

// Prepare warm transfer to sales
async function prepareWarmTransfer(
  supabase: any,
  args: { 
    caller_name?: string; 
    caller_company?: string;
    prospect_website?: string;
    transfer_reason?: string;
  },
  businessId: string,
  callContext: any
): Promise<string> {
  try {
    const { caller_name, caller_company, prospect_website, transfer_reason } = args;
    
    // Get weather context for the business location
    const { data: business } = await supabase
      .from('businesses')
      .select('zip_code, name')
      .eq('id', businessId)
      .single();
    
    let weatherContext = {};
    if (business?.zip_code && OPENWEATHER_API_KEY) {
      try {
        const weatherResponse = await fetch(
          `http://api.openweathermap.org/geo/1.0/zip?zip=${business.zip_code},US&appid=${OPENWEATHER_API_KEY}`
        );
        if (weatherResponse.ok) {
          const coords = await weatherResponse.json();
          const currentWeather = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${coords.lat}&lon=${coords.lon}&appid=${OPENWEATHER_API_KEY}&units=imperial`
          );
          if (currentWeather.ok) {
            const weather = await currentWeather.json();
            weatherContext = {
              temp: Math.round(weather.main.temp),
              description: weather.weather[0].description,
              is_raining: weather.weather[0].main === 'Rain',
            };
          }
        }
      } catch (e) {
        console.log('[prepareWarmTransfer] Weather fetch failed:', e);
      }
    }
    
    // Create transfer queue entry
    await supabase.from('warm_transfer_queue').insert({
      business_id: businessId,
      caller_name,
      caller_company,
      prospect_website,
      weather_context: weatherContext,
      whisper_script: generateWhisperScript(caller_name, caller_company, weatherContext, transfer_reason),
      status: 'ready',
    });
    
    return `I'm connecting you with our sales team now. Please hold for just a moment.`;
    
  } catch (error) {
    console.error('[prepareWarmTransfer] Error:', error);
    return 'Let me connect you with our sales team.';
  }
}

// Get weather context for booking decisions
async function getWeatherContext(
  args: { zip_code?: string; date?: string },
  businessId: string
): Promise<string> {
  try {
    const { zip_code, date } = args;
    
    if (!zip_code || !OPENWEATHER_API_KEY) {
      return 'Weather information is not available at the moment.';
    }
    
    // Get coordinates
    const geoResponse = await fetch(
      `http://api.openweathermap.org/geo/1.0/zip?zip=${zip_code},US&appid=${OPENWEATHER_API_KEY}`
    );
    
    if (!geoResponse.ok) {
      return 'I could not find weather for that location.';
    }
    
    const coords = await geoResponse.json();
    
    // Get forecast
    const forecastResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${coords.lat}&lon=${coords.lon}&appid=${OPENWEATHER_API_KEY}&units=imperial`
    );
    
    if (!forecastResponse.ok) {
      return 'Weather forecast is temporarily unavailable.';
    }
    
    const forecast = await forecastResponse.json();
    
    // Find matching date in forecast
    if (date) {
      const targetDate = new Date(date).toDateString();
      const matchingForecast = forecast.list.find((f: any) => 
        new Date(f.dt * 1000).toDateString() === targetDate
      );
      
      if (matchingForecast) {
        const rainChance = (matchingForecast.pop || 0) * 100;
        const temp = Math.round(matchingForecast.main.temp);
        
        if (rainChance > 50) {
          return `I see there's a ${Math.round(rainChance)}% chance of rain on that day. Would you prefer to look at a different date when it's clearer?`;
        } else if (temp > 95) {
          return `It's expected to be quite hot that day, around ${temp} degrees. Would you prefer an earlier morning appointment?`;
        } else if (temp < 40) {
          return `It's going to be cold that day, around ${temp} degrees. Just wanted to let you know in case you'd prefer a different day.`;
        }
      }
    }
    
    return 'The weather looks good for your selected date.';
    
  } catch (error) {
    console.error('[getWeatherContext] Error:', error);
    return 'Weather information is currently unavailable.';
  }
}

// Helper: Generate whisper script for sales rep
function generateWhisperScript(
  callerName?: string,
  callerCompany?: string,
  weatherContext?: any,
  transferReason?: string
): string {
  let script = `Transferring ${callerName || 'a caller'}`;
  
  if (callerCompany) {
    script += ` from ${callerCompany}`;
  }
  
  script += '.';
  
  if (transferReason) {
    script += ` They're interested in ${transferReason}.`;
  }
  
  if (weatherContext?.is_raining) {
    script += ` It's currently raining there—good opportunity for weather-related services.`;
  }
  
  return script;
}

// Helper: Format date for speech
function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric' 
  });
}

// Helper: Format time for speech
function formatTime(timeStr: string): string {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  return minutes === 0 ? `${hour12} ${period}` : `${hour12}:${String(minutes).padStart(2, '0')} ${period}`;
}
