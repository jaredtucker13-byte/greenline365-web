import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
function getServiceClient() { return createClient(supabaseUrl, supabaseServiceKey); }

// POST /api/stripe/webhook - Handle Stripe webhook events
export async function POST(request: NextRequest) {
  const supabase = getServiceClient();
  const body = await request.text();

  // For now, parse without signature verification (add webhook secret later)
  let event: Stripe.Event;
  try {
    event = JSON.parse(body) as Stripe.Event;
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  console.log(`[STRIPE WEBHOOK] ${event.type}`);

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const tier = session.metadata?.tier;
      const listingId = session.metadata?.listing_id;

      if (tier && listingId) {
        // Upgrade directory listing
        await supabase.from('directory_listings').update({
          tier,
          tier_started_at: new Date().toISOString(),
          is_claimed: true,
          updated_at: new Date().toISOString(),
        }).eq('id', listingId);

        // Mark as golden customer in CRM
        if (session.customer_details?.email) {
          await supabase.from('crm_leads').update({
            status: 'converted',
            tags: ['golden_customer', `tier_${tier}`, 'paid'],
            value: (session.amount_total || 0) / 100,
            converted_at: new Date().toISOString(),
          }).eq('email', session.customer_details.email);
        }

        console.log(`[STRIPE] Subscription activated: ${tier} for listing ${listingId}`);
      }

      // Log transaction
      await supabase.from('audit_logs').insert({
        tenant_id: (await supabase.from('businesses').select('id').limit(1).single()).data?.id,
        action: 'payment_received',
        entity_type: 'directory_listing',
        entity_id: listingId,
        details: { tier, amount: session.amount_total, email: session.customer_details?.email },
      }).catch(() => {});

      break;
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice;
      console.log(`[STRIPE] Invoice paid: $${(invoice.amount_paid || 0) / 100}`);
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const listingId = subscription.metadata?.listing_id;
      if (listingId) {
        // Downgrade to free tier
        await supabase.from('directory_listings').update({
          tier: 'free',
          updated_at: new Date().toISOString(),
        }).eq('id', listingId);
        console.log(`[STRIPE] Subscription cancelled for listing ${listingId}`);
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
