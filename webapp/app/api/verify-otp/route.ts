import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import crypto from 'crypto';

// Hash the OTP for comparison
function hashOTP(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code } = body;

    // Validate required fields
    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email and code are required' },
        { status: 400 }
      );
    }

    // Validate code format (6 digits)
    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { error: 'Code must be 6 digits' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Find the latest valid OTP for this email
    const { data: otpRecord, error: fetchError } = await supabase
      .from('phone_otp')
      .select('*')
      .eq('email', email)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (fetchError || !otpRecord) {
      return NextResponse.json(
        { 
          status: 'invalid',
          error: 'No valid verification code found. Please request a new code.' 
        },
        { status: 400 }
      );
    }

    // Verify the code
    const codeHash = hashOTP(code);
    if (codeHash !== otpRecord.code_hash) {
      return NextResponse.json(
        { 
          status: 'invalid',
          error: 'That code is not correct. Please try again.' 
        },
        { status: 400 }
      );
    }

    // Mark OTP as used
    await supabase
      .from('phone_otp')
      .update({ used: true })
      .eq('id', otpRecord.id);

    // Update or create user profile with verified status
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();

    if (existingProfile) {
      // Update existing profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          phone: otpRecord.phone,
          phone_verified: true,
          email_verified: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingProfile.id);

      if (updateError) {
        console.error('Error updating profile:', updateError);
        return NextResponse.json(
          { error: 'Failed to update verification status' },
          { status: 500 }
        );
      }
    } else {
      // Create a record in a separate verified_users table for pre-signup verification
      // This handles the case where someone verifies before creating a full account
      const { error: insertError } = await supabase
        .from('waitlist_submissions')
        .upsert({
          email: email,
          name: null,
          source: 'phone_verification',
          status: 'approved',
          metadata: {
            phone: otpRecord.phone,
            phone_verified: true,
            email_verified: true,
            verified_at: new Date().toISOString(),
          }
        }, {
          onConflict: 'email'
        });

      if (insertError) {
        console.error('Error creating verified user record:', insertError);
        // Don't fail - the verification was successful
      }
    }

    return NextResponse.json(
      { 
        status: 'verified',
        message: 'Your phone and email have been verified successfully!',
        phone: otpRecord.phone,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in verify-otp:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
