/**
 * Verify by Code API
 * 
 * POST /api/verify-code
 * Body: { email, code }
 * 
 * Verifies a user's email using the 6-digit code
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
    if (new Date(entry.verification_expires) < new Date()) {
      return NextResponse.json({ error: 'Verification code has expired. Please sign up again.' }, { status: 400 });
    }

    // Mark as verified
    const { error: updateError } = await supabase
      .from('waitlist_submissions')
      .update({ 
        verified: true,
        status: 'verified',
        verified_at: new Date().toISOString(),
      })
      .eq('email', normalizedEmail);

    if (updateError) {
      console.error('[Verify Code] Update error:', updateError);
      return NextResponse.json({ error: 'Failed to verify email' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully! Welcome to GreenLine365.',
    });

  } catch (error: any) {
    console.error('[Verify Code] Error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
