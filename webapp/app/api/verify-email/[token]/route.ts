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

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully! Welcome to GreenLine365.',
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
