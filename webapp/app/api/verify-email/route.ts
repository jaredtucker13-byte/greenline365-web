import { NextRequest } from 'next/server';

// Store verification codes temporarily (in production, use Redis or database)
const verificationCodes = new Map<string, { code: string; expires: number }>();

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
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

      // In production, you would send an actual email here
      // For now, we'll simulate sending and log the code
      console.log(`Verification code for ${email}: ${code}`);

      // Simulate email sending (in production, use SendGrid, Resend, etc.)
      // For demo purposes, we'll return success and the code in dev mode
      const isDev = process.env.NODE_ENV === 'development';
      
      return Response.json({
        success: true,
        message: 'Verification code sent to your email',
        // Only include code in development for testing
        ...(isDev && { devCode: code }),
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
