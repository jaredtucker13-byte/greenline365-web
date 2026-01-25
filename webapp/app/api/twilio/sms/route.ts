import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import twilio from 'twilio';

/**
 * Twilio SMS Webhook Handler
 * 
 * Receives incoming SMS messages and processes them with AI extraction
 * 
 * POST /api/twilio/sms - Receive incoming SMS (webhook from Twilio)
 * 
 * Configure in Twilio Console:
 * URL: https://www.greenline365.com/api/twilio/sms
 * Method: HTTP POST
 */

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || '';
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || '';
const TWILIO_PHONE_NUMBER = process.env.TWILIO_SMS_NUMBER || process.env.TWILIO_PHONE_NUMBER || '+18135409691';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';

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
    
    // Check if this is a response to a "text me your info" request
    const { data: pendingRequest } = await supabase
      .from('sms_info_requests')
      .select('*')
      .eq('phone_number', from)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (pendingRequest) {
      // USE CASE 3: Perfect Transcription - Extract info from SMS
      const extractedInfo = await extractContactInfo(body);
      
      if (extractedInfo) {
        // Update the pending request
        await supabase
          .from('sms_info_requests')
          .update({
            status: 'completed',
            extracted_data: extractedInfo,
            raw_response: body,
            completed_at: new Date().toISOString()
          })
          .eq('id', pendingRequest.id);
        
        // Store in agent memory for the call
        if (pendingRequest.call_id) {
          await supabase.from('agent_memory').insert({
            customer_phone: from,
            customer_name: `${extractedInfo.first_name} ${extractedInfo.last_name}`.trim(),
            customer_email: extractedInfo.email,
            memory_type: 'contact_info',
            memory_key: 'verified_contact',
            memory_value: JSON.stringify(extractedInfo),
            source: 'sms_extraction',
            call_id: pendingRequest.call_id
          });
        }
        
        // Send confirmation
        const client = getTwilioClient();
        if (client) {
          await client.messages.create({
            body: `Got it, ${extractedInfo.first_name}! I've saved your info. Thanks!`,
            from: TWILIO_PHONE_NUMBER,
            to: from
          });
        }
        
        return new NextResponse(
          `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`,
          { status: 200, headers: { 'Content-Type': 'text/xml' } }
        );
      }
    }
    
    // Handle common SMS responses
    const lowerBody = body.toLowerCase().trim();
    let responseMessage = '';
    
    if (lowerBody === 'yes' || lowerBody === 'confirm' || lowerBody === 'y') {
      responseMessage = "Great! Your appointment is confirmed. We'll see you soon! Reply HELP for assistance or STOP to unsubscribe.";
      
      await supabase
        .from('bookings')
        .update({ status: 'confirmed', sms_confirmed: true })
        .eq('phone', from)
        .eq('status', 'pending');
        
    } else if (lowerBody === 'no' || lowerBody === 'cancel' || lowerBody === 'n') {
      responseMessage = "Your appointment has been cancelled. Reply BOOK to reschedule or call (813) 540-9691. - GreenLine365";
      
      await supabase
        .from('bookings')
        .update({ status: 'cancelled', cancellation_reason: 'SMS cancellation' })
        .eq('phone', from)
        .eq('status', 'pending');
        
    } else if (lowerBody === 'help') {
      responseMessage = "GreenLine365 Help:\n• Reply YES to confirm\n• Reply NO to cancel\n• Reply BOOK to schedule\n• Reply STOP to unsubscribe\n• Call (813) 540-9691 for assistance";
      
    } else if (lowerBody === 'stop' || lowerBody === 'unsubscribe') {
      responseMessage = "You've been unsubscribed from GreenLine365 messages. Reply START to resubscribe.";
      
      await supabase.from('agent_memory').insert({
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
    
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`,
      { status: 200, headers: { 'Content-Type': 'text/xml' } }
    );
    
  } catch (error: any) {
    console.error('[Twilio SMS Webhook] Error:', error);
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`,
      { status: 200, headers: { 'Content-Type': 'text/xml' } }
    );
  }
}

// USE CASE 3: AI-powered contact info extraction
async function extractContactInfo(text: string): Promise<{
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
} | null> {
  try {
    if (!OPENROUTER_API_KEY) {
      // Fallback to regex extraction
      return regexExtractInfo(text);
    }
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an information extractor. Extract contact information from the user's text message.
Return ONLY valid JSON with these fields:
{
  "first_name": "string",
  "last_name": "string",
  "email": "string or null",
  "phone": "string or null"
}
If a field cannot be determined, use null. Be smart about parsing - the user may have sent info in any format.`
          },
          {
            role: 'user',
            content: text
          }
        ],
        temperature: 0
      })
    });
    
    if (!response.ok) {
      console.error('[Extract Info] OpenRouter error:', await response.text());
      return regexExtractInfo(text);
    }
    
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.first_name || parsed.email) {
        return parsed;
      }
    }
    
    return regexExtractInfo(text);
    
  } catch (error) {
    console.error('[Extract Info] Error:', error);
    return regexExtractInfo(text);
  }
}

// Fallback regex extraction
function regexExtractInfo(text: string): {
  first_name: string;
  last_name: string;
  email: string;
} | null {
  // Extract email
  const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
  const email = emailMatch ? emailMatch[0] : '';
  
  // Extract name (assume it's the text before the email or the whole text if no email)
  let nameText = email ? text.replace(email, '').trim() : text.trim();
  nameText = nameText.replace(/[^a-zA-Z\s]/g, '').trim();
  
  const nameParts = nameText.split(/\s+/).filter(Boolean);
  const first_name = nameParts[0] || '';
  const last_name = nameParts.slice(1).join(' ') || '';
  
  if (!first_name && !email) {
    return null;
  }
  
  return { first_name, last_name, email };
}

// GET - Health check
export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    service: 'Twilio SMS Webhook',
    phone: TWILIO_PHONE_NUMBER 
  });
}
