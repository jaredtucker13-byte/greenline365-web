import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/auth/middleware';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getServiceClient() {
  return createClient(supabaseUrl, supabaseServiceKey);
}

// GET /api/audit-log - List audit events (requires authentication)
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;

  const supabase = getServiceClient();
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get('tenant_id');
  const entityType = searchParams.get('entity_type');
  const action = searchParams.get('action');
  const rawLimit = parseInt(searchParams.get('limit') || '50');
  const limit = Math.min(rawLimit, 500); // Cap at 500 to prevent abuse

  if (!tenantId) {
    return NextResponse.json({ error: 'tenant_id required' }, { status: 400 });
  }

  let query = supabase
    .from('audit_logs')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (entityType) query = query.eq('entity_type', entityType);
  if (action) query = query.eq('action', action);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });

  return NextResponse.json(data || []);
}

// POST /api/audit-log - Create audit event (requires authentication)
export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;

  const supabase = getServiceClient();
  const body = await request.json();

  // Only allow specific fields to prevent arbitrary data injection
  const { tenant_id, entity_type, entity_id, action, metadata } = body;
  if (!tenant_id || !entity_type || !action) {
    return NextResponse.json({ error: 'tenant_id, entity_type, and action are required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('audit_logs')
    .insert({
      tenant_id,
      entity_type,
      entity_id: entity_id || null,
      action,
      actor_id: auth.user.id,
      metadata: metadata || {},
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: 'Failed to create audit log' }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
