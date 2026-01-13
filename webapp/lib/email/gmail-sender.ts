/**
 * Gmail SMTP Email Sender
 * 
 * Uses Gmail SMTP with App Password for sending verification emails.
 * Free tier: 500 emails/day
 * 
 * Required env vars:
 * - GMAIL_USER: greenline365help@gmail.com
 * - GMAIL_APP_PASSWORD: 16-char app password from Google
 */

import nodemailer from 'nodemailer';

const GMAIL_USER = process.env.GMAIL_USER || 'greenline365help@gmail.com';
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;

// Create reusable transporter
const createTransporter = () => {
  if (!GMAIL_APP_PASSWORD) {
    console.warn('[Email] GMAIL_APP_PASSWORD not set - emails will not be sent');
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: GMAIL_USER,
      pass: GMAIL_APP_PASSWORD,
    },
  });
};

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
  const transporter = createTransporter();
  
  if (!transporter) {
    console.error('[Email] Cannot send email - transporter not configured');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const info = await transporter.sendMail({
      from: `"GreenLine365" <${GMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''),
    });

    console.log('[Email] Sent successfully:', info.messageId);
    return { success: true };
  } catch (error: any) {
    console.error('[Email] Send failed:', error.message);
    return { success: false, error: error.message };
  }
}

// Generate a random verification token
export function generateVerificationToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// Email templates
export function getVerificationEmailHtml(name: string, verificationUrl: string, source: string): string {
  const sourceLabel = {
    waitlist: 'Waitlist',
    newsletter: 'Newsletter',
    crm: 'Contact',
    demo: 'Demo Request',
  }[source] || 'Registration';

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
      
      <!-- CTA Button -->
      <a href="${verificationUrl}" style="display: inline-block; background: #00e676; color: #000000; font-weight: 700; font-size: 16px; padding: 16px 48px; border-radius: 12px; text-decoration: none; margin-bottom: 24px;">
        Verify My Email →
      </a>
      
      <p style="color: #606060; font-size: 14px; margin: 24px 0 0;">
        Or copy this link:<br>
        <span style="color: #00e676; word-break: break-all;">${verificationUrl}</span>
      </p>
    </div>
    
    <!-- Footer -->
    <div style="text-align: center; margin-top: 32px;">
      <p style="color: #606060; font-size: 12px; margin: 0;">
        This link expires in 24 hours.<br>
        If you didn't request this, you can safely ignore this email.
      </p>
      <p style="color: #404040; font-size: 12px; margin: 16px 0 0;">
        © ${new Date().getFullYear()} GreenLine365. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export function getVerificationSuccessHtml(): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0a0a;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="text-align: center; margin-bottom: 32px;">
      <h1 style="color: #00e676; font-size: 28px; margin: 0;">
        GreenLine<span style="color: #ffffff;">365</span>
      </h1>
    </div>
    
    <div style="background: linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%); border: 1px solid #00e676; border-radius: 16px; padding: 40px; text-align: center;">
      <div style="width: 80px; height: 80px; background: rgba(0, 230, 118, 0.2); border-radius: 50%; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center;">
        <span style="font-size: 40px;">✅</span>
      </div>
      
      <h2 style="color: #ffffff; font-size: 28px; margin: 0 0 16px;">
        Email Verified!
      </h2>
      
      <p style="color: #a0a0a0; font-size: 16px; line-height: 1.6; margin: 0 0 32px;">
        Thank you for verifying your email. You're all set!
      </p>
      
      <a href="/" style="display: inline-block; background: #00e676; color: #000000; font-weight: 700; font-size: 16px; padding: 16px 48px; border-radius: 12px; text-decoration: none;">
        Visit GreenLine365 →
      </a>
    </div>
  </div>
</body>
</html>
  `.trim();
}
