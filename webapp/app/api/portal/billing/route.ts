import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { requireAuth } from '@/lib/auth/middleware';
import { createServerClient } from '@/lib/supabase/server';

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set');
  return new Stripe(key);
}

/**
 * GET /api/portal/billing — Get billing info (subscription, payment history, Stripe customer ID)
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof Response) return authResult;
    const { user } = authResult;

    const service = createServerClient();

    // Get user's listings to find listing-level subscriptions
    const { data: listings } = await service
      .from('directory_listings')
      .select('id')
      .eq('claimed_by', user.id);

    const listingIds = (listings || []).map((l) => l.id);

    // Build subscription query: account-level OR listing-level
    let subsQuery = service
      .from('subscriptions')
      .select(`
        id,
        account_id,
        listing_id,
        plan_id,
        status,
        billing_cycle,
        current_period_start,
        current_period_end,
        trial_start,
        trial_end,
        stripe_customer_id,
        stripe_subscription_id,
        created_at,
        plan:plans!inner(id, name, slug, product_type)
      `)
      .eq('account_id', user.id)
      .order('created_at', { ascending: false });

    const { data: subscriptions, error: subsError } = await subsQuery;

    if (subsError) {
      return NextResponse.json({ error: subsError.message }, { status: 500 });
    }

    // Also check for listing-level subs not tied to account_id
    let listingSubs: typeof subscriptions = [];
    if (listingIds.length > 0) {
      const { data: lSubs } = await service
        .from('subscriptions')
        .select(`
          id,
          account_id,
          listing_id,
          plan_id,
          status,
          billing_cycle,
          current_period_start,
          current_period_end,
          trial_start,
          trial_end,
          stripe_customer_id,
          stripe_subscription_id,
          created_at,
          plan:plans!inner(id, name, slug, product_type)
        `)
        .in('listing_id', listingIds)
        .neq('account_id', user.id)
        .order('created_at', { ascending: false });

      listingSubs = lSubs || [];
    }

    const allSubscriptions = [...(subscriptions || []), ...listingSubs];

    // Find the primary/active subscription
    const activeSubscription = allSubscriptions.find(
      (s) => s.status === 'active' || s.status === 'trialing'
    ) || allSubscriptions[0] || null;

    // Extract Stripe customer ID
    const stripeCustomerId = allSubscriptions.find(
      (s) => s.stripe_customer_id
    )?.stripe_customer_id || null;

    // Get payment history
    const { data: payments, error: paymentsError } = await service
      .from('payment_transactions')
      .select('id, amount, currency, status, description, created_at, stripe_payment_intent_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (paymentsError) {
      console.error('[PORTAL/BILLING] Payment history error:', paymentsError.message);
    }

    return NextResponse.json({
      subscription: activeSubscription,
      all_subscriptions: allSubscriptions,
      billing_history: payments || [],
      stripe_customer_id: stripeCustomerId,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[PORTAL/BILLING] GET Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/portal/billing — Create a Stripe billing portal session
 * Body: { return_url }
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof Response) return authResult;
    const { user } = authResult;

    const body = await request.json();
    const { return_url } = body;

    if (!return_url) {
      return NextResponse.json({ error: 'return_url is required' }, { status: 400 });
    }

    const service = createServerClient();

    // Find Stripe customer ID from subscriptions
    const { data: sub } = await service
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('account_id', user.id)
      .not('stripe_customer_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    let stripeCustomerId = sub?.stripe_customer_id;

    // Fallback: check payment_transactions
    if (!stripeCustomerId) {
      const { data: payment } = await service
        .from('payment_transactions')
        .select('stripe_customer_id')
        .eq('user_id', user.id)
        .not('stripe_customer_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      stripeCustomerId = payment?.stripe_customer_id;
    }

    if (!stripeCustomerId) {
      return NextResponse.json(
        { error: 'No billing account found. You may not have an active subscription.' },
        { status: 404 }
      );
    }

    const stripe = getStripe();
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[PORTAL/BILLING] POST Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
