/**
 * Email Engine — Feedback
 * GET /api/email-engine/feedback
 *
 * Accepts { emailId, rating, tenantId } as query params
 * Writes feedback to Supabase
 * Returns a simple "Thank you" HTML page
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const emailId = searchParams.get('emailId');
  const rating = searchParams.get('rating');
  const tenantId = searchParams.get('tenantId');

  // Write feedback to Supabase (best-effort)
  if (emailId && rating) {
    try {
      await supabase.from('email_feedback').insert({
        email_id: emailId,
        rating,
        tenant_id: tenantId || null,
        created_at: new Date().toISOString(),
      });
    } catch (err) {
      console.error('[Email Engine Feedback] Failed to write:', err);
    }
  }

  const isPositive = rating === 'up';
  const emoji = isPositive ? '&#128077;' : '&#128078;';
  const message = isPositive ? 'Glad it was helpful!' : 'Thanks for the feedback — we\'ll do better.';

  // Return simple thank you page
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Thank You</title></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#0a0a0a;display:flex;align-items:center;justify-content:center;min-height:100vh;">
<div style="text-align:center;padding:40px;">
  <h1 style="color:#C9A96E;font-size:24px;margin:0 0 16px;">GreenLine<span style="color:#fff;">365</span></h1>
  <div style="background:#1a1a1a;border:1px solid #C9A96E30;border-radius:16px;padding:40px;max-width:400px;">
    <p style="font-size:48px;margin:0 0 16px;">${emoji}</p>
    <h2 style="color:#fff;font-size:20px;margin:0 0 8px;">Thank You!</h2>
    <p style="color:#a0a0a0;font-size:15px;margin:0;">${message}</p>
  </div>
</div>
</body></html>`;

  return new NextResponse(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html' },
  });
}
