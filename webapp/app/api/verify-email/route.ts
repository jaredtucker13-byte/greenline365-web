/**
 * Email Verification API
 *
 * Supports two modes:
 * 1. Code-based (legacy): action='send'/'verify' with 6-digit code
 * 2. Link-based (new): Double opt-in with verification link
 *
 * Uses Gmail SMTP (free 500/day) instead of SendGrid ($800/mo)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { sendEmail, generateVerificationToken, getVerificationEmailHtml } from '@/lib/email/gmail-sender';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://greenline365.com';

// Generate a cryptographically secure 6-digit code
function generateCode(): string {
  return crypto.randomInt(100000, 999999).toString();
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, action, source, name, metadata } = body;

    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // NEW: Link-based double opt-in verification
    if (source && ['waitlist', 'newsletter', 'crm', 'demo'].includes(source)) {
      // Check if email already exists and is verified
      const { data: existing } = await supabase
        .from('email_verifications')
        .select('*')
        .eq('email', normalizedEmail)
        .eq('source', source)
        .single();

      if (existing?.verified) {
        return NextResponse.json({
          success: true,
          message: 'Email already verified',
          alreadyVerified: true
        });
      }

      // Generate verification token
      const token = generateVerificationToken();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

      // Upsert verification record
      const { error: dbError } = await supabase
        .from('email_verifications')
        .upsert({
          email: normalizedEmail,
          name: name || null,
          source,
          token,
          expires_at: expiresAt,
          verified: false,
          metadata: metadata || {},
          created_at: existing?.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'email,source',
        });

      if (dbError) {
        console.error('[Verify Email] DB Error:', dbError);
        if (!dbError.message.includes('does not exist')) {
          return NextResponse.json({ error: 'Failed to save verification' }, { status: 500 });
        }
      }

      // Send verification email
      const verificationUrl = `${SITE_URL}/verify-email/${token}`;
      const emailResult = await sendEmail({
        to: normalizedEmail,
        subject: `Verify your email - GreenLine365`,
        html: getVerificationEmailHtml(name || '', verificationUrl, source),
      });

      if (!emailResult.success) {
        console.error('[Verify Email] Email send failed:', emailResult.error);

        // In development, still return success but log the URL
        if (process.env.NODE_ENV === 'development') {
          console.log(`[DEV] Verification URL: ${verificationUrl}`);
          return NextResponse.json({
            success: true,
            message: 'Verification email would be sent (dev mode)',
          });
        }

        return NextResponse.json({
          error: 'Failed to send verification email. Please check Gmail configuration.',
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: 'Verification email sent! Check your inbox.',
      });
    }

    // LEGACY: Code-based verification stored in DB (not in-memory)
    if (action === 'send') {
      const code = generateCode();
      const salt = crypto.randomBytes(16).toString('hex');
      const codeHash = crypto.createHash('sha256').update(salt + code).digest('hex');
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

      // Store in DB instead of in-memory Map (survives cold starts, works across instances)
      await supabase
        .from('email_verifications')
        .upsert({
          email: normalizedEmail,
          source: 'code_verify',
          token: codeHash,
          metadata: { salt },
          expires_at: expiresAt,
          verified: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'email,source',
        });

      // Send code via Gmail
      const emailResult = await sendEmail({
        to: normalizedEmail,
        subject: 'GreenLine365 - Email Verification Code',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; padding: 40px; border-radius: 12px;">
            <h1 style="color: #00e676; text-align: center; margin-bottom: 32px;">GreenLine365</h1>
            <p style="color: #ffffff; text-align: center; margin-bottom: 24px;">Your verification code is:</p>
            <div style="background: #1a1a1a; padding: 24px; text-align: center; font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #00e676; border-radius: 8px; border: 1px solid #00e676; margin-bottom: 24px;">
              ${code}
            </div>
            <p style="color: #888; text-align: center; font-size: 14px;">This code expires in 10 minutes.</p>
          </div>
        `,
      });

      const isDev = process.env.NODE_ENV === 'development';

      return NextResponse.json({
        success: true,
        message: emailResult.success
          ? 'Verification code sent to your email'
          : 'Verification code generated (check console in dev)',
        ...(isDev && !emailResult.success && { devCode: code }),
      });
    }

    if (action === 'verify') {
      const { code } = body;

      // Look up the stored verification from DB
      const { data: stored } = await supabase
        .from('email_verifications')
        .select('token, metadata, expires_at, verified')
        .eq('email', normalizedEmail)
        .eq('source', 'code_verify')
        .single();

      if (!stored || stored.verified) {
        return NextResponse.json({ error: 'No verification code found. Please request a new one.' }, { status: 400 });
      }

      if (new Date() > new Date(stored.expires_at)) {
        return NextResponse.json({ error: 'Verification code expired. Please request a new one.' }, { status: 400 });
      }

      // Verify with stored salt
      const salt = stored.metadata?.salt || '';
      const attemptHash = crypto.createHash('sha256').update(salt + code).digest('hex');

      if (!crypto.timingSafeEqual(Buffer.from(attemptHash), Buffer.from(stored.token))) {
        return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
      }

      // Mark as verified
      await supabase
        .from('email_verifications')
        .update({ verified: true, updated_at: new Date().toISOString() })
        .eq('email', normalizedEmail)
        .eq('source', 'code_verify');

      return NextResponse.json({
        success: true,
        verified: true,
        message: 'Email verified successfully',
      });
    }

    return NextResponse.json({ error: 'Invalid action or source' }, { status: 400 });
  } catch (error: any) {
    console.error('[Verify Email] Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
