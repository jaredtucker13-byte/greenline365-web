import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
function getServiceClient() { return createClient(supabaseUrl, supabaseServiceKey); }

// Public directory tier pricing (defined server-side only — never trust frontend amounts)
// NOTE: Backend service bundles ($1.5k-$2.5k/mo) are INTERNAL ONLY — see /docs/PRICING_STACK.md
const DIRECTORY_TIERS: Record<string, { name: string; price: number; features: string[] }> = {
  pro: {
    name: 'GL365 Pro',
    price: 45.00,
    features: ['Verified Business badge', 'CTA buttons (Book/Call)', 'Priority search ranking', 'Unlimited photos', 'Marketplace add-on access'],
  },
  premium: {
    name: 'GL365 Premium',
    price: 89.00,
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
    // Create Stripe checkout session with recurring subscription
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{
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
      }],
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
      ...tier,
    })),
  });
}
