/**
 * Campaign Send API
 * POST /api/campaigns/[id]/send
 * 
 * Sends the current sequence step to all contacts at the appropriate stage.
 * Uses Gmail SMTP (nodemailer) for sending.
 * Tracks sends in email_sends table.
 * Updates contact pipeline stage to 'contacted' after send.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/email/gmail-sender';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Default outreach email template
function getOutreachHtml(contact: any, step: any, siteUrl: string): string {
  const businessName = contact.business_name || 'your business';
  const listingUrl = contact.listing_id
    ? `${siteUrl}/listing/${contact.listing_id}`
    : `${siteUrl}/directory`;

  if (step.type === 'initial_outreach') {
    return `
<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#0a0a0a;">
<div style="max-width:600px;margin:0 auto;padding:40px 20px;">
  <div style="text-align:center;margin-bottom:24px;">
    <h1 style="color:#C9A96E;font-size:24px;margin:0;">GreenLine<span style="color:#fff;">365</span></h1>
    <p style="color:#666;font-size:12px;margin:4px 0 0;">Florida's Gold Standard Business Directory</p>
  </div>
  <div style="background:#1a1a1a;border:1px solid #C9A96E30;border-radius:16px;padding:32px;">
    <h2 style="color:#fff;font-size:20px;margin:0 0 16px;">Your business is live on GreenLine365</h2>
    <p style="color:#a0a0a0;font-size:15px;line-height:1.7;margin:0 0 16px;">
      Hi there,
    </p>
    <p style="color:#a0a0a0;font-size:15px;line-height:1.7;margin:0 0 16px;">
      <strong style="color:#C9A96E;">${businessName}</strong> has been added to GreenLine365 — Florida's premium verified business directory.
    </p>
    <p style="color:#a0a0a0;font-size:15px;line-height:1.7;margin:0 0 24px;">
      Your listing is live and visible to consumers searching for services in your area. You can claim it to update your information, add photos, and unlock premium features.
    </p>
    <div style="text-align:center;margin:24px 0;">
      <a href="${listingUrl}" style="display:inline-block;background:linear-gradient(135deg,#C9A96E,#E6D8B5);color:#000;font-weight:700;font-size:15px;padding:14px 36px;border-radius:10px;text-decoration:none;">
        View Your Listing
      </a>
    </div>
    <p style="color:#666;font-size:13px;margin:24px 0 0;text-align:center;">
      Questions? Reply to this email — we read every message.
    </p>
  </div>
  <div style="text-align:center;margin-top:24px;">
    <p style="color:#444;font-size:11px;">GreenLine365 &middot; Florida Business Directory</p>
    <p style="color:#333;font-size:10px;margin:4px 0 0;">
      <a href="${siteUrl}/unsubscribe?email=${encodeURIComponent(contact.email)}" style="color:#555;text-decoration:underline;">Unsubscribe</a>
    </p>
  </div>
</div>
</body></html>`.trim();
  }

  if (step.type === 'value_bomb') {
    const screenshotUrl = contact.metadata?.after_hours_screenshot_url;
    return `
<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#0a0a0a;">
<div style="max-width:600px;margin:0 auto;padding:40px 20px;">
  <div style="text-align:center;margin-bottom:24px;">
    <h1 style="color:#C9A96E;font-size:24px;margin:0;">GreenLine<span style="color:#fff;">365</span></h1>
  </div>
  <div style="background:#1a1a1a;border:1px solid #C9A96E30;border-radius:16px;padding:32px;">
    <h2 style="color:#fff;font-size:20px;margin:0 0 16px;">We ran a free audit for ${businessName}</h2>
    <p style="color:#a0a0a0;font-size:15px;line-height:1.7;margin:0 0 16px;">
      Our team analyzed <strong style="color:#C9A96E;">${businessName}</strong>'s online presence and found some opportunities you might want to know about.
    </p>
    ${screenshotUrl ? `
    <div style="margin:20px 0;border:1px solid #333;border-radius:8px;overflow:hidden;">
      <img src="${screenshotUrl}" alt="Google Maps showing your business" style="width:100%;display:block;" />
      <p style="color:#FF6B6B;font-size:13px;padding:12px;margin:0;background:#1a0a0a;text-align:center;">
        Your Google listing shows "Closed" during after-hours — you're missing calls.
      </p>
    </div>` : ''}
    <p style="color:#a0a0a0;font-size:15px;line-height:1.7;margin:16px 0 24px;">
      We'd love to share the full report. Just reply to this email and we'll send it over — completely free, no strings attached.
    </p>
    <div style="text-align:center;margin:24px 0;">
      <a href="mailto:${process.env.GMAIL_USER || 'greenline365help@gmail.com'}?subject=Send me the audit for ${encodeURIComponent(businessName)}" style="display:inline-block;background:linear-gradient(135deg,#C9A96E,#E6D8B5);color:#000;font-weight:700;font-size:15px;padding:14px 36px;border-radius:10px;text-decoration:none;">
        Get My Free Audit
      </a>
    </div>
  </div>
  <div style="text-align:center;margin-top:24px;">
    <p style="color:#444;font-size:11px;">GreenLine365 &middot; Florida Business Directory</p>
    <p style="color:#333;font-size:10px;margin:4px 0 0;">
      <a href="${siteUrl}/unsubscribe?email=${encodeURIComponent(contact.email)}" style="color:#555;text-decoration:underline;">Unsubscribe</a>
    </p>
  </div>
</div>
</body></html>`.trim();
  }

  if (step.type === 'demo_invite') {
    return `
<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#0a0a0a;">
<div style="max-width:600px;margin:0 auto;padding:40px 20px;">
  <div style="text-align:center;margin-bottom:24px;">
    <h1 style="color:#C9A96E;font-size:24px;margin:0;">GreenLine<span style="color:#fff;">365</span></h1>
  </div>
  <div style="background:#1a1a1a;border:1px solid #C9A96E30;border-radius:16px;padding:32px;">
    <h2 style="color:#fff;font-size:20px;margin:0 0 16px;">Try our AI receptionist — live right now</h2>
    <p style="color:#a0a0a0;font-size:15px;line-height:1.7;margin:0 0 16px;">
      What if ${businessName} never missed another call — even at 2 AM?
    </p>
    <p style="color:#a0a0a0;font-size:15px;line-height:1.7;margin:0 0 16px;">
      Our AI receptionist answers calls, books appointments, and handles inquiries 24/7. Try it yourself:
    </p>
    <div style="background:#0a0a0a;border:1px solid #C9A96E50;border-radius:12px;padding:20px;text-align:center;margin:20px 0;">
      <p style="color:#C9A96E;font-size:13px;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px;">Call for a live demo</p>
      <p style="color:#fff;font-size:28px;font-weight:700;margin:0;">{{demo_phone_number}}</p>
    </div>
    <p style="color:#a0a0a0;font-size:15px;line-height:1.7;margin:16px 0 0;">
      Or reply to this email — happy to walk you through what it can do for ${businessName}.
    </p>
  </div>
  <div style="text-align:center;margin-top:24px;">
    <p style="color:#444;font-size:11px;">GreenLine365 &middot; Florida Business Directory</p>
    <p style="color:#333;font-size:10px;margin:4px 0 0;">
      <a href="${siteUrl}/unsubscribe?email=${encodeURIComponent(contact.email)}" style="color:#555;text-decoration:underline;">Unsubscribe</a>
    </p>
  </div>
</div>
</body></html>`.trim();
  }

  // Generic follow-up
  return `
<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#0a0a0a;">
<div style="max-width:600px;margin:0 auto;padding:40px 20px;">
  <div style="text-align:center;margin-bottom:24px;">
    <h1 style="color:#C9A96E;font-size:24px;margin:0;">GreenLine<span style="color:#fff;">365</span></h1>
  </div>
  <div style="background:#1a1a1a;border:1px solid #C9A96E30;border-radius:16px;padding:32px;">
    <h2 style="color:#fff;font-size:20px;margin:0 0 16px;">${step.subject || 'Following up'}</h2>
    <p style="color:#a0a0a0;font-size:15px;line-height:1.7;margin:0 0 16px;">
      Just checking in about <strong style="color:#C9A96E;">${businessName}</strong>'s listing on GreenLine365.
    </p>
    <p style="color:#a0a0a0;font-size:15px;line-height:1.7;margin:0 0 24px;">
      Reply to this email if you'd like to claim your listing or learn more about our verified business features.
    </p>
    <div style="text-align:center;">
      <a href="${listingUrl}" style="display:inline-block;background:linear-gradient(135deg,#C9A96E,#E6D8B5);color:#000;font-weight:700;font-size:15px;padding:14px 36px;border-radius:10px;text-decoration:none;">
        View Your Listing
      </a>
    </div>
  </div>
  <div style="text-align:center;margin-top:24px;">
    <p style="color:#444;font-size:11px;">GreenLine365 &middot; Florida Business Directory</p>
    <p style="color:#333;font-size:10px;margin:4px 0 0;">
      <a href="${siteUrl}/unsubscribe?email=${encodeURIComponent(contact.email)}" style="color:#555;text-decoration:underline;">Unsubscribe</a>
    </p>
  </div>
</div>
</body></html>`.trim();
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { step_number, test_email, limit } = body;

    // Fetch campaign
    const { data: campaign, error: fetchError } = await supabase
      .from('email_campaigns')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    const meta = campaign.custom_recipients || {};
    const sequence = meta.sequence || [];
    const contacts = meta.contacts || [];

    // Find the step to send
    const stepIdx = step_number ? step_number - 1 : 0;
    const step = sequence[stepIdx];
    if (!step) {
      return NextResponse.json({ error: `Step ${step_number || 1} not found in sequence` }, { status: 400 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://greenline365.com';

    // If test_email is provided, send only to that email (for previewing)
    if (test_email) {
      const testContact = { email: test_email, business_name: 'Test Business', listing_id: null, metadata: {} };
      const html = getOutreachHtml(testContact, step, siteUrl);
      const subject = (step.subject || 'GreenLine365').replace(/{{business_name}}/g, 'Test Business');
      const result = await sendEmail({ to: test_email, subject, html });

      return NextResponse.json({
        success: result.success,
        test: true,
        error: result.error,
        step: step.step,
        recipient: test_email,
      });
    }

    // Send to real contacts — only those at appropriate pipeline stage
    const targetStage = stepIdx === 0 ? 'new' : 'contacted';
    const eligibleContacts = contacts.filter((c: any) => c.pipeline_stage === targetStage);
    const sendLimit = limit || eligibleContacts.length;
    const toSend = eligibleContacts.slice(0, sendLimit);

    if (toSend.length === 0) {
      return NextResponse.json({ error: `No contacts at stage "${targetStage}" to send to`, sent: 0 }, { status: 400 });
    }

    let sent = 0;
    let failed = 0;
    const results: any[] = [];

    for (const contact of toSend) {
      const html = getOutreachHtml(contact, step, siteUrl);
      const subject = (step.subject || 'GreenLine365')
        .replace(/{{business_name}}/g, contact.business_name || 'your business');

      const result = await sendEmail({ to: contact.email, subject, html });

      // Log in email_sends
      await supabase.from('email_sends').insert({
        campaign_id: id,
        recipient_email: contact.email,
        recipient_name: contact.business_name,
        status: result.success ? 'sent' : 'failed',
        error_message: result.error || null,
        sent_at: result.success ? new Date().toISOString() : null,
      }).catch(() => {});

      if (result.success) {
        sent++;
      } else {
        failed++;
      }
      results.push({ email: contact.email, business: contact.business_name, success: result.success, error: result.error });

      // Small delay between sends to avoid rate limits
      await new Promise(r => setTimeout(r, 200));
    }

    // Update contacts pipeline stage to 'contacted' for successful sends
    const updatedContacts = contacts.map((c: any) => {
      const wasInBatch = results.find((r: any) => r.email === c.email && r.success);
      if (wasInBatch) {
        return { ...c, pipeline_stage: 'contacted', current_step: step.step, last_sent_at: new Date().toISOString() };
      }
      return c;
    });

    // Update campaign
    await supabase.from('email_campaigns').update({
      custom_recipients: { ...meta, contacts: updatedContacts },
      emails_sent: (campaign.emails_sent || 0) + sent,
      status: campaign.status === 'draft' ? 'active' : campaign.status,
      updated_at: new Date().toISOString(),
    }).eq('id', id);

    return NextResponse.json({
      success: sent > 0,
      sent,
      failed,
      total: toSend.length,
      step: step.step,
      step_type: step.type,
      results,
    });
  } catch (error: any) {
    console.error('Campaign send error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
