import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/admin/tenants
 * Returns list of all tenants for admin dashboard dropdowns.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET() {
  try {
    const { data: tenants, error } = await supabase
      .from('tenants')
      .select('id, business_name, industry, config_type, onboarding_status, is_active, plan, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ tenants: tenants || [] });
  } catch (error: any) {
    console.error('[Admin Tenants] Error:', error);
    return NextResponse.json({ error: error.message, tenants: [] }, { status: 500 });
  }
}
