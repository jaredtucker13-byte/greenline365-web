import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET /api/email/campaigns - List all campaigns
// POST /api/email/campaigns - Create new campaign
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    
    let query = supabase
      .from('email_campaigns')
      .select(`
        *,
        template:email_templates(id, name, slug)
      `)
      .order('created_at', { ascending: false });
    
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    return NextResponse.json({ campaigns: data });
  } catch (error: any) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch campaigns' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      name, 
      description, 
      template_id, 
      recipient_list, 
      custom_recipients,
      subject,
      html_content,
      scheduled_for 
    } = body;
    
    if (!name) {
      return NextResponse.json(
        { error: 'Missing required field: name' },
        { status: 400 }
      );
    }
    
    // Calculate total recipients based on list type
    let totalRecipients = 0;
    if (recipient_list === 'waitlist') {
      const { count } = await supabase
        .from('waitlist_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      totalRecipients = count || 0;
    } else if (recipient_list === 'custom' && custom_recipients) {
      totalRecipients = custom_recipients.length;
    }
    
    const { data, error } = await supabase
      .from('email_campaigns')
      .insert({
        name,
        description,
        template_id,
        recipient_list,
        custom_recipients,
        subject,
        html_content,
        scheduled_for,
        total_recipients: totalRecipients,
        status: scheduled_for ? 'scheduled' : 'draft',
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return NextResponse.json({ campaign: data }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating campaign:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create campaign' },
      { status: 500 }
    );
  }
}
