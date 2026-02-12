/**
 * Campaign Contacts API
 * GET  - List contacts with pipeline data
 * POST - Add contacts from directory listings to campaign
 * PATCH - Update a contact's pipeline stage
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const stage = searchParams.get('stage');

    const { data, error } = await supabase
      .from('email_campaigns')
      .select('custom_recipients')
      .eq('id', id)
      .single();

    if (error) throw error;

    let contacts = data?.custom_recipients?.contacts || [];
    if (stage) {
      contacts = contacts.filter((c: any) => c.pipeline_stage === stage);
    }

    return NextResponse.json({ contacts, total: contacts.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (body.action === 'import_from_directory') {
      // Import contacts from directory_listings based on filters
      const filter = body.filter || {};
      let query = supabase
        .from('directory_listings')
        .select('id, business_name, email, phone, city, industry, metadata')
        .not('email', 'is', null)
        .neq('email', '');

      if (filter.city) query = query.eq('city', filter.city);
      if (filter.industry) query = query.eq('industry', filter.industry);
      if (filter.is_claimed !== undefined) query = query.eq('is_claimed', filter.is_claimed);

      const { data: listings, error: listingsError } = await query.limit(500);
      if (listingsError) throw listingsError;

      // Get current campaign
      const { data: campaign, error: campError } = await supabase
        .from('email_campaigns')
        .select('custom_recipients')
        .eq('id', id)
        .single();

      if (campError) throw campError;

      const currentMeta = campaign?.custom_recipients || {};
      const existingEmails = new Set(
        (currentMeta.contacts || []).map((c: any) => c.email)
      );

      // Filter to only after-hours targets if requested
      let filteredListings = listings || [];
      if (filter.after_hours_only) {
        filteredListings = filteredListings.filter((l: any) =>
          l.metadata?.after_hours_screenshot_url || l.metadata?.is_closed_after_hours
        );
      }

      const newContacts = filteredListings
        .filter((l: any) => l.email && !existingEmails.has(l.email))
        .map((l: any) => ({
          listing_id: l.id,
          email: l.email,
          business_name: l.business_name,
          phone: l.phone,
          city: l.city,
          industry: l.industry,
          pipeline_stage: 'new',
          current_step: 0,
          added_at: new Date().toISOString(),
          metadata: {
            google_rating: l.metadata?.google_rating,
            after_hours_screenshot_url: l.metadata?.after_hours_screenshot_url,
            sales_brief: l.metadata?.sales_brief,
          },
        }));

      const allContacts = [...(currentMeta.contacts || []), ...newContacts];

      const { error: updateError } = await supabase
        .from('email_campaigns')
        .update({
          custom_recipients: { ...currentMeta, contacts: allContacts },
          total_recipients: allContacts.length,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (updateError) throw updateError;

      return NextResponse.json({
        success: true,
        added: newContacts.length,
        total: allContacts.length,
        skipped_duplicates: filteredListings.length - newContacts.length,
      });
    }

    // Manual add contacts
    if (body.contacts && Array.isArray(body.contacts)) {
      const { data: campaign, error: campError } = await supabase
        .from('email_campaigns')
        .select('custom_recipients')
        .eq('id', id)
        .single();

      if (campError) throw campError;

      const currentMeta = campaign?.custom_recipients || {};
      const existingEmails = new Set(
        (currentMeta.contacts || []).map((c: any) => c.email)
      );

      const newContacts = body.contacts
        .filter((c: any) => c.email && !existingEmails.has(c.email))
        .map((c: any) => ({
          ...c,
          pipeline_stage: 'new',
          current_step: 0,
          added_at: new Date().toISOString(),
        }));

      const allContacts = [...(currentMeta.contacts || []), ...newContacts];

      const { error: updateError } = await supabase
        .from('email_campaigns')
        .update({
          custom_recipients: { ...currentMeta, contacts: allContacts },
          total_recipients: allContacts.length,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (updateError) throw updateError;

      return NextResponse.json({ success: true, added: newContacts.length, total: allContacts.length });
    }

    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { email, pipeline_stage, current_step } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const { data: campaign, error: fetchError } = await supabase
      .from('email_campaigns')
      .select('custom_recipients')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    const meta = campaign?.custom_recipients || {};
    const contacts = (meta.contacts || []).map((c: any) => {
      if (c.email === email) {
        const updated: any = { ...c, updated_at: new Date().toISOString() };
        if (pipeline_stage) updated.pipeline_stage = pipeline_stage;
        if (current_step !== undefined) updated.current_step = current_step;
        return updated;
      }
      return c;
    });

    // If pipeline_stage is 'replied', auto-create CRM lead
    if (pipeline_stage === 'replied') {
      const contact = contacts.find((c: any) => c.email === email);
      if (contact) {
        await createCrmLead(contact);
      }
    }

    const { error: updateError } = await supabase
      .from('email_campaigns')
      .update({
        custom_recipients: { ...meta, contacts },
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function createCrmLead(contact: any) {
  // Check if lead already exists
  const { data: existing } = await supabase
    .from('crm_leads')
    .select('id')
    .eq('email', contact.email)
    .single();

  if (existing) {
    // Update status to show they replied
    await supabase
      .from('crm_leads')
      .update({ status: 'qualified', last_contact_at: new Date().toISOString() })
      .eq('id', existing.id);
    return;
  }

  // Create new CRM lead
  await supabase.from('crm_leads').insert({
    email: contact.email,
    name: contact.business_name,
    phone: contact.phone,
    company: contact.business_name,
    status: 'qualified',
    source: 'campaign_response',
    tags: ['campaign_responder'],
    first_contact_at: new Date().toISOString(),
    last_contact_at: new Date().toISOString(),
    notes: `Responded to outreach campaign. Listing: ${contact.listing_id || 'N/A'}`,
  });
}
