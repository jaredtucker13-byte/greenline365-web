import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

// Initialize Twilio client
const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

// POST /api/sms/otp/send - Send OTP code (rate limited)
export async function POST(request: NextRequest) {
  // Rate limit: 5 OTP requests per minute per IP
  const rl = rateLimit(request, { max: 5, windowMs: 60_000 });
  if (!rl.allowed) return rateLimitResponse(rl.retryAfter);

  try {
    if (!client) {
      return NextResponse.json(
        { error: 'Twilio not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { phone } = body;

    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Format phone number
    const formattedNumber = phone.startsWith('+') ? phone : `+1${phone.replace(/\D/g, '')}`;

    // If Verify Service is configured, use it
    if (verifyServiceSid) {
      const verification = await client.verify.v2
        .services(verifyServiceSid)
        .verifications.create({
          to: formattedNumber,
          channel: 'sms',
        });

      return NextResponse.json({
        success: true,
        status: verification.status,
        message: 'OTP sent successfully',
      });
    } else {
      // Fallback: Generate and send OTP manually via SMS
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      
      const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
      
      await client.messages.create({
        body: `Your GreenLine365 verification code is: ${otp}. This code expires in 10 minutes.`,
        messagingServiceSid: messagingServiceSid,
        to: formattedNumber,
      });

      // In production, store this OTP in database with expiry
      return NextResponse.json({
        success: true,
        message: 'OTP sent successfully',
      });
    }
  } catch (error: any) {
    console.error('Error sending OTP:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send OTP' },
      { status: 500 }
    );
  }
}
