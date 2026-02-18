import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { createServerClient } from '@/lib/supabase/server';
import { bustFeatureCache } from '@/lib/services/feature-resolution';

// GET /api/subscriptions — list current user's subscriptions
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;

  const { user, supabase } = auth;

  const { data: subs, error } = await supabase
    .from('subscriptions')
    .select(`
      id, account_id, listing_id, status, billing_cycle,
      current_period_start, current_period_end,
      cancel_at_period_end, trial_ends_at,
      created_at, updated_at,
      plan:plans(id, slug, product_type, name, price_monthly_cents, price_annual_cents)
    `)
    .eq('account_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ subscriptions: subs });
}

// POST /api/subscriptions — create a new subscription (after Stripe checkout success)
export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;

  const { user } = auth;
  const serviceClient = createServerClient();
  const body = await request.json();

  const {
    plan_id,
    listing_id,
    stripe_subscription_id,
    stripe_customer_id,
    billing_cycle = 'monthly',
    status = 'active',
  } = body;

  if (!plan_id) {
    return NextResponse.json({ error: 'plan_id is required' }, { status: 400 });
  }

  // Verify the plan exists and is active
  const { data: plan, error: planError } = await serviceClient
    .from('plans')
    .select('id, slug, product_type, trial_days')
    .eq('id', plan_id)
    .eq('is_active', true)
    .single();

  if (planError || !plan) {
    return NextResponse.json({ error: 'Invalid or inactive plan' }, { status: 400 });
  }

  // Build subscription record
  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + (billing_cycle === 'annual' ? 12 : 1));

  const subStatus = plan.trial_days > 0 && status === 'active' ? 'trialing' : status;
  const trialEndsAt = plan.trial_days > 0
    ? new Date(now.getTime() + plan.trial_days * 24 * 60 * 60 * 1000).toISOString()
    : null;

  const { data: subscription, error } = await serviceClient
    .from('subscriptions')
    .insert({
      account_id: user.id,
      listing_id: listing_id || null,
      plan_id: plan.id,
      stripe_subscription_id: stripe_subscription_id || null,
      stripe_customer_id: stripe_customer_id || null,
      status: subStatus,
      billing_cycle,
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
      trial_ends_at: trialEndsAt,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Bust feature cache for this account
  bustFeatureCache(user.id, listing_id || undefined);

  return NextResponse.json({ subscription }, { status: 201 });
}
