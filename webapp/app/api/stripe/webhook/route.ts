import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

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

// POST /api/stripe/webhook - Handle Stripe webhook events
export async function POST(request: NextRequest) {
      const supabase = getServiceClient();
      const stripe = getStripe();
      const body = await request.text();
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  try {
          if (webhookSecret) {
                    const sig = request.headers.get('stripe-signature')!;
                    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
          } else {
                    event = JSON.parse(body) as Stripe.Event;
          }
  } catch (err: any) {
          console.error('[STRIPE WEBHOOK] Signature verification failed:', err.message);
          return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
  }

  console.log(`[STRIPE WEBHOOK] ${event.type}`);

  switch (event.type) {
              // --- CHECKOUT COMPLETED ---
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

                  // Store Stripe customer ID on businesses table for portal access
                  if (session.customer) {
                                await supabase.from('businesses').update({
                                                stripe_customer_id: session.customer as string,
                                                stripe_subscription_id: session.subscription as string,
                                                subscription_status: 'active',
                                                billing_status: 'active',
                                }).eq('id', listingId);
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

                // Log to audit
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

        // --- RECURRING INVOICE PAID ---
      case 'invoice.payment_succeeded': {
                const invoice = event.data.object as Stripe.Invoice;
                const subscriptionId = (invoice as any).subscription as string;
                console.log(`[STRIPE] Invoice paid: $${(invoice.amount_paid || 0) / 100} for subscription ${subscriptionId}`);

                // Update billing status to active (in case it was past_due)
                if (subscriptionId) {
                            await supabase.from('businesses').update({
                                          subscription_status: 'active',
                                          billing_status: 'active',
                            }).eq('stripe_subscription_id', subscriptionId);
                }
                break;
      }

        // --- RECURRING INVOICE FAILED ---
      case 'invoice.payment_failed': {
                const invoice = event.data.object as Stripe.Invoice;
                const subscriptionId = (invoice as any).subscription as string;
                console.error(`[STRIPE] Invoice payment FAILED: $${(invoice.amount_due || 0) / 100} for subscription ${subscriptionId}`);

                // Mark billing as past_due - Stripe will retry per your dashboard retry settings
                if (subscriptionId) {
                            await supabase.from('businesses').update({
                                          subscription_status: 'past_due',
                                          billing_status: 'past_due',
                            }).eq('stripe_subscription_id', subscriptionId);
                }
                break;
      }

        // --- SUBSCRIPTION UPDATED (upgrade/downgrade) ---
      case 'customer.subscription.updated': {
                const subscription = event.data.object as Stripe.Subscription;
                const listingId = subscription.metadata?.listing_id;
                const newTier = subscription.metadata?.tier;
                const status = subscription.status;

                console.log(`[STRIPE] Subscription updated: status=${status}, tier=${newTier}, listing=${listingId}`);

                if (listingId) {
                            await supabase.from('businesses').update({
                                          subscription_status: status,
                                          billing_status: status === 'active' ? 'active' : status,
                            }).eq('stripe_subscription_id', subscription.id);

                  // If tier changed, update the directory listing
                  if (newTier) {
                                await supabase.from('directory_listings').update({
                                                tier: newTier,
                                                updated_at: new Date().toISOString(),
                                }).eq('id', listingId);
                  }
                }
                break;
      }

        // --- SUBSCRIPTION CANCELLED ---
      case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription;
                const listingId = subscription.metadata?.listing_id;

                if (listingId) {
                            // Downgrade to free tier
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
                break;
      }

        // --- SUBSCRIPTION PAUSED ---
      case 'customer.subscription.paused': {
                const subscription = event.data.object as Stripe.Subscription;
                const listingId = subscription.metadata?.listing_id;

                if (listingId) {
                            await supabase.from('businesses').update({
                                          subscription_status: 'paused',
                                          billing_status: 'paused',
                            }).eq('stripe_subscription_id', subscription.id);

                  console.log(`[STRIPE] Subscription paused for listing ${listingId}`);
                }
                break;
      }

        // --- SUBSCRIPTION RESUMED ---
      case 'customer.subscription.resumed': {
                const subscription = event.data.object as Stripe.Subscription;
                const listingId = subscription.metadata?.listing_id;

                if (listingId) {
                            await supabase.from('businesses').update({
                                          subscription_status: 'active',
                                          billing_status: 'active',
                            }).eq('stripe_subscription_id', subscription.id);

                  console.log(`[STRIPE] Subscription resumed for listing ${listingId}`);
                }
                break;
      }

      default:
                console.log(`[STRIPE] Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
