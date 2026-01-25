import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import twilio from 'twilio';

/**
 * Twilio SMS Webhook Handler
 * 
 * Receives incoming SMS messages and sends outgoing SMS
 * 
 * POST /api/twilio/sms - Receive incoming SMS (webhook from Twilio)
 * 
 * Configure in Twilio Console:
 * URL: https://www.greenline365.com/api/twilio/sms
 * Method: HTTP POST
 */

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || '';
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || '';
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER || '+18135409691';

// Initialize Twilio client
const getTwilioClient = () => {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    return null;
  }
  return twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
};

// POST - Receive incoming SMS from Twilio webhook
export async function POST(request: NextRequest) {
  try {
    // Parse Twilio webhook data (x-www-form-urlencoded)
    const formData = await request.formData();
    
    const from = formData.get('From') as string;
    const to = formData.get('To') as string;
    const body = formData.get('Body') as string;
    const messageSid = formData.get('MessageSid') as string;
    
    console.log(`[Twilio SMS] Received from ${from}: ${body}`);
    
    const supabase = await createClient();
    
    // Store incoming message in database
    await supabase.from('sms_messages').insert({
      direction: 'inbound',
      from_number: from,
      to_number: to,
      body: body,
      message_sid: messageSid,
      status: 'received',
      created_at: new Date().toISOString()
    });
    
    // Check if this is a booking confirmation reply
    const lowerBody = body.toLowerCase().trim();
    
    // Handle common SMS responses
    let responseMessage = '';
    
    if (lowerBody === 'yes' || lowerBody === 'confirm' || lowerBody === 'y') {
      responseMessage = "Great! Your appointment is confirmed. We'll see you soon! Reply HELP for assistance or STOP to unsubscribe.";
      
      // Update booking status if we can find it
      await supabase
        .from('bookings')
        .update({ status: 'confirmed', sms_confirmed: true })
        .eq('phone', from)
        .eq('status', 'pending');
        
    } else if (lowerBody === 'no' || lowerBody === 'cancel' || lowerBody === 'n') {
      responseMessage = "Your appointment has been cancelled. Reply BOOK to schedule a new time, or call us if you need assistance.";
      
      await supabase
        .from('bookings')
        .update({ status: 'cancelled', cancellation_reason: 'SMS cancellation' })
        .eq('phone', from)
        .eq('status', 'pending');
        
    } else if (lowerBody === 'help') {
      responseMessage = "GreenLine365 Help:\n• Reply YES to confirm\n• Reply NO to cancel\n• Reply BOOK to schedule\n• Reply STOP to unsubscribe\n• Call (813) 540-9691 for assistance";
      
    } else if (lowerBody === 'stop' || lowerBody === 'unsubscribe') {
      responseMessage = "You've been unsubscribed from GreenLine365 messages. Reply START to resubscribe.";
      
      // Mark customer as unsubscribed
      await supabase
        .from('agent_memory')
        .insert({
          customer_phone: from,
          memory_type: 'preference',
          memory_key: 'sms_unsubscribed',
          memory_value: 'true',
          source: 'sms'
        });
        
    } else if (lowerBody === 'start' || lowerBody === 'subscribe') {
      responseMessage = "Welcome back! You're now subscribed to GreenLine365 messages.";
      
      await supabase
        .from('agent_memory')
        .delete()
        .eq('customer_phone', from)
        .eq('memory_key', 'sms_unsubscribed');
        
    } else if (lowerBody.includes('book') || lowerBody.includes('schedule') || lowerBody.includes('appointment')) {
      responseMessage = "I'd love to help you book! Please call us at (813) 540-9691 or visit greenline365.com to schedule your appointment.";
      
    } else {
      // Default response for unknown messages
      responseMessage = "Thanks for your message! Reply HELP for options, or call (813) 540-9691 to speak with our team.";
    }
    
    // Send response via Twilio
    if (responseMessage) {
      const client = getTwilioClient();
      if (client) {
        await client.messages.create({
          body: responseMessage,
          from: TWILIO_PHONE_NUMBER,
          to: from
        });
        
        // Log outgoing message
        await supabase.from('sms_messages').insert({
          direction: 'outbound',
          from_number: TWILIO_PHONE_NUMBER,
          to_number: from,
          body: responseMessage,
          status: 'sent',
          created_at: new Date().toISOString()
        });
      }
    }
    
    // Return TwiML response (empty response since we're handling via API)
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`,
      {
        status: 200,
        headers: { 'Content-Type': 'text/xml' }
      }
    );
    
  } catch (error: any) {
    console.error('[Twilio SMS Webhook] Error:', error);
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`,
      { status: 200, headers: { 'Content-Type': 'text/xml' } }
    );
  }
}

// GET - Health check
export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    service: 'Twilio SMS Webhook',
    phone: TWILIO_PHONE_NUMBER 
  });
}
