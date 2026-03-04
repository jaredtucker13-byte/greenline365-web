/**
 * Compose Email API
 * POST /api/email/compose
 *
 * Sends a standalone composed email wrapped in the GreenLine365
 * gold-branded HTML template. Logs the send to the email_sends table.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/email/gmail-sender';
import { requireAuth } from '@/lib/api-auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function wrapInBrandedTemplate(subject: string, body: string, recipientEmail: string, isHtml = false): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://greenline365.com';
  const bodyHtml = isHtml
    ? `<div style="color:#a0a0a0;font-size:15px;line-height:1.7;">${body}</div>`
    : body
      .split('\n\n')
      .map(p => p.trim())
      .filter(Boolean)
      .map(p => `<p style="color:#a0a0a0;font-size:15px;line-height:1.7;margin:0 0 16px;">${p.replace(/\n/g, '<br>')}</p>`)
      .join('\n    ');

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
    const { to, subject, body, html_body } = await request.json();

    if (!to || !subject || (!body && !html_body)) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: to, subject, body' },
        { status: 400 }
      );
    }

    // Use rich HTML body from TipTap editor if provided, otherwise fall back to plain text wrapper
    const html = html_body
      ? wrapInBrandedTemplate(subject, html_body, to, true)
      : wrapInBrandedTemplate(subject, body, to);
    const result = await sendEmail({ to, subject, html });

    // Log to email_sends table
    try {
      await supabase.from('email_sends').insert({
        campaign_id: null,
        recipient_email: to,
        recipient_name: to,
        status: result.success ? 'sent' : 'failed',
        error_message: result.error || null,
        sent_at: result.success ? new Date().toISOString() : null,
        metadata: { type: 'compose', subject },
      });
    } catch (_) {
      /* non-critical logging */
    }

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to send email' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Compose Email] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
