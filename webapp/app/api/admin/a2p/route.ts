import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/admin/a2p?tenant_id=xxx
 * Returns A2P registration data for a specific tenant.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    const tenantId = request.nextUrl.searchParams.get('tenant_id');

    if (!tenantId) {
      return NextResponse.json({ error: 'Missing tenant_id' }, { status: 400 });
    }

    const { data: registration, error } = await supabase
      .from('a2p_registrations')
      .select('*')
      .eq('tenant_id', tenantId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return NextResponse.json({ registration: registration || null });
  } catch (error: any) {
    console.error('[Admin A2P] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing registration id' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('a2p_registrations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, registration: data });
  } catch (error: any) {
    console.error('[Admin A2P PATCH] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
