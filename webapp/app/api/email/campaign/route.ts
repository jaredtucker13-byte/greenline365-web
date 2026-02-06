import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const sendgridKey = process.env.SENDGRID_API_KEY!;
const gmailUser = process.env.GMAIL_USER!;
const gmailAppPassword = process.env.GMAIL_APP_PASSWORD!;

function getServiceClient() { return createClient(supabaseUrl, supabaseServiceKey); }

// Gmail SMTP transporter (for Email 1 — warmed account)
function getGmailTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user: gmailUser, pass: gmailAppPassword },
  });
}

// Send via Gmail (Email 1 — no links, reply only)
async function sendViaGmail(to: string, subject: string, html: string) {
  const transporter = getGmailTransporter();
  await transporter.sendMail({
    from: `"Jared at GL365" <${gmailUser}>`,
    to,
    subject,
    html,
    replyTo: 'reply@reply.greenline365.com',
  });
}

// Send via SendGrid (Email 2+ — has links)
async function sendViaSendGrid(to: string, subject: string, html: string) {
  await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sendgridKey}` },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }], subject }],
      from: { email: 'greenline365help@gmail.com', name: 'GreenLine365' },
      reply_to: { email: 'reply@reply.greenline365.com', name: 'GL365 Directory' },
      content: [{ type: 'text/html', value: html }],
    }),
  });
}

// Email 1: Confirm info (NO links, reply "STOP" to opt out)
function buildEmail1(businessName: string, industry: string, city: string, state: string, phone: string, email: string, website: string): string {
  return `<div style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;max-width:540px;margin:0 auto;color:#333;"><p style="font-size:15px;margin:0 0 14px;">Hi there,</p><p style="font-size:14px;color:#555;line-height:1.7;margin:0 0 20px;">My name is Jared with GL365. We're building the Tampa Bay area's first badge-verified business directory, and we've added your business to our database.</p><p style="font-size:14px;color:#555;line-height:1.7;margin:0 0 20px;">Before your profile goes live, I wanted to make sure we have the right info:</p><table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e5e5;border-radius:8px;overflow:hidden;margin:0 0 20px;"><tr style="background:#f8f8f8;"><td style="padding:10px 16px;font-size:11px;color:#999;text-transform:uppercase;letter-spacing:1px;font-weight:600;" colspan="2">Your Business</td></tr><tr><td style="padding:8px 16px;color:#999;font-size:13px;width:100px;border-bottom:1px solid #f0f0f0;">Name</td><td style="padding:8px 16px;color:#111;font-size:14px;font-weight:600;border-bottom:1px solid #f0f0f0;">${businessName}</td></tr><tr><td style="padding:8px 16px;color:#999;font-size:13px;border-bottom:1px solid #f0f0f0;">Type</td><td style="padding:8px 16px;color:#111;font-size:14px;border-bottom:1px solid #f0f0f0;">${industry}</td></tr>${city ? `<tr><td style="padding:8px 16px;color:#999;font-size:13px;border-bottom:1px solid #f0f0f0;">Location</td><td style="padding:8px 16px;color:#111;font-size:14px;border-bottom:1px solid #f0f0f0;">${city}${state ? ', ' + state : ''}</td></tr>` : ''}${phone ? `<tr><td style="padding:8px 16px;color:#999;font-size:13px;border-bottom:1px solid #f0f0f0;">Phone</td><td style="padding:8px 16px;color:#111;font-size:14px;border-bottom:1px solid #f0f0f0;">${phone}</td></tr>` : ''}<tr><td style="padding:8px 16px;color:#999;font-size:13px;border-bottom:1px solid #f0f0f0;">Email</td><td style="padding:8px 16px;color:#111;font-size:14px;border-bottom:1px solid #f0f0f0;">${email}</td></tr>${website ? `<tr><td style="padding:8px 16px;color:#999;font-size:13px;">Website</td><td style="padding:8px 16px;color:#111;font-size:14px;">${website.replace('https://','').replace('http://','')}</td></tr>` : ''}</table><p style="font-size:14px;color:#555;line-height:1.7;margin:0 0 6px;">Can you reply with one of the following?</p><ul style="font-size:14px;color:#555;line-height:1.8;padding-left:20px;margin:0 0 20px;"><li><strong>"Looks good"</strong> — if everything is correct</li><li>Any corrections you'd like us to make</li><li><strong>"STOP"</strong> — if you'd like us to remove your listing</li></ul><p style="font-size:14px;color:#555;line-height:1.7;margin:0 0 4px;">Thanks,</p><p style="font-size:14px;color:#111;font-weight:600;margin:0;">Jared Tucker</p><p style="font-size:12px;color:#999;margin:4px 0 0;">GL365 Directory Team</p></div>`;
}

// Email 1b: 72-hour follow-up (still no links)
function buildEmail1b(businessName: string): string {
  return `<div style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;max-width:540px;margin:0 auto;color:#333;"><p style="font-size:15px;margin:0 0 14px;">Hi again,</p><p style="font-size:14px;color:#555;line-height:1.7;margin:0 0 18px;">Just a quick follow-up — I sent over the listing info for <strong>${businessName}</strong> a few days ago and wanted to make sure you saw it.</p><p style="font-size:14px;color:#555;line-height:1.7;margin:0 0 18px;">If everything looked right, just reply <strong>"Looks good"</strong> and we'll get your profile live. If anything needs to change, let me know and I'll fix it.</p><p style="font-size:14px;color:#555;line-height:1.7;margin:0 0 18px;">If you'd rather not be listed, just reply <strong>"STOP"</strong> and I'll remove it right away.</p><p style="font-size:14px;color:#555;line-height:1.7;margin:0 0 4px;">Best,</p><p style="font-size:14px;color:#111;font-weight:600;margin:0;">Jared</p><p style="font-size:12px;color:#999;margin:4px 0 0;">GL365 Directory Team</p></div>`;
}

// POST /api/email/campaign
export async function POST(request: NextRequest) {
  const supabase = getServiceClient();
  const body = await request.json();
  const { action, test_email, limit } = body;

  // Send test to personal email
  if (action === 'send_test') {
    const html = buildEmail1('Test Business', 'General Services', 'Tampa', 'FL', '(813) 555-0000', test_email, 'testbusiness.com');
    try {
      await sendViaGmail(test_email, 'Quick question — is this info correct?', html);
      return NextResponse.json({ sent: true, via: 'gmail' });
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
  }

  // Send Email 1 to new leads (via Gmail)
  if (action === 'send_initial') {
    const { data: leads } = await supabase
      .from('crm_leads')
      .select('id, email, name, company, tags, notes')
      .eq('status', 'new')
      .eq('source', 'gl365_directory')
      .not('tags', 'cs', '{"email_1_sent"}')
      .not('tags', 'cs', '{"unsubscribed"}')
      .limit(limit || 20);

    if (!leads?.length) return NextResponse.json({ sent: 0, message: 'No new leads' });

    let sent = 0, failed = 0;
    for (const lead of leads) {
      const domain = lead.email.split('@')[1];
      const { data: listing } = await supabase
        .from('directory_listings')
        .select('business_name, industry, city, state, phone, email, website')
        .or(`email.eq.${lead.email},website.ilike.%${domain}%`)
        .maybeSingle();

      const info = listing || { business_name: lead.company || lead.name, industry: 'general', city: 'Tampa', state: 'FL', phone: '', email: lead.email, website: '' };

      try {
        await sendViaGmail(lead.email, 'Quick question — is this info correct?', buildEmail1(info.business_name, info.industry, info.city || '', info.state || '', info.phone || '', lead.email, info.website || ''));
        sent++;
        await supabase.from('crm_leads').update({
          tags: [...new Set([...(lead.tags || []), 'email_1_sent'])],
          last_contact_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }).eq('id', lead.id);
      } catch {
        failed++;
      }
      await new Promise(r => setTimeout(r, 2000)); // Gmail rate limit: ~30/min
    }

    return NextResponse.json({ sent, failed, total: leads.length, via: 'gmail' });
  }

  // Send follow-up to non-responders after 72 hours (via Gmail)
  if (action === 'send_followup') {
    const cutoff = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();
    const { data: leads } = await supabase
      .from('crm_leads')
      .select('id, email, name, company, tags')
      .eq('source', 'gl365_directory')
      .contains('tags', ['email_1_sent'])
      .not('tags', 'cs', '{"email_replied"}')
      .not('tags', 'cs', '{"email_1b_sent"}')
      .not('tags', 'cs', '{"unsubscribed"}')
      .lt('last_contact_at', cutoff)
      .limit(limit || 20);

    if (!leads?.length) return NextResponse.json({ sent: 0, message: 'No leads need follow-up' });

    let sent = 0, failed = 0;
    for (const lead of leads) {
      try {
        await sendViaGmail(lead.email, `Following up — ${lead.company || 'your business'} on GL365`, buildEmail1b(lead.company || lead.name || 'your business'));
        sent++;
        await supabase.from('crm_leads').update({
          tags: [...new Set([...(lead.tags || []), 'email_1b_sent'])],
          updated_at: new Date().toISOString(),
        }).eq('id', lead.id);
      } catch {
        failed++;
      }
      await new Promise(r => setTimeout(r, 2000));
    }

    return NextResponse.json({ sent, failed, total: leads.length, via: 'gmail' });
  }

  return NextResponse.json({ error: 'Invalid action. Use: send_test, send_initial, send_followup' }, { status: 400 });
}

// GET /api/email/campaign - Campaign status
export async function GET(request: NextRequest) {
  const supabase = getServiceClient();

  const [total, emailed, followedUp, replied, verified, unsubscribed] = await Promise.all([
    supabase.from('crm_leads').select('id', { count: 'exact' }).eq('source', 'gl365_directory'),
    supabase.from('crm_leads').select('id', { count: 'exact' }).eq('source', 'gl365_directory').contains('tags', ['email_1_sent']),
    supabase.from('crm_leads').select('id', { count: 'exact' }).eq('source', 'gl365_directory').contains('tags', ['email_1b_sent']),
    supabase.from('crm_leads').select('id', { count: 'exact' }).eq('source', 'gl365_directory').contains('tags', ['email_replied']),
    supabase.from('crm_leads').select('id', { count: 'exact' }).eq('source', 'gl365_directory').eq('status', 'verified'),
    supabase.from('crm_leads').select('id', { count: 'exact' }).eq('source', 'gl365_directory').contains('tags', ['unsubscribed']),
  ]);

  return NextResponse.json({
    total_leads: total.count || 0,
    email_1_sent: emailed.count || 0,
    follow_up_sent: followedUp.count || 0,
    replied: replied.count || 0,
    verified: verified.count || 0,
    unsubscribed: unsubscribed.count || 0,
    not_yet_emailed: (total.count || 0) - (emailed.count || 0),
  });
}
