import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getServiceClient() {
  return createClient(supabaseUrl, supabaseServiceKey);
}

// GET /api/filing-cabinet - List files
export async function GET(request: NextRequest) {
  const supabase = getServiceClient();
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get('tenant_id');
  const category = searchParams.get('category');
  const taxYear = searchParams.get('tax_year');
  const propertyId = searchParams.get('property_id');

  if (!tenantId) {
    return NextResponse.json({ error: 'tenant_id required' }, { status: 400 });
  }

  let query = supabase
    .from('filing_cabinet')
    .select('*')
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (category && category !== 'all') query = query.eq('category', category);
  if (taxYear) query = query.eq('tax_year', parseInt(taxYear));
  if (propertyId) query = query.eq('property_id', propertyId);

  const { data, error } = await query.limit(100);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Calculate totals
  const totals = (data || []).reduce((acc: any, file: any) => {
    if (file.amount) {
      acc.totalAmount += parseFloat(file.amount);
      acc.fileCount += 1;
    }
    if (!acc.categories[file.category]) acc.categories[file.category] = 0;
    acc.categories[file.category] += 1;
    return acc;
  }, { totalAmount: 0, fileCount: 0, categories: {} });

  return NextResponse.json({ files: data || [], totals });
}

// POST /api/filing-cabinet - Upload file record
export async function POST(request: NextRequest) {
  const supabase = getServiceClient();
  const body = await request.json();
  const { 
    tenant_id, property_id, file_name, file_type, file_url, file_size_bytes,
    mime_type, category, subcategory, amount, tax_year, job_id, 
    uploaded_by, uploaded_by_role, visibility, description, tags 
  } = body;

  if (!tenant_id || !file_name || !file_url || !uploaded_by) {
    return NextResponse.json({ error: 'tenant_id, file_name, file_url, uploaded_by required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('filing_cabinet')
    .insert({
      tenant_id,
      property_id: property_id || null,
      file_name,
      file_type: file_type || 'other',
      file_url,
      file_size_bytes: file_size_bytes || null,
      mime_type: mime_type || null,
      category: category || 'general',
      subcategory: subcategory || null,
      amount: amount || null,
      currency: 'USD',
      tax_year: tax_year || new Date().getFullYear(),
      job_id: job_id || null,
      uploaded_by,
      uploaded_by_role: uploaded_by_role || 'owner',
      visibility: visibility || 'owner_only',
      description: description || null,
      tags: tags || [],
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Log audit event
  await supabase.from('audit_logs').insert({
    tenant_id,
    actor_id: uploaded_by,
    action: 'upload',
    entity_type: 'filing_cabinet',
    entity_id: data.id,
    details: { file_name, category, description: `Uploaded ${file_name} to ${category}` },
    severity: 'info',
  });

  return NextResponse.json(data, { status: 201 });
}

// DELETE /api/filing-cabinet - Soft delete a file
export async function DELETE(request: NextRequest) {
  const supabase = getServiceClient();
  const { searchParams } = new URL(request.url);
  const fileId = searchParams.get('id');
  const userId = searchParams.get('user_id');
  const tenantId = searchParams.get('tenant_id');

  if (!fileId || !userId || !tenantId) {
    return NextResponse.json({ error: 'id, user_id, tenant_id required' }, { status: 400 });
  }

  // Soft delete
  const { data, error } = await supabase
    .from('filing_cabinet')
    .update({ deleted_at: new Date().toISOString(), deleted_by: userId })
    .eq('id', fileId)
    .eq('tenant_id', tenantId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Log audit event
  await supabase.from('audit_logs').insert({
    tenant_id: tenantId,
    actor_id: userId,
    action: 'delete',
    entity_type: 'filing_cabinet',
    entity_id: fileId,
    details: { file_name: data.file_name, description: `Deleted file: ${data.file_name}` },
    severity: 'warning',
    old_value: data,
  });

  return NextResponse.json({ success: true });
}
