/**
 * Verify by Code API
 * 
 * POST /api/verify-code
 * Body: { email, code }
 * 
 * Verifies a user's email using the 6-digit code
 * Also syncs verified leads to the CRM automatically
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Sync verified lead to CRM
async function syncToCRM(entry: any) {
  try {
    // Check if lead already exists in CRM
    const { data: existingLead } = await supabase
      .from('crm_leads')
      .select('id')
      .eq('email', entry.email)
      .single();

    if (existingLead) {
      // Update existing lead
      await supabase
        .from('crm_leads')
        .update({
          status: 'verified',
          verified_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingLead.id);
      
      console.log('[CRM Sync] Updated existing lead:', entry.email);
    } else {
      // Create new CRM lead from waitlist data
      const { error: insertError } = await supabase
        .from('crm_leads')
        .insert({
          email: entry.email,
          name: entry.name || null,
          company: entry.company || null,
          source: 'waitlist',
          source_detail: entry.industry || null,
          status: 'verified',
          verified_at: new Date().toISOString(),
          consent_given: true,
          consent_timestamp: new Date().toISOString(),
          tags: ['waitlist'],
        });

      if (insertError) {
        console.error('[CRM Sync] Failed to create lead:', insertError);
      } else {
        console.log('[CRM Sync] Created new lead:', entry.email);
      }
    }
  } catch (err) {
    console.error('[CRM Sync] Error:', err);
    // Don't throw - CRM sync failure shouldn't block verification
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json({ error: 'Email and code are required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find the waitlist entry
    const { data: entry, error: findError } = await supabase
      .from('waitlist_submissions')
      .select('*')
      .eq('email', normalizedEmail)
      .single();

    if (findError || !entry) {
      return NextResponse.json({ error: 'Email not found. Please sign up first.' }, { status: 404 });
    }

    // Check if already verified
    if (entry.verified) {
      return NextResponse.json({ 
        success: true, 
        message: 'Email already verified!',
        alreadyVerified: true 
      });
    }

    // Check if code matches
    if (entry.verification_code !== code) {
      return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
    }

    // Check if expired
    if (entry.verification_expires && new Date(entry.verification_expires) < new Date()) {
      return NextResponse.json({ error: 'Verification code has expired. Please sign up again.' }, { status: 400 });
    }

    // Mark as verified in waitlist
    const { error: updateError } = await supabase
      .from('waitlist_submissions')
      .update({ 
        verified: true,
        status: 'verified',
        verified_at: new Date().toISOString(),
        verification_token: null, // Clear token after use
        verification_code: null,  // Clear code after use
      })
      .eq('email', normalizedEmail);

    if (updateError) {
      console.error('[Verify Code] Update error:', updateError);
      return NextResponse.json({ error: 'Failed to verify email' }, { status: 500 });
    }

    // Sync to CRM automatically
    await syncToCRM({ ...entry, email: normalizedEmail });

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully! Welcome to GreenLine365.',
    });

  } catch (error: any) {
    console.error('[Verify Code] Error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
