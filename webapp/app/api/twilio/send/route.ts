import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import twilio from 'twilio';

/**
 * Send SMS API
 * 
 * POST /api/twilio/send - Send an SMS message
 * 
 * Used for:
 * - Booking confirmations
 * - Appointment reminders
 * - Follow-up messages
 */

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || '';
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || '';
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER || '+18135409691';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      to, 
      message, 
      type = 'general',  // 'confirmation', 'reminder', 'followup', 'general'
      booking_id,
      metadata = {}
    } = body;
    
    if (!to || !message) {
      return NextResponse.json({ 
        error: 'to and message are required' 
      }, { status: 400 });
    }
    
    // Format phone number
    const formattedTo = formatPhoneE164(to);
    if (!formattedTo) {
      return NextResponse.json({ 
        error: 'Invalid phone number format' 
      }, { status: 400 });
    }
    
    // Check if user is unsubscribed
    const supabase = await createClient();
    const { data: unsubscribed } = await supabase
      .from('agent_memory')
      .select('id')
      .eq('customer_phone', formattedTo)
      .eq('memory_key', 'sms_unsubscribed')
      .single();
    
    if (unsubscribed) {
      return NextResponse.json({ 
        error: 'User has unsubscribed from SMS',
        unsubscribed: true 
      }, { status: 400 });
    }
    
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
      // Mock mode
      console.log(`[SMS Mock] Would send to ${formattedTo}: ${message}`);
      return NextResponse.json({
        success: true,
        mock: true,
        message: 'SMS would be sent in production',
        to: formattedTo
      });
    }
    
    // Send via Twilio
    const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    
    const twilioMessage = await client.messages.create({
      body: message,
      from: TWILIO_PHONE_NUMBER,
      to: formattedTo
    });
    
    // Log the message
    await supabase.from('sms_messages').insert({
      direction: 'outbound',
      from_number: TWILIO_PHONE_NUMBER,
      to_number: formattedTo,
      body: message,
      message_sid: twilioMessage.sid,
      status: twilioMessage.status,
      message_type: type,
      booking_id: booking_id,
      metadata: metadata,
      created_at: new Date().toISOString()
    });
    
    return NextResponse.json({
      success: true,
      message_sid: twilioMessage.sid,
      status: twilioMessage.status,
      to: formattedTo
    });
    
  } catch (error: any) {
    console.error('[Send SMS] Error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to send SMS' 
    }, { status: 500 });
  }
}

function formatPhoneE164(phone: string): string | null {
  const digits = phone.replace(/\D/g, '');
  
  if (digits.length === 10) {
    return `+1${digits}`;
  } else if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  } else if (digits.length > 10) {
    return `+${digits}`;
  }
  
  return null;
}

// Pre-built message templates
export const SMS_TEMPLATES = {
  booking_confirmation: (name: string, date: string, time: string, confirmNum: string) => 
    `Hi ${name}! Your appointment is confirmed for ${date} at ${time}. Confirmation #${confirmNum}. Reply YES to confirm or NO to cancel.`,
  
  reminder_24h: (name: string, date: string, time: string) =>
    `Hi ${name}, reminder: Your appointment is tomorrow (${date}) at ${time}. Reply YES to confirm or NO to cancel. - GreenLine365`,
  
  reminder_1h: (name: string, time: string) =>
    `Hi ${name}, your appointment starts in 1 hour at ${time}. See you soon! - GreenLine365`,
  
  cancellation: (name: string) =>
    `Hi ${name}, your appointment has been cancelled. Reply BOOK to reschedule or call (813) 540-9691. - GreenLine365`,
  
  reschedule: (name: string, newDate: string, newTime: string) =>
    `Hi ${name}, your appointment has been rescheduled to ${newDate} at ${newTime}. Reply YES to confirm. - GreenLine365`,
  
  followup: (name: string) =>
    `Hi ${name}! Thanks for your visit. We'd love your feedback! How was your experience? Reply 1-5 (5 being excellent). - GreenLine365`,
  
  demo_scheduled: (name: string, date: string, time: string) =>
    `Hi ${name}! Your GreenLine365 demo is scheduled for ${date} at ${time}. We'll call you then! Reply HELP for assistance.`
};
