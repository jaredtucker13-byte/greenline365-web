/**
 * Single Campaign API
 * GET    - Get campaign details with contacts and pipeline
 * PATCH  - Update campaign (name, sequence, contacts, status)
 * DELETE - Delete a campaign
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

    const { data, error } = await supabase
      .from('email_campaigns')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });

    const meta = data.custom_recipients || {};
    const campaign = {
      ...data,
      sequence: meta.sequence || [],
      audience_filter: meta.audience_filter || {},
      sender_config: meta.sender_config || {},
      contacts: meta.contacts || [],
      pipeline_summary: getPipelineSummary(meta.contacts || []),
    };

    // Fetch related email sends for tracking
    const { data: sends } = await supabase
      .from('email_sends')
      .select('*')
      .eq('campaign_id', id)
      .order('created_at', { ascending: false });

    return NextResponse.json({ campaign, sends: sends || [] });
  } catch (error: any) {
    console.error('Error fetching campaign:', error);
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

    // Fetch current campaign
    const { data: current, error: fetchError } = await supabase
      .from('email_campaigns')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;
    if (!current) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });

    const currentMeta = current.custom_recipients || {};
    const updates: any = { updated_at: new Date().toISOString() };

    // Top-level fields
    if (body.name !== undefined) updates.name = body.name;
    if (body.description !== undefined) updates.description = body.description;
    if (body.subject !== undefined) updates.subject = body.subject;
    if (body.html_content !== undefined) updates.html_content = body.html_content;
    if (body.template_id !== undefined) updates.template_id = body.template_id;
    if (body.status !== undefined) updates.status = body.status;
    if (body.scheduled_for !== undefined) updates.scheduled_for = body.scheduled_for;

    // Nested fields stored in custom_recipients JSONB
    const newMeta = { ...currentMeta };
    if (body.sequence !== undefined) newMeta.sequence = body.sequence;
    if (body.audience_filter !== undefined) newMeta.audience_filter = body.audience_filter;
    if (body.sender_config !== undefined) newMeta.sender_config = body.sender_config;
    if (body.contacts !== undefined) {
      newMeta.contacts = body.contacts;
      updates.total_recipients = body.contacts.length;
    }

    // Pipeline stage update for a single contact
    if (body.update_contact) {
      const { email, pipeline_stage } = body.update_contact;
      newMeta.contacts = (newMeta.contacts || []).map((c: any) =>
        c.email === email ? { ...c, pipeline_stage, updated_at: new Date().toISOString() } : c
      );
    }

    updates.custom_recipients = newMeta;

    const { data, error } = await supabase
      .from('email_campaigns')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ campaign: data, success: true });
  } catch (error: any) {
    console.error('Error updating campaign:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { error } = await supabase
      .from('email_campaigns')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting campaign:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function getPipelineSummary(contacts: any[]) {
  const stages: Record<string, number> = {
    new: 0, contacted: 0, replied: 0, claimed: 0, upgraded: 0, gold: 0,
  };
  for (const c of contacts) {
    const stage = c.pipeline_stage || 'new';
    if (stage in stages) stages[stage]++;
  }
  return stages;
}
