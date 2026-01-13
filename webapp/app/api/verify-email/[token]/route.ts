/**
 * Verify Email Token API
 * 
 * POST /api/verify-email/[token]
 * Marks the email as verified in the database
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

    // Find the verification record
    const { data: verification, error: findError } = await supabase
      .from('email_verifications')
      .select('*')
      .eq('token', token)
      .single();

    if (findError || !verification) {
      return NextResponse.json({ invalid: true, error: 'Invalid verification token' }, { status: 400 });
    }

    // Check if already verified
    if (verification.verified) {
      return NextResponse.json({ 
        success: true, 
        message: 'Email already verified',
        alreadyVerified: true 
      });
    }

    // Check if expired
    if (new Date(verification.expires_at) < new Date()) {
      return NextResponse.json({ expired: true, error: 'Verification link has expired' }, { status: 400 });
    }

    // Mark as verified
    const { error: updateError } = await supabase
      .from('email_verifications')
      .update({ 
        verified: true,
        verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('token', token);

    if (updateError) {
      console.error('[Verify Token] Update error:', updateError);
      return NextResponse.json({ error: 'Failed to verify email' }, { status: 500 });
    }

    // Also update the source table (waitlist, newsletter, etc.)
    const { source, email, name, metadata } = verification;
    
    // Insert into the appropriate table based on source
    if (source === 'waitlist') {
      await supabase.from('waitlist').upsert({
        email,
        name,
        verified: true,
        metadata,
        created_at: verification.created_at,
      }, { onConflict: 'email' });
    } else if (source === 'newsletter') {
      await supabase.from('newsletter_subscribers').upsert({
        email,
        name,
        verified: true,
        subscribed_at: new Date().toISOString(),
      }, { onConflict: 'email' });
    }
    // Add more sources as needed

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully!',
    });

  } catch (error: any) {
    console.error('[Verify Token] Error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
