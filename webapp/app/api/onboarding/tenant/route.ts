import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Tenant Onboarding - Upsert Logic
 *
 * POST /api/onboarding/tenant
 *
 * Check if business_email or domain exists in tenants table.
 * - If Exists: Toggle has_booking_suite = true. Do not overwrite existing profile data.
 * - If New: Create a new UUID and record with plan_level = 'trial_pro'.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
function getServiceClient() { return createClient(supabaseUrl, supabaseServiceKey); }

interface OnboardingRequest {
  business_email: string;
  domain?: string;
  business_name?: string;
  owner_name?: string;
  owner_email?: string;
  plan_level?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: OnboardingRequest = await request.json();
    const { business_email, domain, business_name, owner_name, owner_email, plan_level } = body;

    if (!business_email) {
      return NextResponse.json({ error: 'business_email is required' }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(business_email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    const supabase = getServiceClient();

    // Call the upsert function
    const { data, error } = await supabase.rpc('upsert_booking_tenant', {
      p_business_email: business_email,
      p_domain: domain || null,
      p_business_name: business_name || null,
      p_owner_name: owner_name || null,
      p_owner_email: owner_email || business_email,
      p_plan_level: plan_level || 'trial_pro',
    });

    if (error) {
      console.error('[Tenant Onboarding] RPC error:', error);

      // Fallback: manual upsert if RPC doesn't exist yet
      return await manualUpsert(supabase, body);
    }

    const result = data?.[0] || data;

    return NextResponse.json({
      success: true,
      tenant_id: result?.tenant_id,
      business_id: result?.business_id,
      is_new: result?.is_new,
      has_booking_suite: result?.has_booking_suite,
      message: result?.is_new
        ? 'New tenant created with trial_pro plan'
        : 'Existing tenant updated - booking suite enabled',
    });
  } catch (error: any) {
    console.error('[Tenant Onboarding] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function manualUpsert(supabase: any, body: OnboardingRequest) {
  const { business_email, domain, business_name, owner_name, owner_email, plan_level } = body;

  // Check if tenant exists by business_email or domain
  let query = supabase
    .from('tenants')
    .select('id, business_name, has_booking_suite')
    .or(`business_email.eq.${business_email}${domain ? `,domain.eq.${domain}` : ''}`)
    .limit(1);

  const { data: existing } = await query;

  if (existing && existing.length > 0) {
    // EXISTS: Toggle has_booking_suite = true, don't overwrite profile
    const tenantId = existing[0].id;

    await supabase
      .from('tenants')
      .update({ has_booking_suite: true, updated_at: new Date().toISOString() })
      .eq('id', tenantId);

    // Also update businesses table
    await supabase
      .from('businesses')
      .update({ has_booking_suite: true, updated_at: new Date().toISOString() })
      .or(`business_email.eq.${business_email}${domain ? `,domain.eq.${domain}` : ''}`);

    return NextResponse.json({
      success: true,
      tenant_id: tenantId,
      is_new: false,
      has_booking_suite: true,
      message: 'Existing tenant updated - booking suite enabled',
    });
  }

  // NEW: Create new record with plan_level = 'trial_pro'
  const { data: newTenant, error: insertError } = await supabase
    .from('tenants')
    .insert({
      business_name: business_name || 'New Business',
      owner_name: owner_name || null,
      owner_email: owner_email || business_email,
      business_email,
      domain: domain || null,
      plan_level: plan_level || 'trial_pro',
      has_booking_suite: true,
      plan: 'pro',
    })
    .select('id')
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // Create corresponding business record
  const slug = (business_name || 'business')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-') + '-' + newTenant.id.substring(0, 8);

  await supabase.from('businesses').insert({
    name: business_name || 'New Business',
    slug,
    tier: 'tier3',
    business_email,
    domain: domain || null,
    plan_level: plan_level || 'trial_pro',
    has_booking_suite: true,
    email: owner_email || business_email,
    settings: {
      features: {
        content_forge: true, mockup_generator: true, social_posting: true,
        crm: true, analytics: true, knowledge_base: true, blog: true,
        email: true, sms: true, bookings: true, ai_receptionist: true, calendar: true,
      },
      limits: { social_posts_per_month: 500, ai_generations_per_month: 200 },
      branding: { primary_color: '#39FF14', logo_url: null },
    },
  });

  return NextResponse.json({
    success: true,
    tenant_id: newTenant.id,
    is_new: true,
    has_booking_suite: true,
    message: 'New tenant created with trial_pro plan',
  });
}
