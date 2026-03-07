import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import crypto from 'crypto';

// N8N Webhook URL - must be configured in environment
const N8N_WEBHOOK_URL = process.env.N8N_OTP_WEBHOOK_URL;

// Generate a cryptographically secure 6-digit OTP
function generateOTP(): string {
  return crypto.randomInt(100000, 999999).toString();
}

// Hash the OTP with a random salt for secure storage
function hashOTP(code: string, salt?: string): { hash: string; salt: string } {
  const useSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.createHash('sha256').update(useSalt + code).digest('hex');
  return { hash, salt: useSalt };
}

// Verify an OTP against a stored hash + salt
function verifyOTP(code: string, storedHash: string, salt: string): boolean {
  const { hash } = hashOTP(code, salt);
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(storedHash));
}

export async function POST(request: NextRequest) {
  const rl = rateLimit(request, { max: 10 }); // 10 requests/min
  if (!rl.allowed) return rateLimitResponse(rl.retryAfter);

  try {
    const body = await request.json();
    const { email, phone } = body;

    // Validate required fields
    if (!email || !phone) {
      return NextResponse.json(
        { error: 'Email and phone are required' },
        { status: 400 }
      );
    }

    // Validate phone format (basic E.164 format check)
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phone)) {
      return NextResponse.json(
        { error: 'Phone must be in E.164 format (e.g., +1234567890)' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Check if user already exists and is verified
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, email, phone_verified, email_verified')
      .eq('email', email)
      .single();

    if (existingProfile?.phone_verified && existingProfile?.email_verified) {
      return NextResponse.json(
        { error: 'This email is already verified', already_verified: true },
        { status: 409 }
      );
    }

    // Generate OTP
    const code = generateOTP();
    const { hash: codeHash, salt: codeSalt } = hashOTP(code);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP in database (hash + salt)
    const { error: otpError } = await supabase
      .from('phone_otp')
      .insert({
        email,
        phone,
        user_id: existingProfile?.id || null,
        code_hash: codeHash,
        code_salt: codeSalt,
        expires_at: expiresAt.toISOString(),
        used: false,
      });

    if (otpError) {
      console.error('Error storing OTP:', otpError);
      return NextResponse.json(
        { error: 'Failed to generate verification code' },
        { status: 500 }
      );
    }

    // Send OTP to N8N webhook
    try {
      if (!N8N_WEBHOOK_URL) {
        console.warn('[send-otp] N8N_OTP_WEBHOOK_URL not configured, skipping webhook');
      } else {
      const webhookResponse = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone,
          code,
          email,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!webhookResponse.ok) {
        console.error('N8N webhook error:', await webhookResponse.text());
        // Don't fail the request - OTP is stored, just log the webhook issue
      } else {
        console.log('OTP sent to N8N webhook successfully');
      }
      }
    } catch (webhookError) {
      console.error('Failed to call N8N webhook:', webhookError);
      // Don't fail - the OTP is stored, webhook delivery can be retried
    }

    return NextResponse.json(
      { 
        status: 'ok',
        message: 'Verification code sent to your phone',
        expires_in: 600, // 10 minutes in seconds
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in send-otp:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
