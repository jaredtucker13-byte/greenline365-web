import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
function getServiceClient() { return createClient(supabaseUrl, supabaseServiceKey); }

// GET /api/referrals - List referrals
export async function GET(request: NextRequest) {
  const supabase = getServiceClient();
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get('tenant_id');
  const status = searchParams.get('status');
  const propertyId = searchParams.get('property_id');

  if (!tenantId) return NextResponse.json({ error: 'tenant_id required' }, { status: 400 });

  let query = supabase
    .from('referrals')
    .select('*, contractor_directory(id, business_name, industry, avg_rating, is_greenline_member, phone, email)')
    .eq('referring_tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (status) query = query.eq('status', status);
  if (propertyId) query = query.eq('property_id', propertyId);

  const { data, error } = await query.limit(50);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Stats
  const all = data || [];
  const stats = {
    total: all.length,
    suggested: all.filter(r => r.status === 'suggested').length,
    sent: all.filter(r => r.status === 'sent').length,
    completed: all.filter(r => r.status === 'completed').length,
    totalJobValue: all.filter(r => r.job_value).reduce((s, r) => s + parseFloat(r.job_value || '0'), 0),
  };

  return NextResponse.json({ referrals: all, stats });
}

// POST /api/referrals - Create referral
export async function POST(request: NextRequest) {
  const supabase = getServiceClient();
  const body = await request.json();
  const { referring_tenant_id, referring_user_id, referred_contractor_id, property_id, trigger_type, trigger_context, homeowner_name, homeowner_phone, notes } = body;

  if (!referring_tenant_id || !referred_contractor_id) {
    return NextResponse.json({ error: 'referring_tenant_id and referred_contractor_id required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('referrals')
    .insert({
      referring_tenant_id, referred_contractor_id,
      referring_user_id: referring_user_id || null,
      property_id: property_id || null,
      trigger_type: trigger_type || 'manual',
      trigger_context: trigger_context || {},
      status: 'suggested',
      homeowner_name: homeowner_name || null,
      homeowner_phone: homeowner_phone || null,
      notes: notes || null,
    })
    .select('*, contractor_directory(id, business_name, industry, avg_rating)')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

// PATCH /api/referrals - Update referral status
export async function PATCH(request: NextRequest) {
  const supabase = getServiceClient();
  const body = await request.json();
  const { id, referring_tenant_id, status, job_value, referral_fee, notes } = body;

  if (!id || !referring_tenant_id) return NextResponse.json({ error: 'id and referring_tenant_id required' }, { status: 400 });

  const updates: Record<string, any> = {};
  if (status) updates.status = status;
  if (job_value) updates.job_value = job_value;
  if (referral_fee) updates.referral_fee = referral_fee;
  if (notes) updates.notes = notes;
  if (status === 'completed') updates.completed_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('referrals')
    .update(updates)
    .eq('id', id)
    .eq('referring_tenant_id', referring_tenant_id)
    .select('*, contractor_directory(id, business_name, industry, avg_rating)')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
