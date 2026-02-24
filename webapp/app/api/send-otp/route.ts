import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import crypto from 'crypto';
import { captureException } from '@/lib/error-tracking';

// OTP delivery — sends directly via Gmail (replaces n8n webhook)

// Generate a random 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Hash the OTP for secure storage
function hashOTP(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
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
    const codeHash = hashOTP(code);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP in database
    const { error: otpError } = await supabase
      .from('phone_otp')
      .insert({
        email,
        phone,
        user_id: existingProfile?.id || null,
        code_hash: codeHash,
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

    // Send OTP via email (native — replaces n8n webhook)
    try {
      const nodemailer = await import('nodemailer');
      const gmailUser = process.env.GMAIL_USER;
      const gmailPass = process.env.GMAIL_APP_PASSWORD;

      if (gmailUser && gmailPass) {
        const transporter = nodemailer.default.createTransport({
          service: 'gmail',
          auth: { user: gmailUser, pass: gmailPass },
        });

        await transporter.sendMail({
          from: `"GreenLine365" <${gmailUser}>`,
          to: email,
          subject: `Your GreenLine365 verification code: ${code}`,
          html: `
            <div style="font-family: -apple-system, sans-serif; max-width: 400px; margin: 0 auto; text-align: center;">
              <h2 style="color: #065f46;">GreenLine365</h2>
              <p>Your verification code is:</p>
              <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; padding: 20px; background: #f0fdf4; border-radius: 8px; color: #065f46;">
                ${code}
              </div>
              <p style="color: #6b7280; font-size: 13px; margin-top: 16px;">
                This code expires in 10 minutes.<br>
                If you didn't request this, ignore this email.
              </p>
            </div>
          `,
        });
        console.log('OTP sent via email successfully');
      } else {
        console.warn('[OTP] Gmail not configured — OTP stored but not delivered');
      }
    } catch (emailError) {
      console.error('Failed to send OTP email:', emailError);
      // Don't fail — the OTP is stored, user can request resend
    }

    return NextResponse.json(
      { 
        status: 'ok',
        message: 'Verification code sent to your phone',
        expires_in: 600, // 10 minutes in seconds
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    captureException(error, { source: 'api/send-otp', extra: { method: 'POST' } });
    console.error('Error in send-otp:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
