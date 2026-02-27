import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
function getServiceClient() { return createClient(supabaseUrl, supabaseServiceKey); }

// Admin user ID for CRM lead creation (GreenLine365 platform admin)
const ADMIN_EMAIL = 'greenline365help@gmail.com';

/**
 * POST /api/directory/claim — Claim an existing directory listing
 *
 * Flow: User finds their business in the directory → clicks "Claim" →
 * authenticates → this endpoint links the listing to their account.
 *
 * Also creates a CRM lead in the admin dashboard so the team
 * can follow up with the business owner.
 */

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { listing_id } = body;

    if (!listing_id) {
      return NextResponse.json({ error: 'listing_id required' }, { status: 400 });
    }

    const service = getServiceClient();

    // Check if listing exists and is not already claimed
    const { data: listing, error: fetchError } = await service
      .from('directory_listings')
      .select('id, business_name, is_claimed, claimed_by, industry, city, state, phone')
      .eq('id', listing_id)
      .single();

    if (fetchError || !listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    if (listing.is_claimed && listing.claimed_by && listing.claimed_by !== user.id) {
      return NextResponse.json({ error: 'This listing has already been claimed by another user' }, { status: 409 });
    }

    if (listing.claimed_by === user.id) {
      return NextResponse.json({ error: 'You already own this listing', listing_id }, { status: 200 });
    }

    // Claim the listing
    const now = new Date().toISOString();
    const { data: updated, error: updateError } = await service
      .from('directory_listings')
      .update({
        is_claimed: true,
        claimed_by: user.id,
        tenant_id: user.id,
        updated_at: now,
      })
      .eq('id', listing_id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Create a CRM lead for the admin so the claim shows up in the dashboard
    try {
      // Find the admin user to associate the lead with
      const { data: adminUser } = await service
        .from('auth.users')
        .select('id')
        .eq('email', ADMIN_EMAIL)
        .maybeSingle();

      // Use admin ID if found, otherwise use a service-level insert
      const adminId = adminUser?.id;

      if (adminId) {
        await service
          .from('crm_leads')
          .upsert({
            user_id: adminId,
            email: user.email || '',
            name: user.user_metadata?.full_name || user.email || 'Unknown',
            phone: listing.phone || null,
            company: listing.business_name,
            source: 'directory_claim',
            status: 'new',
            tags: ['directory-claim', listing.industry || 'services'],
            notes: `Claimed listing "${listing.business_name}" in ${listing.city || 'Unknown'}, ${listing.state || 'FL'}. Listing ID: ${listing.id}`,
            metadata: {
              listing_id: listing.id,
              listing_name: listing.business_name,
              industry: listing.industry,
              city: listing.city,
              state: listing.state,
              claimed_at: now,
              claimer_user_id: user.id,
            },
            first_contact_at: now,
            created_at: now,
            updated_at: now,
          }, {
            onConflict: 'user_id,email',
            ignoreDuplicates: true,
          });
      }
    } catch (crmError) {
      // Don't fail the claim if CRM lead creation fails
      console.error('[Claim] CRM lead creation failed:', crmError);
    }

    return NextResponse.json({
      success: true,
      message: `Successfully claimed "${listing.business_name}"`,
      listing: updated,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
