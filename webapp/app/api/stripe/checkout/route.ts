import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
function getServiceClient() { return createClient(supabaseUrl, supabaseServiceKey); }

// Directory tier pricing (defined server-side only — never trust frontend amounts)
const DIRECTORY_TIERS: Record<string, { name: string; price: number; features: string[] }> = {
  growth: {
    name: 'GL365 Growth',
    price: 299.00,
    features: ['Multi-category listing', 'Media gallery (15 photos)', '5 AI SEO blogs/mo', 'SMS/Email lead alerts', 'XP tracking dashboard'],
  },
  authority: {
    name: 'GL365 Authority',
    price: 599.00,
    features: ['Everything in Growth', 'Neighborhood leaderboard', '15 AI SEO blogs/mo', 'AI sentiment analysis', 'Zip code boost', 'AI auto-responder'],
  },
  dominator: {
    name: 'GL365 Dominator',
    price: 899.00,
    features: ['Everything in Authority', 'Unlimited AI SEO blogs', 'Neighborhood King badge', 'AI auto-dispatch', 'Competitor benchmarking', 'VIP featured placement'],
  },
};

// POST /api/stripe/checkout - Create checkout session for directory subscription
export async function POST(request: NextRequest) {
  const supabase = getServiceClient();
  const body = await request.json();
  const { tier, listing_id, origin_url } = body;

  if (!tier || !DIRECTORY_TIERS[tier]) {
    return NextResponse.json({ error: 'Invalid tier. Use: growth, authority, dominator' }, { status: 400 });
  }

  if (!origin_url) {
    return NextResponse.json({ error: 'origin_url required' }, { status: 400 });
  }

  const tierInfo = DIRECTORY_TIERS[tier];
  const successUrl = `${origin_url}/directory?payment=success&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${origin_url}/directory?payment=cancelled`;

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
