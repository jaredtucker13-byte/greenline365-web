import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
function getServiceClient() { return createClient(supabaseUrl, supabaseServiceKey); }

// POST /api/email/inbound - SendGrid Inbound Parse webhook
export async function POST(request: NextRequest) {
  const supabase = getServiceClient();
  const contentType = request.headers.get('content-type') || '';

  console.log('[INBOUND] Content-Type:', contentType);

  let from = '', to = '', subject = '', text = '';

  if (contentType.includes('multipart/form-data')) {
    try {
      const formData = await request.formData();
      from = formData.get('from')?.toString() || '';
      to = formData.get('to')?.toString() || '';
      subject = formData.get('subject')?.toString() || '';
      text = formData.get('text')?.toString() || formData.get('html')?.toString() || '';
      console.log('[INBOUND] Parsed as formData');
    } catch (e: any) {
      console.log('[INBOUND] formData parse error:', e.message);
    }
  } else if (contentType.includes('application/json')) {
    try {
      const body = await request.json();
      from = body.from || '';
      subject = body.subject || '';
      text = body.text || body.html || '';
      console.log('[INBOUND] Parsed as JSON');
    } catch (e: any) {
      console.log('[INBOUND] JSON parse error:', e.message);
    }
  } else {
    // Raw / URL-encoded
    try {
      const raw = await request.text();
      console.log('[INBOUND] Raw body (first 800 chars):', raw.slice(0, 800));
      
      // Parse URL-encoded form data
      if (contentType.includes('x-www-form-urlencoded') || raw.includes('from=') || raw.includes('&to=')) {
        const params = new URLSearchParams(raw);
        from = params.get('from') || '';
        to = params.get('to') || '';
        subject = params.get('subject') || '';
        text = params.get('text') || params.get('html') || '';
        console.log('[INBOUND] Parsed as URL-encoded');
      } else {
        // Try to find email patterns
        const fromMatch = raw.match(/["']?from["']?\s*[:=]\s*["']?([^"'&\n]+)/i);
        if (fromMatch) from = fromMatch[1];
        text = raw;
      }
    } catch (e: any) {
      console.log('[INBOUND] Raw parse error:', e.message);
    }
  }

  // Extract email address
  const emailMatch = from.match(/<([^>]+)>/) || [null, from];
  const senderEmail = (emailMatch[1] || from).toLowerCase().trim();

  console.log(`[INBOUND] RESULT → From: "${senderEmail}" | Subject: "${subject}" | Body: "${text?.slice(0, 100)}"`);

  if (!senderEmail || !senderEmail.includes('@')) {
    return NextResponse.json({ received: true, parsed: false }, { status: 200 });
  }

  // Find CRM lead
  const { data: lead } = await supabase
    .from('crm_leads')
    .select('id, name, email, status, tags')
    .eq('email', senderEmail)
    .maybeSingle();

  if (lead) {
    const bodyLower = (text || '').toLowerCase();
    const isConfirmation = ['looks good', 'correct', 'yes', 'confirm', 'good', 'right', 'accurate'].some(w => bodyLower.includes(w));
    const newStatus = isConfirmation ? 'verified' : 'responded';
    const tags = [...new Set([...(lead.tags || []), 'email_replied', ...(isConfirmation ? ['info_confirmed'] : [])])];

    await supabase.from('crm_leads').update({
      status: newStatus, tags,
      notes: `Replied ${new Date().toLocaleDateString()}: "${(text || '').slice(0, 200)}"`,
      last_contact_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('id', lead.id);

    console.log(`[INBOUND] ✓ Lead "${lead.name}" → ${newStatus}`);
  } else {
    console.log(`[INBOUND] No CRM lead for: ${senderEmail}`);
  }

  return NextResponse.json({ received: true, lead_found: !!lead, status: lead ? 'updated' : 'no_match' });
}
