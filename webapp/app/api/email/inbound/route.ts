import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getServiceClient() { return createClient(supabaseUrl, supabaseServiceKey); }

// POST /api/email/inbound - SendGrid Inbound Parse webhook
export async function POST(request: NextRequest) {
  const supabase = getServiceClient();

  let from = '', to = '', subject = '', text = '';

  try {
    // Try multipart form data first (SendGrid default)
    const formData = await request.formData();
    from = formData.get('from')?.toString() || '';
    to = formData.get('to')?.toString() || '';
    subject = formData.get('subject')?.toString() || '';
    text = formData.get('text')?.toString() || formData.get('html')?.toString() || '';
  } catch {
    try {
      // Fallback: try JSON
      const body = await request.json();
      from = body.from || body.sender || '';
      to = body.to || '';
      subject = body.subject || '';
      text = body.text || body.html || body.body || '';
    } catch {
      // Last resort: raw text
      try {
        const raw = await request.text();
        console.log('[INBOUND] Raw body:', raw.slice(0, 500));
        // Try to extract email from raw data
        const fromMatch = raw.match(/from["\s:=]+([^\s&"]+@[^\s&"]+)/i);
        if (fromMatch) from = fromMatch[1];
        const subjectMatch = raw.match(/subject["\s:=]+([^&"]+)/i);
        if (subjectMatch) subject = subjectMatch[1];
        text = raw;
      } catch {
        console.log('[INBOUND] Could not parse request body');
      }
    }
  }

  // Extract email address from "Name <email>" format
  const emailMatch = from.match(/<([^>]+)>/) || [null, from];
  const senderEmail = (emailMatch[1] || from).toLowerCase().trim();

  console.log(`[INBOUND] From: ${senderEmail} | Subject: ${subject}`);
  console.log(`[INBOUND] Body: ${text?.slice(0, 200)}`);

  if (!senderEmail || !senderEmail.includes('@')) {
    console.log('[INBOUND] No valid sender email found');
    return NextResponse.json({ received: true, error: 'no sender' }, { status: 200 });
  }

  // Find matching CRM lead
  const { data: lead } = await supabase
    .from('crm_leads')
    .select('id, name, email, status, tags')
    .eq('email', senderEmail)
    .maybeSingle();

  if (lead) {
    const bodyLower = (text || '').toLowerCase();
    const isConfirmation = bodyLower.includes('looks good') ||
      bodyLower.includes('correct') || bodyLower.includes('yes') ||
      bodyLower.includes('confirm') || bodyLower.includes('good') ||
      bodyLower.includes('right') || bodyLower.includes('accurate') ||
      bodyLower.includes('that is correct');

    const newStatus = isConfirmation ? 'verified' : 'responded';
    const tags = [...new Set([...(lead.tags || []), 'email_replied', ...(isConfirmation ? ['info_confirmed'] : [])])];

    await supabase
      .from('crm_leads')
      .update({
        status: newStatus,
        tags,
        notes: `Replied ${new Date().toLocaleDateString()}: "${(text || '').slice(0, 200)}"`,
        last_contact_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', lead.id);

    console.log(`[INBOUND] Lead "${lead.name}" → ${newStatus}`);

    // Also claim directory listing if email matches
    await supabase
      .from('directory_listings')
      .update({ is_claimed: true, claimed_at: new Date().toISOString() })
      .ilike('website', `%${senderEmail.split('@')[1]}%`);
  } else {
    console.log(`[INBOUND] No CRM lead for: ${senderEmail}`);
  }

  // Always return 200 to SendGrid
  return NextResponse.json({ received: true, lead_found: !!lead });
}
