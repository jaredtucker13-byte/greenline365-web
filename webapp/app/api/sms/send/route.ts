import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;

// Initialize Twilio client
const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

interface SendSMSRequest {
  to: string | string[];
  message: string;
  template?: string;
  variables?: Record<string, string>;
}

// Replace template variables
function replaceVariables(content: string, variables: Record<string, string>): string {
  let result = content;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, value);
  }
  return result;
}

// POST /api/sms/send - Send SMS message(s)
export async function POST(request: NextRequest) {
  try {
    if (!client) {
      return NextResponse.json(
        { error: 'Twilio not configured. Please add TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN.' },
        { status: 500 }
      );
    }

    const body: SendSMSRequest = await request.json();
    const { to, message, variables = {} } = body;

    if (!to || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: to, message' },
        { status: 400 }
      );
    }

    // Replace variables in message
    const finalMessage = replaceVariables(message, variables);

    // Handle single or multiple recipients
    const recipients = Array.isArray(to) ? to : [to];
    const results = [];

    for (const recipient of recipients) {
      try {
        // Format phone number (ensure E.164 format)
        const formattedNumber = recipient.startsWith('+') ? recipient : `+1${recipient.replace(/\D/g, '')}`;
        
        const smsResult = await client.messages.create({
          body: finalMessage,
          messagingServiceSid: messagingServiceSid,
          to: formattedNumber,
        });

        results.push({
          to: formattedNumber,
          success: true,
          sid: smsResult.sid,
          status: smsResult.status,
        });
      } catch (error: any) {
        results.push({
          to: recipient,
          success: false,
          error: error.message,
        });
      }
    }

    const allSuccess = results.every(r => r.success);
    const someSuccess = results.some(r => r.success);

    return NextResponse.json({
      success: allSuccess,
      partial: !allSuccess && someSuccess,
      results,
      sent: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
    }, { status: allSuccess ? 200 : someSuccess ? 207 : 500 });

  } catch (error: any) {
    console.error('Error sending SMS:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send SMS' },
      { status: 500 }
    );
  }
}
