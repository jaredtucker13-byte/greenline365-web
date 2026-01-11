import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

// Initialize Twilio client
const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

// POST /api/sms/otp/verify - Verify OTP code
export async function POST(request: NextRequest) {
  try {
    if (!client) {
      return NextResponse.json(
        { error: 'Twilio not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { phone, code } = body;

    if (!phone || !code) {
      return NextResponse.json(
        { error: 'Phone number and code are required' },
        { status: 400 }
      );
    }

    // Format phone number
    const formattedNumber = phone.startsWith('+') ? phone : `+1${phone.replace(/\D/g, '')}`;

    if (verifyServiceSid) {
      // Use Twilio Verify Service
      const verificationCheck = await client.verify.v2
        .services(verifyServiceSid)
        .verificationChecks.create({
          to: formattedNumber,
          code: code,
        });

      const isValid = verificationCheck.status === 'approved';

      return NextResponse.json({
        success: true,
        valid: isValid,
        status: verificationCheck.status,
      });
    } else {
      // Manual verification - would check against stored OTP in database
      // For now, return a message
      return NextResponse.json({
        success: false,
        error: 'OTP verification requires Twilio Verify Service. Please configure TWILIO_VERIFY_SERVICE_SID.',
      }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Error verifying OTP:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to verify OTP' },
      { status: 500 }
    );
  }
}
