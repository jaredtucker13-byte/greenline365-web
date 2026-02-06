import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
function getServiceClient() { return createClient(supabaseUrl, supabaseServiceKey); }

// GET /api/contractors - List contractors or get suggestions
export async function GET(request: NextRequest) {
  const supabase = getServiceClient();
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get('tenant_id');
  const industry = searchParams.get('industry');
  const preferred = searchParams.get('preferred');

  if (!tenantId) return NextResponse.json({ error: 'tenant_id required' }, { status: 400 });

  let query = supabase
    .from('contractor_directory')
    .select('*, contractor_reviews(id, rating, review_text, created_at)')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .order('is_preferred', { ascending: false })
    .order('avg_rating', { ascending: false });

  if (industry) query = query.eq('industry', industry);
  if (preferred === 'true') query = query.eq('is_preferred', true);

  const { data, error } = await query.limit(50);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

// POST /api/contractors - Add contractor to directory
export async function POST(request: NextRequest) {
  const supabase = getServiceClient();
  const body = await request.json();
  const { tenant_id, business_name, industry, contact_name, phone, email, website, service_area, is_preferred, notes } = body;

  if (!tenant_id || !business_name || !industry) {
    return NextResponse.json({ error: 'tenant_id, business_name, industry required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('contractor_directory')
    .insert({
      tenant_id, business_name, industry,
      contact_name: contact_name || null,
      phone: phone || null,
      email: email || null,
      website: website || null,
      service_area: service_area || [],
      is_preferred: is_preferred || false,
      notes: notes || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

// PATCH /api/contractors - Update contractor
export async function PATCH(request: NextRequest) {
  const supabase = getServiceClient();
  const body = await request.json();
  const { id, tenant_id, ...updates } = body;

  if (!id || !tenant_id) return NextResponse.json({ error: 'id and tenant_id required' }, { status: 400 });

  const { data, error } = await supabase
    .from('contractor_directory')
    .update(updates)
    .eq('id', id)
    .eq('tenant_id', tenant_id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
