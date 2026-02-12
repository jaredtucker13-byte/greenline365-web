/**
 * Campaigns API
 * GET  - List campaigns with filtering
 * POST - Create a new campaign (with sequence, audience, sender config)
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = supabase
      .from('email_campaigns')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Parse custom_recipients to extract campaign metadata
    const campaigns = (data || []).map((c: any) => {
      const meta = c.custom_recipients || {};
      return {
        ...c,
        sequence: meta.sequence || [],
        audience_filter: meta.audience_filter || {},
        sender_config: meta.sender_config || {},
        contacts: meta.contacts || [],
        pipeline_summary: getPipelineSummary(meta.contacts || []),
      };
    });

    return NextResponse.json({ campaigns });
  } catch (error: any) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      subject,
      template_id,
      html_content,
      sequence,
      audience_filter,
      sender_config,
      contacts,
      scheduled_for,
    } = body;

    if (!name) {
      return NextResponse.json({ error: 'Campaign name is required' }, { status: 400 });
    }

    const campaignData = {
      name,
      description: description || '',
      subject: subject || '',
      template_id: template_id || null,
      html_content: html_content || '',
      recipient_list: 'campaign_manager',
      custom_recipients: {
        sequence: sequence || [],
        audience_filter: audience_filter || {},
        sender_config: sender_config || { emails: [], rotation: 'round-robin' },
        contacts: (contacts || []).map((c: any) => ({
          ...c,
          pipeline_stage: c.pipeline_stage || 'new',
          current_step: c.current_step || 0,
          added_at: new Date().toISOString(),
        })),
      },
      total_recipients: contacts?.length || 0,
      status: body.status || 'draft',
      scheduled_for: scheduled_for || null,
      emails_sent: 0,
      emails_delivered: 0,
      emails_opened: 0,
      emails_clicked: 0,
      emails_bounced: 0,
      emails_unsubscribed: 0,
    };

    const { data, error } = await supabase
      .from('email_campaigns')
      .insert(campaignData)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ campaign: data, success: true });
  } catch (error: any) {
    console.error('Error creating campaign:', error);
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
    else stages[stage] = (stages[stage] || 0) + 1;
  }
  return stages;
}
