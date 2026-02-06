import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getServiceClient() { return createClient(supabaseUrl, supabaseServiceKey); }

// POST /api/email/inbound - SendGrid Inbound Parse webhook
// Receives email replies and auto-verifies CRM leads
export async function POST(request: NextRequest) {
  const supabase = getServiceClient();

  // SendGrid sends form data (multipart/form-data)
  const formData = await request.formData();

  const from = formData.get('from')?.toString() || '';
  const to = formData.get('to')?.toString() || '';
  const subject = formData.get('subject')?.toString() || '';
  const text = formData.get('text')?.toString() || '';
  const html = formData.get('html')?.toString() || '';

  // Extract email address from "Name <email>" format
  const emailMatch = from.match(/<([^>]+)>/) || [null, from];
  const senderEmail = (emailMatch[1] || from).toLowerCase().trim();

  console.log(`[INBOUND] Reply from: ${senderEmail} | Subject: ${subject}`);
  console.log(`[INBOUND] Body: ${text?.slice(0, 200)}`);

  if (!senderEmail) {
    return NextResponse.json({ error: 'No sender email' }, { status: 400 });
  }

  // Find matching CRM lead by email
  const { data: lead } = await supabase
    .from('crm_leads')
    .select('id, name, email, status, tags')
    .eq('email', senderEmail)
    .single();

  if (lead) {
    // Check if reply is a confirmation
    const bodyLower = (text || '').toLowerCase();
    const isConfirmation = bodyLower.includes('looks good') ||
      bodyLower.includes('correct') ||
      bodyLower.includes('yes') ||
      bodyLower.includes('confirm') ||
      bodyLower.includes('good') ||
      bodyLower.includes('right') ||
      bodyLower.includes('accurate');

    const newStatus = isConfirmation ? 'verified' : 'responded';
    const updatedTags = [...(lead.tags || [])];
    if (!updatedTags.includes('email_replied')) updatedTags.push('email_replied');
    if (isConfirmation && !updatedTags.includes('info_confirmed')) updatedTags.push('info_confirmed');

    // Update lead status
    await supabase
      .from('crm_leads')
      .update({
        status: newStatus,
        tags: updatedTags,
        notes: `${lead.name || 'Lead'} replied on ${new Date().toLocaleDateString()}: "${(text || '').slice(0, 200)}"`,
        last_contact_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', lead.id);

    console.log(`[INBOUND] Lead ${lead.name} (${senderEmail}) → status: ${newStatus}`);

    // Also update directory listing if it exists
    const { data: listing } = await supabase
      .from('directory_listings')
      .select('id')
      .eq('email', senderEmail)
      .single();

    if (listing) {
      await supabase
        .from('directory_listings')
        .update({ is_claimed: true, claimed_at: new Date().toISOString() })
        .eq('id', listing.id);
      console.log(`[INBOUND] Directory listing claimed: ${listing.id}`);
    }
  } else {
    console.log(`[INBOUND] No CRM lead found for: ${senderEmail}`);
  }

  // Log the inbound email in audit
  await supabase.from('audit_logs').insert({
    tenant_id: (await supabase.from('businesses').select('id').limit(1).single()).data?.id,
    action: 'email_reply_received',
    entity_type: 'crm_lead',
    entity_id: lead?.id || null,
    details: { from: senderEmail, subject, body_preview: (text || '').slice(0, 300) },
  });

  // SendGrid expects 200 OK
  return NextResponse.json({ received: true, lead_updated: !!lead });
}
