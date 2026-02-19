import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

function getStripe() { return new Stripe(process.env.STRIPE_SECRET_KEY!); }
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
function getServiceClient() { return createClient(supabaseUrl, supabaseServiceKey); }

// Map tiers to Stripe Price IDs (created in Stripe Dashboard)
// Fallback: if env vars not set, create prices dynamically (backward compatible)
const DIRECTORY_TIERS: Record<string, { name: string; price: number; stripePriceId?: string; features: string[] }> = {
    pro: {
          name: 'GL365 Pro',
          price: 45.00,
          stripePriceId: process.env.STRIPE_PRO_PRICE_ID,
          features: ['Verified Business badge', 'CTA buttons (Book/Call)', 'Priority search ranking', 'Unlimited photos', 'Marketplace add-on access'],
    },
    premium: {
          name: 'GL365 Premium',
          price: 89.00,
          stripePriceId: process.env.STRIPE_PREMIUM_PRICE_ID,
          features: ['All Google photos synced', 'Featured homepage placement', 'Badge earning eligible', 'Analytics dashboard', 'Lead capture forms', 'Priority support'],
    },
};

// POST /api/stripe/checkout - Create checkout session for directory subscription
export async function POST(request: NextRequest) {
    const supabase = getServiceClient();
    const body = await request.json();
    const { tier, listing_id, origin_url } = body;

  if (!tier || !DIRECTORY_TIERS[tier]) {
        return NextResponse.json({ error: 'Invalid tier. Use: pro, premium' }, { status: 400 });
  }
    if (!origin_url) {
          return NextResponse.json({ error: 'origin_url required' }, { status: 400 });
    }

  const tierInfo = DIRECTORY_TIERS[tier];
    const successUrl = `${origin_url}/register-business/success?payment=success&tier=${tier}&listing=${listing_id || ''}&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${origin_url}/register-business?tier=${tier}`;

  try {
        // Build line items - use pre-created Price ID if available, otherwise dynamic
      const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = tierInfo.stripePriceId
          ? [{ price: tierInfo.stripePriceId, quantity: 1 }]
              : [{
                          price_data: {
                                        currency: 'usd',
                                        product_data: {
                                                        name: tierInfo.name,
                                                        description: tierInfo.features.join(' | '),
                                        },
                                        unit_amount: Math.round(tierInfo.price * 100),
                                        recurring: { interval: 'month' },
                          },
                          quantity: 1,
              }];

      // Create Stripe checkout session with recurring subscription
      const session = await getStripe().checkout.sessions.create({
              mode: 'subscription',
              line_items: lineItems,
              subscription_data: {
                        metadata: {
                                    tier,
                                    listing_id: listing_id || '',
                                    platform: 'gl365_directory',
                        },
              },
              success_url: successUrl,
              cancel_url: cancelUrl,
              metadata: {
                        tier,
                        listing_id: listing_id || '',
                        platform: 'gl365_directory',
              },
              // Allow promo codes for coupon support
              allow_promotion_codes: true,
              // Collect billing address for tax compliance
              billing_address_collection: 'auto',
      });

      // Create payment transaction record
      try {
              await supabase.from('payment_transactions').insert({
                        session_id: session.id,
                        listing_id: listing_id || null,
                        tier,
                        amount: tierInfo.price,
                        currency: 'usd',
                        platform_fee: 0.60,
                        status: 'pending',
                        metadata: { tier, listing_id, features: tierInfo.features },
                        created_at: new Date().toISOString(),
              });
      } catch {
              console.log('[STRIPE] payment_transactions table not ready');
      }

      return NextResponse.json({ url: session.url, session_id: session.id });

  } catch (err: any) {
        console.error('[STRIPE] Checkout error:', err.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// GET /api/stripe/checkout - Get available tiers
export async function GET() {
    return NextResponse.json({
          tiers: Object.entries(DIRECTORY_TIERS).map(([key, tier]) => ({
                  id: key,
                  name: tier.name,
                  price: tier.price,
                  features: tier.features,
          })),
    });
}
