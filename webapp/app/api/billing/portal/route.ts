import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { requireAuth } from '@/lib/auth/middleware';
import { createServerClient } from '@/lib/supabase/server';

function getStripe() {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error('STRIPE_SECRET_KEY is not set');
    return new Stripe(key);
}

// POST /api/billing/portal — create Stripe customer portal session
export async function POST(request: NextRequest) {
    const auth = await requireAuth(request);
    if (auth instanceof Response) return auth;

  const { user } = auth;
    const body = await request.json();
    const { return_url } = body;

  if (!return_url) {
        return NextResponse.json({ error: 'return_url is required' }, { status: 400 });
  }

  const serviceClient = createServerClient();

  // Find the user's Stripe customer ID from their subscriptions
  const { data: sub } = await serviceClient
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('account_id', user.id)
      .not('stripe_customer_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

  if (!sub?.stripe_customer_id) {
        return NextResponse.json(
          { error: 'No billing account found. You may not have an active subscription.' },
          { status: 404 }
              );
  }

  try {
        const stripe = getStripe();
        const portalSession = await stripe.billingPortal.sessions.create({
                customer: sub.stripe_customer_id,
                return_url,
        });

      return NextResponse.json({ url: portalSession.url });
  } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Portal session creation failed';
        console.error('[BILLING] Portal error:', message);
        return NextResponse.json({ error: message }, { status: 500 });
  }
}
