import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const sendgridKey = process.env.SENDGRID_API_KEY!;

function getServiceClient() { return createClient(supabaseUrl, supabaseServiceKey); }

// Email 1: Initial confirmation request (no links)
function buildEmail1(businessName: string, industry: string, city: string, state: string, phone: string, email: string, website: string): string {
  return `<div style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;max-width:540px;margin:0 auto;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0d0d;border-radius:10px 10px 0 0;"><tr><td style="padding:22px 28px;"><span style="color:#39FF14;font-weight:800;font-size:20px;letter-spacing:-0.5px;">Green</span><span style="color:#ffffff;font-weight:800;font-size:20px;">Line365</span></td><td style="text-align:right;padding:22px 28px;"><span style="color:#555;font-size:11px;">Tampa Bay Directory</span></td></tr></table><div style="padding:30px 28px;background:#ffffff;"><p style="font-size:16px;font-weight:600;color:#111;margin:0 0 14px;">Hi there,</p><p style="font-size:14px;color:#555;line-height:1.7;margin:0 0 22px;">We added your business to the GL365 Tampa Bay Directory. Before it goes live, we want to make sure we got everything right.</p><table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8e8e8;border-radius:10px;overflow:hidden;"><tr style="background:#f8f8f8;"><td style="padding:12px 18px;font-size:11px;color:#999;text-transform:uppercase;letter-spacing:1px;font-weight:600;" colspan="2">Your Business Info</td></tr><tr><td style="padding:10px 18px;color:#999;font-size:13px;width:120px;border-bottom:1px solid #f0f0f0;">Name</td><td style="padding:10px 18px;color:#111;font-size:14px;font-weight:600;border-bottom:1px solid #f0f0f0;">${businessName}</td></tr><tr><td style="padding:10px 18px;color:#999;font-size:13px;border-bottom:1px solid #f0f0f0;">Industry</td><td style="padding:10px 18px;color:#111;font-size:14px;border-bottom:1px solid #f0f0f0;">${industry}</td></tr><tr><td style="padding:10px 18px;color:#999;font-size:13px;border-bottom:1px solid #f0f0f0;">Location</td><td style="padding:10px 18px;color:#111;font-size:14px;border-bottom:1px solid #f0f0f0;">${city}${state ? ', ' + state : ''}</td></tr>${phone ? `<tr><td style="padding:10px 18px;color:#999;font-size:13px;border-bottom:1px solid #f0f0f0;">Phone</td><td style="padding:10px 18px;color:#111;font-size:14px;border-bottom:1px solid #f0f0f0;">${phone}</td></tr>` : ''}<tr><td style="padding:10px 18px;color:#999;font-size:13px;border-bottom:1px solid #f0f0f0;">Email</td><td style="padding:10px 18px;color:#111;font-size:14px;border-bottom:1px solid #f0f0f0;">${email}</td></tr>${website ? `<tr><td style="padding:10px 18px;color:#999;font-size:13px;">Website</td><td style="padding:10px 18px;color:#111;font-size:14px;"><a href="https://${website.replace('https://','').replace('http://','')}" style="color:#FF8C00;text-decoration:none;">${website.replace('https://','').replace('http://','')}</a></td></tr>` : ''}</table><div style="background:#f0faf0;border-radius:10px;padding:18px 20px;margin:22px 0;border:1px solid #d4eed4;"><p style="margin:0 0 6px;font-size:14px;font-weight:600;color:#1a7a1a;">Just hit reply:</p><p style="margin:0;font-size:13px;color:#2d8a2d;line-height:1.5;">&quot;<strong>Looks good</strong>&quot; if everything is correct<br/>Or tell us what needs to change</p></div><p style="font-size:12px;color:#aaa;line-height:1.5;margin:0;">No login needed. No account required. Just a quick reply.</p></div><table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0d0d;border-radius:0 0 10px 10px;"><tr><td style="padding:14px 28px;text-align:center;"><span style="color:#444;font-size:11px;">GL365 Directory — Every badge is earned, never bought.</span></td></tr></table></div>`;
}

// Email 1b: 72-hour follow-up (still no links, softer tone)
function buildEmail1b(businessName: string): string {
  return `<div style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;max-width:540px;margin:0 auto;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0d0d;border-radius:10px 10px 0 0;"><tr><td style="padding:22px 28px;"><span style="color:#39FF14;font-weight:800;font-size:20px;">Green</span><span style="color:#ffffff;font-weight:800;font-size:20px;">Line365</span></td></tr></table><div style="padding:30px 28px;background:#ffffff;"><p style="font-size:16px;font-weight:600;color:#111;margin:0 0 14px;">Just checking in</p><p style="font-size:14px;color:#555;line-height:1.7;margin:0 0 18px;">We sent over the listing info for <strong>${businessName}</strong> a few days ago. We want to make sure it&rsquo;s accurate before it goes live in the directory.</p><p style="font-size:14px;color:#555;line-height:1.7;margin:0 0 18px;">If you missed it, no worries &mdash; just reply with:</p><div style="background:#fff8ed;border-radius:10px;padding:16px 20px;margin:0 0 20px;border:1px solid #ffe0a0;"><p style="margin:0;font-size:14px;color:#8a6d00;line-height:1.5;">&quot;<strong>Looks good</strong>&quot; to confirm<br/>Or any corrections you&rsquo;d like us to make</p></div><p style="font-size:12px;color:#aaa;line-height:1.5;margin:0;">We&rsquo;ll take care of the rest. No login, no signup, no hassle.</p></div><table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0d0d;border-radius:0 0 10px 10px;"><tr><td style="padding:14px 28px;text-align:center;"><span style="color:#444;font-size:11px;">GL365 Directory — Tampa Bay</span></td></tr></table></div>`;
}

async function sendEmail(to: string, subject: string, html: string) {
  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sendgridKey}` },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }], subject }],
      from: { email: 'greenline365help@gmail.com', name: 'GL365 Directory' },
      reply_to: { email: 'reply@reply.greenline365.com', name: 'GL365 Directory' },
      content: [{ type: 'text/html', value: html }],
    }),
  });
  return res.status;
}

// POST /api/email/campaign - Send campaign emails
// Actions: "send_initial" (Email 1), "send_followup" (Email 1b to non-responders), "send_test"
export async function POST(request: NextRequest) {
  const supabase = getServiceClient();
  const body = await request.json();
  const { action, test_email, limit } = body;

  if (action === 'send_test') {
    // Send test to a specific email
    const html = buildEmail1('Test Business', 'General', 'Tampa', 'FL', '(813) 555-0000', test_email || 'test@test.com', 'testbusiness.com');
    const status = await sendEmail(test_email, 'Quick question — is this info correct?', html);
    return NextResponse.json({ sent: true, status });
  }

  if (action === 'send_initial') {
    // Send Email 1 to all "new" leads that haven't been emailed yet
    const { data: leads } = await supabase
      .from('crm_leads')
      .select('id, email, name, company, tags, notes')
      .eq('status', 'new')
      .eq('source', 'gl365_directory')
      .not('tags', 'cs', '{"email_1_sent"}')
      .limit(limit || 50);

    if (!leads || leads.length === 0) {
      return NextResponse.json({ sent: 0, message: 'No new leads to email' });
    }

    let sent = 0, failed = 0;
    for (const lead of leads) {
      // Get matching directory listing for full info
      const domain = lead.email.split('@')[1];
      const { data: listing } = await supabase
        .from('directory_listings')
        .select('business_name, industry, city, state, phone, email, website')
        .or(`email.eq.${lead.email},website.ilike.%${domain}%`)
        .maybeSingle();

      const info = listing || { business_name: lead.company || lead.name, industry: 'General', city: 'Tampa', state: 'FL', phone: '', email: lead.email, website: '' };
      const html = buildEmail1(info.business_name, info.industry, info.city || '', info.state || '', info.phone || '', lead.email, info.website || '');

      const status = await sendEmail(lead.email, 'Quick question — is this info correct?', html);

      if (status === 202) {
        sent++;
        const tags = [...new Set([...(lead.tags || []), 'email_1_sent'])];
        await supabase.from('crm_leads').update({
          tags,
          last_contact_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }).eq('id', lead.id);
      } else {
        failed++;
      }

      // Rate limit: 2 emails per second
      await new Promise(r => setTimeout(r, 500));
    }

    return NextResponse.json({ sent, failed, total: leads.length });
  }

  if (action === 'send_followup') {
    // Send Email 1b to leads that got Email 1 more than 72 hours ago but never replied
    const cutoff = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();

    const { data: leads } = await supabase
      .from('crm_leads')
      .select('id, email, name, company, tags')
      .eq('source', 'gl365_directory')
      .contains('tags', ['email_1_sent'])
      .not('tags', 'cs', '{"email_replied"}')
      .not('tags', 'cs', '{"email_1b_sent"}')
      .lt('last_contact_at', cutoff)
      .limit(limit || 50);

    if (!leads || leads.length === 0) {
      return NextResponse.json({ sent: 0, message: 'No leads need follow-up yet' });
    }

    let sent = 0, failed = 0;
    for (const lead of leads) {
      const html = buildEmail1b(lead.company || lead.name || 'your business');
      const status = await sendEmail(lead.email, `Following up — ${lead.company || 'your business'} on GL365`, html);

      if (status === 202) {
        sent++;
        const tags = [...new Set([...(lead.tags || []), 'email_1b_sent'])];
        await supabase.from('crm_leads').update({ tags, updated_at: new Date().toISOString() }).eq('id', lead.id);
      } else {
        failed++;
      }

      await new Promise(r => setTimeout(r, 500));
    }

    return NextResponse.json({ sent, failed, total: leads.length });
  }

  return NextResponse.json({ error: 'Invalid action. Use: send_test, send_initial, send_followup' }, { status: 400 });
}

// GET /api/email/campaign - Check campaign status
export async function GET(request: NextRequest) {
  const supabase = getServiceClient();

  const [total, emailed, replied, verified, needsFollowup] = await Promise.all([
    supabase.from('crm_leads').select('id', { count: 'exact' }).eq('source', 'gl365_directory'),
    supabase.from('crm_leads').select('id', { count: 'exact' }).eq('source', 'gl365_directory').contains('tags', ['email_1_sent']),
    supabase.from('crm_leads').select('id', { count: 'exact' }).eq('source', 'gl365_directory').contains('tags', ['email_replied']),
    supabase.from('crm_leads').select('id', { count: 'exact' }).eq('source', 'gl365_directory').eq('status', 'verified'),
    supabase.from('crm_leads').select('id', { count: 'exact' }).eq('source', 'gl365_directory').contains('tags', ['email_1_sent']).not('tags', 'cs', '{"email_replied"}'),
  ]);

  return NextResponse.json({
    total_leads: total.count || 0,
    email_1_sent: emailed.count || 0,
    replied: replied.count || 0,
    verified: verified.count || 0,
    awaiting_reply: needsFollowup.count || 0,
  });
}
