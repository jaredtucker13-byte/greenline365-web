import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

function getStripe() { return new Stripe(process.env.STRIPE_SECRET_KEY!); }
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
function getServiceClient() { return createClient(supabaseUrl, supabaseServiceKey); }

// POST /api/stripe/portal - Create Stripe Customer Portal session
// Lets customers manage subscriptions: upgrade, downgrade, cancel, update payment method
export async function POST(request: NextRequest) {
    const supabase = getServiceClient();
    const body = await request.json();
    const { listing_id, return_url } = body;

  if (!listing_id) {
        return NextResponse.json({ error: 'listing_id required' }, { status: 400 });
  }
    if (!return_url) {
          return NextResponse.json({ error: 'return_url required' }, { status: 400 });
    }

  try {
        // Look up the Stripe customer ID from the payment_transactions table
      const { data: transaction } = await supabase
          .from('payment_transactions')
          .select('stripe_customer_id')
          .eq('listing_id', listing_id)
          .eq('status', 'paid')
          .not('stripe_customer_id', 'is', null)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

      // Also check the businesses table
      let stripeCustomerId = transaction?.stripe_customer_id;

      if (!stripeCustomerId) {
              const { data: business } = await supabase
                .from('businesses')
                .select('stripe_customer_id')
                .eq('id', listing_id)
                .single();
              stripeCustomerId = business?.stripe_customer_id;
      }

      if (!stripeCustomerId) {
              return NextResponse.json(
                { error: 'No Stripe customer found for this listing. The business may not have an active subscription.' },
                { status: 404 }
                      );
      }

      // Create a Customer Portal session
      const portalSession = await getStripe().billingPortal.sessions.create({
              customer: stripeCustomerId,
              return_url: return_url,
      });

      return NextResponse.json({ url: portalSession.url });

  } catch (err: any) {
        console.error('[STRIPE] Portal error:', err.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
