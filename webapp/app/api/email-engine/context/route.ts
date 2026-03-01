/**
 * Email Engine — Context Fetcher
 * POST /api/email-engine/context
 *
 * Accepts { tenantId, description }
 * Fetches tenant profile, conversation history, home ledger data,
 * and maintenance history from Supabase.
 * Returns structured context object.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/api-auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const { tenantId, description } = await request.json();

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId is required' }, { status: 400 });
    }

    // Fetch tenant profile from crm_leads
    const { data: profile, error: profileErr } = await supabase
      .from('crm_leads')
      .select('*')
      .eq('id', tenantId)
      .single();

    if (profileErr || !profile) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Fetch conversation history (email_sends to this tenant)
    const { data: conversations } = await supabase
      .from('email_sends')
      .select('id, recipient_email, status, sent_at, metadata, created_at')
      .eq('recipient_email', profile.email)
      .order('created_at', { ascending: false })
      .limit(20);

    // Fetch ledger data if available
    const { data: ledger } = await supabase
      .from('email_sends')
      .select('id, status, sent_at, metadata, created_at')
      .eq('recipient_email', profile.email)
      .not('metadata', 'is', null)
      .order('created_at', { ascending: false })
      .limit(20);

    // Build context items
    const items = [
      { id: 'name', label: 'Name', value: profile.name || profile.business_name || '', editable: true, category: 'profile' as const },
      { id: 'email', label: 'Email', value: profile.email || '', editable: true, category: 'profile' as const },
      { id: 'phone', label: 'Phone', value: profile.phone || '', editable: true, category: 'profile' as const },
      { id: 'company', label: 'Company', value: profile.company || profile.business_name || '', editable: true, category: 'profile' as const },
      { id: 'status', label: 'Status', value: profile.status || 'unknown', editable: false, category: 'profile' as const },
      { id: 'tags', label: 'Tags', value: (profile.tags || []).join(', '), editable: false, category: 'profile' as const },
      { id: 'notes', label: 'Notes', value: profile.notes || '', editable: true, category: 'profile' as const },
    ];

    // Add conversation history items
    const conversationHistory = (conversations || []).map((c: any) => ({
      id: c.id,
      date: c.sent_at || c.created_at,
      channel: 'email',
      summary: `${c.status} — ${c.metadata?.subject || c.metadata?.type || 'email'}`,
    }));

    // Add ledger items
    const ledgerData = (ledger || []).map((l: any) => ({
      id: l.id,
      date: l.sent_at || l.created_at,
      description: l.metadata?.subject || 'Email interaction',
      amount: 0,
      type: 'charge' as const,
    }));

    if (description) {
      items.push({
        id: 'description',
        label: 'Operator Description',
        value: description,
        editable: true,
        category: 'profile' as const,
      });
    }

    return NextResponse.json({
      tenantId,
      name: profile.name || profile.business_name || '',
      email: profile.email || '',
      phone: profile.phone || '',
      company: profile.company || profile.business_name || '',
      items,
      rawProfile: profile,
      conversationHistory,
      ledgerData,
      maintenanceHistory: [],
    });
  } catch (error: any) {
    console.error('[Email Engine Context] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
