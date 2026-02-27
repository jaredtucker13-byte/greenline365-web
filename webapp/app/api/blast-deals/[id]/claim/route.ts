/**
 * Blast Deal Claim API
 *
 * POST - Claim a deal (consumer scans QR code or clicks link)
 *
 * Flow:
 * 1. Consumer provides email (min) to claim
 * 2. Creates/updates consumer profile
 * 3. Records the claim
 * 4. Links consumer to business
 * 5. Increments deal claim count
 * 6. Triggers email sequence (GL365 branded, featuring the business)
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: dealId } = await params;
    const body = await request.json();
    const {
      email,
      name,
      phone,
      zip_code,
      source = 'qr_scan',
    } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required to claim this deal' },
        { status: 400 }
      );
    }

    // 1. Verify the deal exists and is claimable
    const { data: deal, error: dealError } = await supabase
      .from('blast_deals')
      .select('*')
      .eq('id', dealId)
      .single();

    if (dealError || !deal) {
      return NextResponse.json(
        { error: 'Deal not found' },
        { status: 404 }
      );
    }

    if (deal.status !== 'active') {
      return NextResponse.json(
        { error: `This deal is ${deal.status}` },
        { status: 400 }
      );
    }

    if (new Date(deal.expires_at) < new Date()) {
      // Auto-expire
      await supabase
        .from('blast_deals')
        .update({ status: 'expired' })
        .eq('id', dealId);
      return NextResponse.json(
        { error: 'This deal has expired' },
        { status: 400 }
      );
    }

    if (deal.max_claims && deal.current_claims >= deal.max_claims) {
      await supabase
        .from('blast_deals')
        .update({ status: 'sold_out' })
        .eq('id', dealId);
      return NextResponse.json(
        { error: 'This deal is sold out!' },
        { status: 400 }
      );
    }

    // 2. Check for duplicate claim
    const { data: existingClaim } = await supabase
      .from('deal_claims')
      .select('id')
      .eq('deal_id', dealId)
      .eq('consumer_email', email.toLowerCase())
      .maybeSingle();

    if (existingClaim) {
      return NextResponse.json(
        { error: "You've already claimed this deal!", claim_id: existingClaim.id },
        { status: 409 }
      );
    }

    // 3. Create or update consumer profile
    const { data: consumer } = await supabase
      .from('consumer_profiles')
      .upsert(
        {
          email: email.toLowerCase(),
          full_name: name || null,
          phone: phone || null,
          zip_code: zip_code || null,
          first_business_id: deal.business_id,
          total_claims: 1,
        },
        { onConflict: 'email' }
      )
      .select()
      .single();

    // If consumer already existed, increment their claim count
    if (consumer && consumer.total_claims > 0) {
      await supabase
        .from('consumer_profiles')
        .update({
          total_claims: (consumer.total_claims || 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', consumer.id);
    }

    // 4. Record the claim
    const { data: claim, error: claimError } = await supabase
      .from('deal_claims')
      .insert({
        deal_id: dealId,
        consumer_id: consumer?.id || null,
        consumer_email: email.toLowerCase(),
        consumer_name: name || null,
        consumer_phone: phone || null,
        claim_code: deal.claim_code,
        source,
        sequence_status: deal.sequence_enabled ? 'pending' : 'completed',
        device_info: {},
      })
      .select()
      .single();

    if (claimError) throw claimError;

    // 5. Increment deal claim count
    await supabase
      .from('blast_deals')
      .update({
        current_claims: (deal.current_claims || 0) + 1,
        scans: (deal.scans || 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', dealId);

    // 6. Create/update consumer-business link
    if (consumer?.id) {
      const { data: existingLink } = await supabase
        .from('consumer_business_links')
        .select('id, total_claims')
        .eq('consumer_id', consumer.id)
        .eq('business_id', deal.business_id)
        .maybeSingle();

      if (existingLink) {
        await supabase
          .from('consumer_business_links')
          .update({
            total_claims: (existingLink.total_claims || 0) + 1,
            last_interaction_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingLink.id);
      } else {
        await supabase
          .from('consumer_business_links')
          .insert({
            consumer_id: consumer.id,
            business_id: deal.business_id,
            listing_id: deal.listing_id,
          });
      }
    }

    // 7. Auto-mark sold out if max reached
    if (deal.max_claims && (deal.current_claims || 0) + 1 >= deal.max_claims) {
      await supabase
        .from('blast_deals')
        .update({ status: 'sold_out' })
        .eq('id', dealId);
    }

    return NextResponse.json({
      success: true,
      claim: {
        id: claim.id,
        deal_title: deal.title,
        deal_value: deal.deal_value,
        claim_code: deal.claim_code,
        expires_at: deal.expires_at,
        time_window: deal.time_window,
        terms: deal.terms,
      },
      message: `Deal claimed! Show code ${deal.claim_code} when you visit.`,
      remaining: deal.max_claims ? deal.max_claims - (deal.current_claims || 0) - 1 : null,
    });
  } catch (error: any) {
    console.error('Claim deal error:', error);
    return NextResponse.json(
      { error: 'Failed to claim deal', details: error.message },
      { status: 500 }
    );
  }
}
