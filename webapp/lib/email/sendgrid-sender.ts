/**
 * Email Sender using SendGrid Free Tier
 * 
 * Free tier: 100 emails/day (plenty for a startup)
 * 
 * Supports:
 * - Magic Link verification (click to verify)
 * - Code verification (enter 6-digit code)
 * 
 * Required env var: SENDGRID_API_KEY
 */

import sgMail from '@sendgrid/mail';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'greenline365help@gmail.com';

// Initialize SendGrid
if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
  if (!SENDGRID_API_KEY) {
    console.error('[Email] SENDGRID_API_KEY not configured');
    return { success: false, error: 'Email service not configured - missing SENDGRID_API_KEY' };
  }

  console.log('[Email] Attempting to send email');
  console.log('[Email] To:', options.to);
  console.log('[Email] From:', FROM_EMAIL);
  console.log('[Email] Subject:', options.subject);

  try {
    const result = await sgMail.send({
      from: {
        email: FROM_EMAIL,
        name: 'GreenLine365',
      },
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''),
    });

    console.log('[Email] Sent successfully to:', options.to);
    console.log('[Email] SendGrid response:', JSON.stringify(result));
    return { success: true };
  } catch (error: any) {
    console.error('[Email] Send failed');
    console.error('[Email] Error message:', error.message);
    console.error('[Email] Error code:', error.code);
    console.error('[Email] Error response:', JSON.stringify(error.response?.body || {}));
    
    // Extract specific error message
    const errorBody = error.response?.body;
    let detailedError = error.message;
    if (errorBody?.errors && errorBody.errors.length > 0) {
      detailedError = errorBody.errors.map((e: any) => e.message).join(', ');
    }
    
    return { success: false, error: detailedError };
  }
}

// Generate a random verification token for magic links
export function generateVerificationToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// Generate a 6-digit verification code
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Email template with BOTH magic link and code
export function getVerificationEmailHtml(
  name: string, 
  verificationUrl: string, 
  code: string,
  source: string,
  email?: string
): string {
  const sourceLabel = {
    waitlist: 'Waitlist',
    newsletter: 'Newsletter',
    crm: 'Contact',
    demo: 'Demo Request',
    signup: 'Account',
  }[source] || 'Registration';

  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://greenline365.com';
  const unsubscribeUrl = `${SITE_URL}/unsubscribe?email=${encodeURIComponent(email || '')}&list=${source}`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0a0a;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 32px;">
      <h1 style="color: #00e676; font-size: 28px; margin: 0;">
        GreenLine<span style="color: #ffffff;">365</span>
      </h1>
    </div>
    
    <!-- Main Card -->
    <div style="background: linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%); border: 1px solid #00e676; border-radius: 16px; padding: 40px; text-align: center;">
      <div style="width: 64px; height: 64px; background: rgba(0, 230, 118, 0.1); border-radius: 50%; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center;">
        <span style="font-size: 32px;">✉️</span>
      </div>
      
      <h2 style="color: #ffffff; font-size: 24px; margin: 0 0 16px;">
        Verify Your Email
      </h2>
      
      <p style="color: #a0a0a0; font-size: 16px; line-height: 1.6; margin: 0 0 8px;">
        Hi${name ? ` ${name}` : ''},
      </p>
      
      <p style="color: #a0a0a0; font-size: 16px; line-height: 1.6; margin: 0 0 32px;">
        Please verify your email to complete your <strong style="color: #00e676;">${sourceLabel}</strong> signup.
      </p>
      
      <!-- Option 1: Magic Link Button -->
      <a href="${verificationUrl}" style="display: inline-block; background: #00e676; color: #000000; font-weight: 700; font-size: 16px; padding: 16px 48px; border-radius: 12px; text-decoration: none; margin-bottom: 24px;">
        Verify My Email →
      </a>
      
      <p style="color: #606060; font-size: 14px; margin: 24px 0 16px;">
        — OR —
      </p>
      
      <!-- Option 2: Verification Code -->
      <p style="color: #a0a0a0; font-size: 14px; margin: 0 0 12px;">
        Enter this code on the website:
      </p>
      <div style="background: #1a1a1a; border: 2px solid #00e676; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #00e676;">${code}</span>
      </div>
      
      <p style="color: #606060; font-size: 12px; margin: 0;">
        This code expires in 24 hours.
      </p>
    </div>
    
    <!-- Footer with Unsubscribe -->
    <div style="text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #333;">
      <p style="color: #606060; font-size: 12px; margin: 0;">
        If you didn't request this, you can safely ignore this email.
      </p>
      <p style="color: #404040; font-size: 12px; margin: 16px 0 0;">
        © ${new Date().getFullYear()} GreenLine365. All rights reserved.
      </p>
      <p style="color: #404040; font-size: 11px; margin: 16px 0 0;">
        <a href="${unsubscribeUrl}" style="color: #606060; text-decoration: underline;">Unsubscribe</a>
        &nbsp;|&nbsp;
        <a href="${SITE_URL}/privacy" style="color: #606060; text-decoration: underline;">Privacy Policy</a>
      </p>
      <p style="color: #333; font-size: 10px; margin: 12px 0 0;">
        GreenLine365 • Tampa, FL
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}
