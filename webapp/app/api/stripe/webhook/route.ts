import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { bustFeatureCache } from '@/lib/services/feature-resolution';

let _stripe: Stripe | null = null;
function getStripe(): Stripe {
      if (!_stripe) {
              _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
      }
      return _stripe;
}

function getServiceClient() {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
      return createClient(supabaseUrl, supabaseServiceKey);
}

/**
 * Look up account_id from stripe_subscription_id for cache busting.
 */
async function findAccountForStripeSubscription(
  supabase: ReturnType<typeof getServiceClient>,
  stripeSubscriptionId: string
): Promise<{ accountId: string; listingId: string | null } | null> {
  const { data } = await supabase
    .from('subscriptions')
    .select('account_id, listing_id')
    .eq('stripe_subscription_id', stripeSubscriptionId)
    .maybeSingle();
  return data ? { accountId: data.account_id, listingId: data.listing_id } : null;
}

/**
 * Log a webhook event to payment_events for audit trail.
 */
async function logWebhookEvent(
  supabase: ReturnType<typeof getServiceClient>,
  stripeEventId: string,
  eventType: string,
  status: 'processed' | 'skipped' | 'failed',
  rawPayload: unknown
): Promise<void> {
  try {
    await supabase.from('payment_events').insert({
      stripe_event_id: stripeEventId,
      event_type: eventType,
      status,
      amount_cents: 0,
      raw_payload: rawPayload,
    });
  } catch (err) {
    console.error('[STRIPE WEBHOOK] Failed to log event:', err);
  }
}

// POST /api/stripe/webhook - Handle Stripe webhook events
export async function POST(request: NextRequest) {
  const supabase = getServiceClient();
  const stripe = getStripe();
  const body = await request.text();

  // ── 1. Signature verification — ALWAYS required, no fallback ──
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('[STRIPE WEBHOOK] STRIPE_WEBHOOK_SECRET is not configured');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    const sig = request.headers.get('stripe-signature')!;
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    console.error('[STRIPE WEBHOOK] Signature verification failed:', err.message);
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
  }

  console.log(`[STRIPE WEBHOOK] ${event.type} (${event.id})`);

  // ── 2. Idempotency — skip if this event ID was already processed ──
  const { data: existing } = await supabase
    .from('payment_events')
    .select('id')
    .eq('stripe_event_id', event.id)
    .maybeSingle();

  if (existing) {
    console.log(`[STRIPE WEBHOOK] Duplicate, skipping: ${event.id}`);
    return NextResponse.json({ received: true, status: 'duplicate' });
  }

  // ── 3. Process the event ──
  let processingStatus: 'processed' | 'skipped' | 'failed' = 'processed';

  try {
    switch (event.type) {

      // ── checkout.session.completed → set subscription to active ──
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const tier = session.metadata?.tier;
        const listingId = session.metadata?.listing_id;
        const userId = session.metadata?.user_id;

        if (tier && listingId) {
          await supabase.from('directory_listings').update({
            tier,
            tier_started_at: new Date().toISOString(),
            is_claimed: true,
            updated_at: new Date().toISOString(),
          }).eq('id', listingId);

          if (session.customer) {
            await supabase.from('businesses').update({
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: session.subscription as string,
              subscription_status: 'active',
              billing_status: 'active',
            }).eq('id', listingId);
          }

          // Set subscription to active in subscriptions table
          if (session.subscription) {
            await supabase.from('subscriptions').update({
              status: 'active',
              stripe_subscription_id: session.subscription as string,
              stripe_customer_id: session.customer as string,
              updated_at: new Date().toISOString(),
            }).eq('listing_id', listingId);
          }

          // Mark as golden customer in CRM
          if (session.customer_details?.email) {
            await supabase.from('crm_leads').update({
              status: 'converted',
              tags: ['golden_customer', `tier_${tier}`, 'paid'],
              value: (session.amount_total || 0) / 100,
              converted_at: new Date().toISOString(),
            }).eq('email', session.customer_details.email);
          }

          // Bust feature cache for this account
          if (userId) bustFeatureCache(userId, listingId);

          console.log(`[STRIPE] Subscription activated: ${tier} for listing ${listingId}`);
        }

        // Update payment transaction with customer info
        if (session.id) {
          await supabase.from('payment_transactions').update({
            status: 'paid',
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
            customer_email: session.customer_details?.email,
            paid_at: new Date().toISOString(),
          }).eq('session_id', session.id);
        }

        // Audit log
        try {
          await supabase.from('audit_logs').insert({
            tenant_id: listingId,
            action: 'payment_received',
            entity_type: 'directory_listing',
            entity_id: listingId,
            details: { tier, amount: session.amount_total, email: session.customer_details?.email },
          });
        } catch { /* audit_logs may not exist yet */ }

        break;
      }

      // ── customer.subscription.updated → sync status/plan ──
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const listingId = subscription.metadata?.listing_id;
        const newTier = subscription.metadata?.tier;
        const status = subscription.status;

        console.log(`[STRIPE] Subscription updated: status=${status}, tier=${newTier}, listing=${listingId}`);

        // Sync subscriptions table
        await supabase.from('subscriptions').update({
          status: status as any,
          updated_at: new Date().toISOString(),
        }).eq('stripe_subscription_id', subscription.id);

        // Sync businesses table
        await supabase.from('businesses').update({
          subscription_status: status,
          billing_status: status === 'active' ? 'active' : status,
        }).eq('stripe_subscription_id', subscription.id);

        // If tier changed, update directory listing
        if (newTier && listingId) {
          await supabase.from('directory_listings').update({
            tier: newTier,
            updated_at: new Date().toISOString(),
          }).eq('id', listingId);
        }

        // Bust feature cache
        const account = await findAccountForStripeSubscription(supabase, subscription.id);
        if (account) bustFeatureCache(account.accountId, account.listingId ?? undefined);

        break;
      }

      // ── customer.subscription.deleted → set to canceled ──
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const listingId = subscription.metadata?.listing_id;

        // Look up account BEFORE updating (for cache bust)
        const account = await findAccountForStripeSubscription(supabase, subscription.id);

        // Set subscription to canceled
        await supabase.from('subscriptions').update({
          status: 'canceled',
          updated_at: new Date().toISOString(),
        }).eq('stripe_subscription_id', subscription.id);

        if (listingId) {
          await supabase.from('directory_listings').update({
            tier: 'free',
            updated_at: new Date().toISOString(),
          }).eq('id', listingId);

          await supabase.from('businesses').update({
            subscription_status: 'canceled',
            billing_status: 'canceled',
            stripe_subscription_id: null,
          }).eq('id', listingId);

          console.log(`[STRIPE] Subscription cancelled for listing ${listingId}`);
        }

        // Bust feature cache
        if (account) bustFeatureCache(account.accountId, account.listingId ?? undefined);

        break;
      }

      // ── invoice.payment_succeeded → confirm active ──
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = (invoice as any).subscription as string;
        console.log(`[STRIPE] Invoice paid: $${(invoice.amount_paid || 0) / 100} for subscription ${subscriptionId}`);

        if (subscriptionId) {
          // Confirm subscription is active
          await supabase.from('subscriptions').update({
            status: 'active',
            updated_at: new Date().toISOString(),
          }).eq('stripe_subscription_id', subscriptionId);

          await supabase.from('businesses').update({
            subscription_status: 'active',
            billing_status: 'active',
          }).eq('stripe_subscription_id', subscriptionId);

          // Bust feature cache
          const account = await findAccountForStripeSubscription(supabase, subscriptionId);
          if (account) bustFeatureCache(account.accountId, account.listingId ?? undefined);
        }
        break;
      }

      // ── invoice.payment_failed → set to past_due ──
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = (invoice as any).subscription as string;
        console.error(`[STRIPE] Invoice payment FAILED: $${(invoice.amount_due || 0) / 100} for subscription ${subscriptionId}`);

        if (subscriptionId) {
          await supabase.from('subscriptions').update({
            status: 'past_due',
            updated_at: new Date().toISOString(),
          }).eq('stripe_subscription_id', subscriptionId);

          await supabase.from('businesses').update({
            subscription_status: 'past_due',
            billing_status: 'past_due',
          }).eq('stripe_subscription_id', subscriptionId);

          // Bust feature cache
          const account = await findAccountForStripeSubscription(supabase, subscriptionId);
          if (account) bustFeatureCache(account.accountId, account.listingId ?? undefined);
        }
        break;
      }

      // ── customer.subscription.paused ──
      case 'customer.subscription.paused': {
        const subscription = event.data.object as Stripe.Subscription;
        const listingId = subscription.metadata?.listing_id;

        await supabase.from('subscriptions').update({
          status: 'paused' as any,
          updated_at: new Date().toISOString(),
        }).eq('stripe_subscription_id', subscription.id);

        await supabase.from('businesses').update({
          subscription_status: 'paused',
          billing_status: 'paused',
        }).eq('stripe_subscription_id', subscription.id);

        console.log(`[STRIPE] Subscription paused for listing ${listingId}`);

        // Bust feature cache
        const account = await findAccountForStripeSubscription(supabase, subscription.id);
        if (account) bustFeatureCache(account.accountId, account.listingId ?? undefined);

        break;
      }

      // ── customer.subscription.resumed ──
      case 'customer.subscription.resumed': {
        const subscription = event.data.object as Stripe.Subscription;
        const listingId = subscription.metadata?.listing_id;

        await supabase.from('subscriptions').update({
          status: 'active',
          updated_at: new Date().toISOString(),
        }).eq('stripe_subscription_id', subscription.id);

        await supabase.from('businesses').update({
          subscription_status: 'active',
          billing_status: 'active',
        }).eq('stripe_subscription_id', subscription.id);

        console.log(`[STRIPE] Subscription resumed for listing ${listingId}`);

        // Bust feature cache
        const account = await findAccountForStripeSubscription(supabase, subscription.id);
        if (account) bustFeatureCache(account.accountId, account.listingId ?? undefined);

        break;
      }

      default:
        console.log(`[STRIPE] Unhandled event type: ${event.type}`);
        processingStatus = 'skipped';
    }
  } catch (err: any) {
    console.error(`[STRIPE WEBHOOK] Error processing ${event.type}:`, err.message);
    processingStatus = 'failed';
    // Log the failed event before returning error
    await logWebhookEvent(supabase, event.id, event.type, 'failed', event);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }

  // ── 4. Log the processed/skipped event ──
  await logWebhookEvent(supabase, event.id, event.type, processingStatus, event);

  return NextResponse.json({ received: true });
}
