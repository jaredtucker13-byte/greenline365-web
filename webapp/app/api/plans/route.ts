import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/plans — list active plans with feature overrides
export async function GET() {
  const supabase = await createClient();

  const { data: plans, error } = await supabase
    .from('plans')
    .select(`
      id, slug, product_type, name, description,
      price_monthly_cents, price_annual_cents, trial_days,
      features, sort_order,
      plan_feature_overrides(
        value,
        feature_flag:feature_flags(slug, name, value_type, default_value)
      )
    `)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ plans });
}
