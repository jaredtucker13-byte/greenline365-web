import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
function getServiceClient() { return createClient(supabaseUrl, supabaseServiceKey); }

// GET /api/stripe/status?session_id=xxx - Check payment status
export async function GET(request: NextRequest) {
  const supabase = getServiceClient();
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('session_id');

  if (!sessionId) {
    return NextResponse.json({ error: 'session_id required' }, { status: 400 });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    const result = {
      status: session.status,
      payment_status: session.payment_status,
      amount_total: session.amount_total,
      currency: session.currency,
      customer_email: session.customer_details?.email,
      metadata: session.metadata,
    };

    // Update payment transaction and directory listing if paid
    if (session.payment_status === 'paid' && session.metadata?.listing_id) {
      // Update directory listing tier
      await supabase.from('directory_listings').update({
        tier: session.metadata.tier,
        tier_started_at: new Date().toISOString(),
        is_claimed: true,
        claimed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('id', session.metadata.listing_id);

      // Update CRM lead as golden customer
      if (session.customer_details?.email) {
        await supabase.from('crm_leads').update({
          status: 'converted',
          tags: ['golden_customer', `tier_${session.metadata.tier}`, 'paid'],
          value: (session.amount_total || 0) / 100,
          converted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }).eq('email', session.customer_details.email);
      }

      // Update payment transaction
      await supabase.from('payment_transactions').update({
        status: 'paid',
        customer_email: session.customer_details?.email,
        paid_at: new Date().toISOString(),
      }).eq('session_id', sessionId);

      console.log(`[STRIPE] Payment confirmed: ${session.metadata.tier} tier for listing ${session.metadata.listing_id}`);
    }

    return NextResponse.json(result);

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
