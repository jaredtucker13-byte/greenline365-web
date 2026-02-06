import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const openrouterKey = process.env.OPENROUTER_API_KEY!;
const sendgridKey = process.env.SENDGRID_API_KEY!;

function getServiceClient() { return createClient(supabaseUrl, supabaseServiceKey); }

// Use AI to parse corrections from email reply
async function parseCorrections(replyText: string, currentInfo: any): Promise<{ confirmed: boolean; corrections: Record<string, string> }> {
  const prompt = `You are analyzing a business owner's reply to a directory listing confirmation email. 

Their current listing info:
- Business Name: ${currentInfo.business_name}
- Industry: ${currentInfo.industry}
- Location: ${currentInfo.city}, ${currentInfo.state}
- Phone: ${currentInfo.phone || 'not listed'}
- Email: ${currentInfo.email || 'not listed'}
- Website: ${currentInfo.website || 'not listed'}

Their reply:
"${replyText}"

Determine:
1. Did they confirm everything is correct? (yes/no)
2. Did they provide any corrections or updates?

Return JSON only:
{
  "confirmed": true/false,
  "corrections": {
    "business_name": "new value or null if no change",
    "phone": "new phone or null",
    "email": "new email or null",
    "city": "new city or null",
    "state": "new state or null",
    "address_line1": "new address or null",
    "zip_code": "new zip or null",
    "business_hours": "any hours mentioned or null",
    "description": "any description update or null"
  },
  "summary": "brief summary of what they said"
}`;

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openrouterKey}` },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-001',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        response_format: { type: 'json_object' },
      }),
    });
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || '{}';
    const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return { confirmed: replyText.toLowerCase().includes('good') || replyText.toLowerCase().includes('correct'), corrections: {} };
  }
}

// Send Email 2 — "Your listing is live" with link
async function sendListingLiveEmail(to: string, businessName: string, slug: string) {
  const listingUrl = `https://greenline365.com/directory?search=${encodeURIComponent(businessName)}`;

  await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sendgridKey}` },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }], subject: `Your listing is live — ${businessName} on GL365` }],
      from: { email: 'greenline365help@gmail.com', name: 'GL365 Directory' },
      reply_to: { email: 'reply@reply.greenline365.com', name: 'GL365 Directory' },
      content: [{
        type: 'text/html',
        value: `<div style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;max-width:540px;margin:0 auto;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0d0d;border-radius:10px 10px 0 0;"><tr><td style="padding:22px 28px;"><span style="color:#39FF14;font-weight:800;font-size:20px;">Green</span><span style="color:#fff;font-weight:800;font-size:20px;">Line365</span></td></tr></table><div style="padding:30px 28px;background:#fff;"><p style="font-size:16px;font-weight:600;color:#111;margin:0 0 14px;">Your listing is live!</p><p style="font-size:14px;color:#555;line-height:1.7;margin:0 0 20px;">Thanks for confirming. <strong>${businessName}</strong> is now part of the GL365 Tampa Bay Directory — the trusted, badge-verified business network.</p><div style="text-align:center;margin:24px 0;"><a href="${listingUrl}" style="background:#FF8C00;color:#fff;padding:14px 32px;border-radius:50px;text-decoration:none;font-weight:700;font-size:14px;display:inline-block;">View Your Listing</a></div><p style="font-size:13px;color:#888;line-height:1.5;">Your trust score starts building from today. Earn badges through verified service records and real public feedback — badges are <strong>earned, never bought</strong>.</p><p style="font-size:12px;color:#aaa;margin-top:20px;">Questions? Just reply to this email.</p></div><table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0d0d;border-radius:0 0 10px 10px;"><tr><td style="padding:14px 28px;text-align:center;"><span style="color:#444;font-size:11px;">GL365 Directory — Every badge is earned, never bought.</span></td></tr></table></div>`
      }],
    }),
  });

  console.log(`[EMAIL2] Sent "listing live" email to ${to}`);
}

// POST /api/email/inbound - Enhanced with AI correction parsing
export async function POST(request: NextRequest) {
  const supabase = getServiceClient();
  const contentType = request.headers.get('content-type') || '';

  let from = '', to = '', subject = '', text = '';

  // Parse incoming email (handle all formats)
  if (contentType.includes('multipart/form-data')) {
    try {
      const formData = await request.formData();
      from = formData.get('from')?.toString() || '';
      to = formData.get('to')?.toString() || '';
      subject = formData.get('subject')?.toString() || '';
      text = formData.get('text')?.toString() || formData.get('html')?.toString() || '';
    } catch { /* fall through */ }
  }

  if (!from) {
    try {
      const raw = await request.text();
      if (raw.includes('from=') || raw.includes('&to=')) {
        const params = new URLSearchParams(raw);
        from = params.get('from') || '';
        to = params.get('to') || '';
        subject = params.get('subject') || '';
        text = params.get('text') || params.get('html') || '';
      }
    } catch { /* ignore */ }
  }

  const emailMatch = from.match(/<([^>]+)>/) || [null, from];
  const senderEmail = (emailMatch[1] || from).toLowerCase().trim();

  console.log(`[INBOUND] From: "${senderEmail}" | Subject: "${subject}"`);

  if (!senderEmail || !senderEmail.includes('@')) {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  // Find CRM lead
  const { data: lead } = await supabase
    .from('crm_leads')
    .select('id, name, email, company, status, tags, notes')
    .eq('email', senderEmail)
    .maybeSingle();

  // Check for STOP / unsubscribe
  const bodyLower = (text || '').toLowerCase().trim();
  if (bodyLower === 'stop' || bodyLower.includes('unsubscribe') || bodyLower.includes('remove me') || bodyLower.includes('opt out')) {
    if (lead) {
      await supabase.from('crm_leads').update({
        status: 'lost',
        tags: [...new Set([...(lead.tags || []), 'unsubscribed', 'email_replied'])],
        notes: `Unsubscribed ${new Date().toLocaleDateString()}`,
        updated_at: new Date().toISOString(),
      }).eq('id', lead.id);
    }
    // Remove from directory
    const domain = senderEmail.split('@')[1];
    await supabase.from('directory_listings')
      .update({ is_published: false, updated_at: new Date().toISOString() })
      .or(`email.eq.${senderEmail},website.ilike.%${domain}%`);
    
    console.log(`[INBOUND] STOP received from ${senderEmail} — unsubscribed`);
    return NextResponse.json({ received: true, action: 'unsubscribed' });
  }

  // Find directory listing (match by email or website domain)
  const domain = senderEmail.split('@')[1];
  const { data: listing } = await supabase
    .from('directory_listings')
    .select('*')
    .or(`email.eq.${senderEmail},website.ilike.%${domain}%`)
    .maybeSingle();

  if (listing && text) {
    // AI parses the reply for corrections
    const parsed = await parseCorrections(text, listing);
    console.log(`[INBOUND] AI parsed: confirmed=${parsed.confirmed}, corrections=${JSON.stringify(parsed.corrections)}`);

    // Apply corrections to listing
    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    if (parsed.corrections) {
      for (const [key, value] of Object.entries(parsed.corrections)) {
        if (value && value !== 'null' && value !== 'none' && value !== listing[key]) {
          updates[key] = value;
        }
      }
    }

    if (parsed.confirmed || Object.keys(updates).length > 1) {
      updates.is_claimed = true;
      updates.claimed_at = new Date().toISOString();
    }

    await supabase.from('directory_listings').update(updates).eq('id', listing.id);
    console.log(`[INBOUND] Listing "${listing.business_name}" updated with`, Object.keys(updates));

    // Send Email 2 — listing link
    const replyEmail = listing.email || senderEmail;
    await sendListingLiveEmail(replyEmail, listing.business_name, listing.slug || '');
  }

  // Update CRM lead
  if (lead) {
    const tags = [...new Set([...(lead.tags || []), 'email_replied', 'info_confirmed'])];
    await supabase.from('crm_leads').update({
      status: 'verified',
      tags,
      notes: `Replied ${new Date().toLocaleDateString()}: "${(text || '').slice(0, 200)}"`,
      last_contact_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('id', lead.id);
    console.log(`[INBOUND] CRM lead "${lead.name}" → verified`);
  }

  return NextResponse.json({ received: true, lead_found: !!lead, listing_found: !!listing });
}
