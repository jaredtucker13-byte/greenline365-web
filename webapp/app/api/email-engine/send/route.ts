/**
 * Email Engine — Send & Track
 * POST /api/email-engine/send
 *
 * Accepts full email package { to, subject, htmlBody, images, qrCode, trackEngagement }
 * Assembles final HTML email with GreenLine365 branded template
 * Embeds rating widget (thumbs up/down links to /api/email-engine/feedback)
 * Sends via existing email infrastructure (Gmail SMTP)
 * Logs to Supabase email_sends table
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/email/gmail-sender';
import { requireAuth } from '@/lib/api-auth';
import { randomUUID } from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function assembleHtml(options: {
  subject: string;
  htmlBody: string;
  recipientEmail: string;
  images: string[];
  qrCode: string | null;
  trackEngagement: boolean;
  emailId: string;
}): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://greenline365.com';
  const { subject, htmlBody, recipientEmail, images, qrCode, trackEngagement, emailId } = options;

  // Convert plain text body to HTML paragraphs if needed
  const bodyHtml = htmlBody.includes('<')
    ? htmlBody
    : htmlBody
        .split('\n\n')
        .map(p => p.trim())
        .filter(Boolean)
        .map(p => `<p style="color:#a0a0a0;font-size:15px;line-height:1.7;margin:0 0 16px;">${p.replace(/\n/g, '<br>')}</p>`)
        .join('\n    ');

  // Build optional image blocks
  const imageBlocks = images
    .map(url => `<div style="margin:16px 0;text-align:center;"><img src="${url}" alt="Attachment" style="max-width:100%;border-radius:8px;border:1px solid #333;" /></div>`)
    .join('\n');

  // Build optional QR code block
  const qrBlock = qrCode
    ? `<div style="text-align:center;margin:20px 0;">
        <p style="color:#666;font-size:12px;margin:0 0 8px;">Scan for more info</p>
        <img src="${qrCode}" alt="QR Code" style="width:120px;height:120px;" />
       </div>`
    : '';

  // Build optional rating widget
  const ratingWidget = trackEngagement
    ? `<div style="text-align:center;margin:24px 0 0;padding:16px 0;border-top:1px solid #333;">
        <p style="color:#666;font-size:12px;margin:0 0 8px;">Was this email helpful?</p>
        <a href="${siteUrl}/api/email-engine/feedback?emailId=${emailId}&rating=up&tenantId=${encodeURIComponent(recipientEmail)}" style="display:inline-block;padding:8px 16px;margin:0 4px;background:#1a3a1a;border:1px solid #2a5a2a;border-radius:8px;color:#4ade80;text-decoration:none;font-size:18px;" title="Helpful">&#128077;</a>
        <a href="${siteUrl}/api/email-engine/feedback?emailId=${emailId}&rating=down&tenantId=${encodeURIComponent(recipientEmail)}" style="display:inline-block;padding:8px 16px;margin:0 4px;background:#3a1a1a;border:1px solid #5a2a2a;border-radius:8px;color:#f87171;text-decoration:none;font-size:18px;" title="Not helpful">&#128078;</a>
       </div>`
    : '';

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#0a0a0a;">
<div style="max-width:600px;margin:0 auto;padding:40px 20px;">
  <div style="text-align:center;margin-bottom:24px;">
    <h1 style="color:#C9A96E;font-size:24px;margin:0;">GreenLine<span style="color:#fff;">365</span></h1>
    <p style="color:#666;font-size:12px;margin:4px 0 0;">Florida's Gold Standard Business Directory</p>
  </div>
  <div style="background:#1a1a1a;border:1px solid #C9A96E30;border-radius:16px;padding:32px;">
    <h2 style="color:#fff;font-size:20px;margin:0 0 16px;">${subject}</h2>
    ${bodyHtml}
    ${imageBlocks}
    ${qrBlock}
    ${ratingWidget}
  </div>
  <div style="text-align:center;margin-top:16px;padding:12px;background:rgba(255,193,7,0.08);border:1px solid rgba(255,193,7,0.2);border-radius:8px;">
    <p style="color:#ffc107;font-size:12px;font-weight:600;margin:0 0 4px;">Don't see this email in your inbox?</p>
    <p style="color:#888;font-size:11px;margin:0;">Check your spam folder. Emails from GreenLine365help@gmail.com may be filtered automatically.</p>
  </div>
  <div style="text-align:center;margin-top:24px;">
    <p style="color:#444;font-size:11px;">GreenLine365 &middot; Tampa, FL &middot; Florida Business Directory</p>
    <p style="color:#333;font-size:10px;margin:4px 0 0;">
      &copy; ${new Date().getFullYear()} GreenLine365. All rights reserved.<br>
      <a href="${siteUrl}/unsubscribe?email=${encodeURIComponent(recipientEmail)}" style="color:#555;text-decoration:underline;">Unsubscribe</a>
    </p>
  </div>
</div>
</body></html>`;
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const { to, subject, htmlBody, images, qrCode, trackEngagement } = await request.json();

    if (!to || !subject || !htmlBody) {
      return NextResponse.json({ error: 'Missing required fields: to, subject, htmlBody' }, { status: 400 });
    }

    const emailId = randomUUID();

    const html = assembleHtml({
      subject,
      htmlBody,
      recipientEmail: to,
      images: images || [],
      qrCode: qrCode || null,
      trackEngagement: trackEngagement ?? true,
      emailId,
    });

    const result = await sendEmail({ to, subject, html });

    // Log to email_sends
    try {
      await supabase.from('email_sends').insert({
        id: emailId,
        campaign_id: null,
        recipient_email: to,
        recipient_name: to,
        status: result.success ? 'sent' : 'failed',
        error_message: result.error || null,
        sent_at: result.success ? new Date().toISOString() : null,
        metadata: { type: 'email-engine', subject, trackEngagement, imageCount: (images || []).length, hasQR: !!qrCode },
      });
    } catch (_) { /* non-critical */ }

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, emailId });
  } catch (error: any) {
    console.error('[Email Engine Send] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
