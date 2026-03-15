import { createClient } from '@/lib/supabase/server';
import { sendEmail, generateVerificationCode, getVerificationEmailHtml } from '@/lib/email/sendgrid-sender';
import { NextResponse } from 'next/server';

/**
 * POST /api/auth/verify-email
 * Sends a verification email with a 6-digit code
 */
export async function POST() {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  // Check if already verified
  const { data: profile } = await supabase
    .from('profiles')
    .select('email_verified')
    .eq('id', user.id)
    .single();

  if (profile?.email_verified) {
    return NextResponse.json({ error: 'Email already verified' }, { status: 400 });
  }

  // Generate code
  const code = generateVerificationCode();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  // Invalidate previous codes
  await supabase
    .from('email_verification_codes')
    .update({ used: true })
    .eq('user_id', user.id)
    .eq('used', false);

  // Store new code
  const { error: insertError } = await supabase
    .from('email_verification_codes')
    .insert({
      user_id: user.id,
      email: user.email,
      code,
      expires_at: expiresAt,
    });

  if (insertError) {
    console.error('[Verify Email] Failed to store code:', insertError);
    return NextResponse.json({ error: 'Failed to generate verification code' }, { status: 500 });
  }

  // Send email
  const fullName = user.user_metadata?.full_name || '';
  const verificationUrl = ''; // Not using magic links for this flow
  const html = getVerificationEmailHtml(fullName, verificationUrl, code, 'signup', user.email);

  const result = await sendEmail({
    to: user.email!,
    subject: 'Action Required: Verify your Greenline365 Account',
    html,
  });

  if (!result.success) {
    return NextResponse.json({ error: result.error || 'Failed to send email' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

/**
 * PUT /api/auth/verify-email
 * Verifies the 6-digit code and marks email as verified
 */
export async function PUT(request: Request) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const { code } = await request.json();
  if (!code || typeof code !== 'string') {
    return NextResponse.json({ error: 'Verification code is required' }, { status: 400 });
  }

  // Look up the code
  const { data: verification } = await supabase
    .from('email_verification_codes')
    .select('*')
    .eq('user_id', user.id)
    .eq('code', code.trim())
    .eq('used', false)
    .gte('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!verification) {
    return NextResponse.json({ error: 'Invalid or expired verification code' }, { status: 400 });
  }

  // Mark code as used
  await supabase
    .from('email_verification_codes')
    .update({ used: true })
    .eq('id', verification.id);

  // Mark profile as verified
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ email_verified: true, updated_at: new Date().toISOString() })
    .eq('id', user.id);

  if (updateError) {
    console.error('[Verify Email] Failed to update profile:', updateError);
    return NextResponse.json({ error: 'Failed to verify email' }, { status: 500 });
  }

  // Link consumer_profiles if one exists with same email
  await supabase
    .from('consumer_profiles')
    .update({ user_id: user.id })
    .eq('email', user.email)
    .is('user_id', null);

  // Get profile to determine redirect
  const { data: profile } = await supabase
    .from('profiles')
    .select('account_type, is_admin')
    .eq('id', user.id)
    .single();

  let redirectTo = '/portal/consumer';
  if (profile?.is_admin) {
    redirectTo = '/admin-v2';
  } else if (profile?.account_type === 'business') {
    redirectTo = '/admin-v2';
  }

  return NextResponse.json({ success: true, redirectTo });
}
