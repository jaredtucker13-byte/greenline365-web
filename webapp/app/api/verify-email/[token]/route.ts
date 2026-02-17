/**
 * Verify Email Token API
 * 
 * POST /api/verify-email/[token]
 * Verifies the magic link token from the waitlist signup
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token) {
      return NextResponse.json({ invalid: true, error: 'Token is required' }, { status: 400 });
    }

    console.log('[Verify Token] Looking up token:', token.substring(0, 8) + '...');

    // Find the waitlist entry with this token
    const { data: entry, error: findError } = await supabase
      .from('waitlist_submissions')
      .select('*')
      .eq('verification_token', token)
      .single();

    if (findError || !entry) {
      console.log('[Verify Token] Token not found in database');
      return NextResponse.json({ invalid: true, error: 'Invalid verification token' }, { status: 400 });
    }

    console.log('[Verify Token] Found entry for:', entry.email);

    // Check if already verified
    if (entry.verified) {
      return NextResponse.json({ 
        success: true, 
        message: 'Email already verified!',
        alreadyVerified: true 
      });
    }

    // Check if expired
    if (entry.verification_expires && new Date(entry.verification_expires) < new Date()) {
      console.log('[Verify Token] Token expired');
      return NextResponse.json({ expired: true, error: 'Verification link has expired' }, { status: 400 });
    }

    // Mark as verified
    const { error: updateError } = await supabase
      .from('waitlist_submissions')
      .update({ 
        verified: true,
        status: 'verified',
        verified_at: new Date().toISOString(),
        verification_token: null, // Clear token after use (single-use)
        verification_code: null,  // Clear code too
      })
      .eq('email', entry.email);

    if (updateError) {
      console.error('[Verify Token] Update error:', updateError);
      return NextResponse.json({ error: 'Failed to verify email' }, { status: 500 });
    }

    console.log('[Verify Token] Successfully verified:', entry.email);

    // Sync to CRM (mirrors verify-code route behavior)
    let crmSynced = false;
    try {
      const now = new Date().toISOString();
      const { data: existingLead } = await supabase
        .from('crm_leads')
        .select('id')
        .eq('email', entry.email)
        .maybeSingle();

      if (existingLead) {
        await supabase
          .from('crm_leads')
          .update({ status: 'verified', last_contact_at: now, updated_at: now })
          .eq('id', existingLead.id);
      } else {
        const insertData: Record<string, any> = {
          email: entry.email,
          status: 'verified',
          source: 'waitlist',
          first_contact_at: now,
          last_contact_at: now,
          created_at: now,
          updated_at: now,
          tags: ['waitlist'],
        };
        if (entry.name) insertData.name = entry.name;
        if (entry.company) insertData.company = entry.company;
        if (entry.industry) insertData.metadata = { industry: entry.industry };

        await supabase.from('crm_leads').insert(insertData);
      }
      crmSynced = true;
      console.log('[Verify Token] CRM sync completed for:', entry.email);
    } catch (crmError) {
      console.error('[Verify Token] CRM sync failed (non-blocking):', crmError);
    }

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully! Welcome to GreenLine365.',
      crmSynced,
    });

  } catch (error: any) {
    console.error('[Verify Token] Error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

// Also support GET for direct link clicks
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  return POST(request, { params });
}
