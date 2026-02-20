import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { requireAuth } from '@/lib/auth/middleware';
import { createServerClient } from '@/lib/supabase/server';

function getStripe() {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error('STRIPE_SECRET_KEY is not set');
    return new Stripe(key);
}

// POST /api/billing/checkout — create Stripe checkout session for a plan
export async function POST(request: NextRequest) {
    const auth = await requireAuth(request);
    if (auth instanceof Response) return auth;

  const { user } = auth;
    const body = await request.json();
    const { plan_id, listing_id, billing_cycle = 'monthly', success_url, cancel_url } = body;

  if (!plan_id || !success_url || !cancel_url) {
        return NextResponse.json(
          { error: 'plan_id, success_url, and cancel_url are required' },
          { status: 400 }
              );
  }

  const serviceClient = createServerClient();

  // Look up the plan
  const { data: plan, error: planError } = await serviceClient
      .from('plans')
      .select('id, slug, name, product_type, price_monthly_cents, price_annual_cents, stripe_price_id_monthly, stripe_price_id_annual, trial_days')
      .eq('id', plan_id)
      .eq('is_active', true)
      .single();

  if (planError || !plan) {
        return NextResponse.json({ error: 'Invalid or inactive plan' }, { status: 400 });
  }

  if (plan.slug === 'free') {
        return NextResponse.json({ error: 'Cannot checkout for free plan' }, { status: 400 });
  }

  // Get or determine Stripe price ID
  const stripePriceId = billing_cycle === 'annual'
      ? plan.stripe_price_id_annual
        : plan.stripe_price_id_monthly;

  const unitAmount = billing_cycle === 'annual'
      ? plan.price_annual_cents
        : plan.price_monthly_cents;

  // Build line items
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = stripePriceId
      ? [{ price: stripePriceId, quantity: 1 }]
        : [{
                  price_data: {
                              currency: 'usd',
                              product_data: { name: plan.name },
                              unit_amount: unitAmount,
                              recurring: {
                                            interval: billing_cycle === 'annual' ? 'year' : 'month',
                              },
                  },
                  quantity: 1,
        }];

  try {
        const stripe = getStripe();

      // Check if user already has a Stripe customer ID
      const { data: existingSub } = await serviceClient
          .from('subscriptions')
          .select('stripe_customer_id')
          .eq('account_id', user.id)
          .not('stripe_customer_id', 'is', null)
          .limit(1)
          .maybeSingle();

      const sessionParams: Stripe.Checkout.SessionCreateParams = {
              mode: 'subscription',
              line_items: lineItems,
              success_url: `${success_url}?session_id={CHECKOUT_SESSION_ID}`,
              cancel_url: cancel_url,
              subscription_data: {
                        trial_period_days: plan.trial_days > 0 ? plan.trial_days : undefined,
                        metadata: {
                                    plan_id: plan.id,
                                    plan_slug: plan.slug,
                                    product_type: plan.product_type,
                                    listing_id: listing_id || '',
                                    account_id: user.id,
                        },
              },
              metadata: {
                        plan_id: plan.id,
                        plan_slug: plan.slug,
                        listing_id: listing_id || '',
                        account_id: user.id,
              },
              allow_promotion_codes: true,
              billing_address_collection: 'auto',
              customer_email: user.email,
      };

      // Re-use existing Stripe customer if available
      if (existingSub?.stripe_customer_id) {
              sessionParams.customer = existingSub.stripe_customer_id;
              delete sessionParams.customer_email;
      }

      const session = await stripe.checkout.sessions.create(sessionParams);

      return NextResponse.json({ url: session.url, session_id: session.id });
  } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Checkout failed';
        console.error('[BILLING] Checkout error:', message);
        return NextResponse.json({ error: message }, { status: 500 });
  }
}
