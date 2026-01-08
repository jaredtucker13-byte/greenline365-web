import { NextRequest } from 'next/server';
import sgMail from '@sendgrid/mail';

// Initialize SendGrid
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

// Store verification codes temporarily (in production, use Redis or database)
const verificationCodes = new Map<string, { code: string; expires: number }>();

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendVerificationEmail(email: string, code: string): Promise<boolean> {
  if (!SENDGRID_API_KEY) {
    console.warn('SendGrid API key not configured. Skipping email send.');
    return false;
  }

  try {
    const msg = {
      to: email,
      from: 'support@greenline365.com', // Update this to your verified sender
      subject: 'GreenLine365 - Email Verification Code',
      text: `Your verification code is: ${code}. This code will expire in 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #0a0a0a; padding: 40px; text-align: center;">
            <h1 style="color: #39FF14; margin: 0;">GreenLine365</h1>
          </div>
          <div style="background: #ffffff; padding: 40px; color: #333;">
            <h2 style="color: #0a0a0a; margin-top: 0;">Email Verification</h2>
            <p>Your verification code is:</p>
            <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #39FF14; border-radius: 8px; margin: 20px 0;">
              ${code}
            </div>
            <p style="color: #666; font-size: 14px;">This code will expire in 10 minutes.</p>
            <p style="color: #666; font-size: 14px;">If you didn't request this code, please ignore this email.</p>
          </div>
          <div style="background: #f5f5f5; padding: 20px; text-align: center; color: #666; font-size: 12px;">
            <p>© 2026 GreenLine365. All rights reserved.</p>
          </div>
        </div>
      `,
    };

    await sgMail.send(msg);
    console.log(`Verification email sent to ${email}`);
    return true;
  } catch (error: any) {
    console.error('SendGrid error:', error.response?.body || error.message);
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { email, action } = await req.json();

    if (!email || !isValidEmail(email)) {
      return Response.json({ error: 'Valid email is required' }, { status: 400 });
    }

    if (action === 'send') {
      // Generate and store verification code
      const code = generateCode();
      verificationCodes.set(email.toLowerCase(), {
        code,
        expires: Date.now() + 10 * 60 * 1000, // 10 minutes
      });

      // Send email via SendGrid
      const emailSent = await sendVerificationEmail(email, code);

      if (!emailSent && !SENDGRID_API_KEY) {
        // If SendGrid is not configured, log the code for development
        console.log(`[DEV] Verification code for ${email}: ${code}`);
      }

      const isDev = process.env.NODE_ENV === 'development';
      
      return Response.json({
        success: true,
        message: emailSent 
          ? 'Verification code sent to your email'
          : 'Verification code generated (email disabled in development)',
        // Only include code in development for testing when SendGrid is not configured
        ...(isDev && !SENDGRID_API_KEY && { devCode: code }),
      });
    }

    if (action === 'verify') {
      const { code } = await req.json().catch(() => ({ code: '' }));
      const stored = verificationCodes.get(email.toLowerCase());

      if (!stored) {
        return Response.json({ error: 'No verification code found. Please request a new one.' }, { status: 400 });
      }

      if (Date.now() > stored.expires) {
        verificationCodes.delete(email.toLowerCase());
        return Response.json({ error: 'Verification code expired. Please request a new one.' }, { status: 400 });
      }

      if (stored.code !== code) {
        return Response.json({ error: 'Invalid verification code' }, { status: 400 });
      }

      // Code is valid, remove it
      verificationCodes.delete(email.toLowerCase());

      return Response.json({
        success: true,
        verified: true,
        message: 'Email verified successfully',
      });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Verify email error:', error);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
