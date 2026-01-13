import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendEmail, generateVerificationToken, getVerificationEmailHtml } from '@/lib/email/gmail-sender';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://greenline365.com';

// GET /api/waitlist - Fetch waitlist submissions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    
    const supabase = await createClient();
    
    let query = supabase
      .from('waitlist_submissions')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch waitlist' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ submissions: data, count: data?.length || 0 });
  } catch (error) {
    console.error('Error fetching waitlist:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, company, industry } = body;

    // Validate required fields
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Create Supabase client
    const supabase = await createClient();

    // Check if already on waitlist and verified
    const { data: existing } = await supabase
      .from('waitlist_submissions')
      .select('*')
      .eq('email', normalizedEmail)
      .single();

    if (existing?.verified) {
      return NextResponse.json(
        { message: 'You are already on the waitlist!', alreadyVerified: true },
        { status: 200 }
      );
    }

    // Generate verification token
    const token = generateVerificationToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    // Upsert waitlist submission (pending until verified)
    const { data, error } = await supabase
      .from('waitlist_submissions')
      .upsert({
        email: normalizedEmail,
        name: name || null,
        company: company || null,
        industry: industry || null,
        source: 'website',
        status: 'pending',
        verified: false,
        verification_token: token,
        verification_expires: expiresAt,
        created_at: existing?.created_at || new Date().toISOString(),
      }, {
        onConflict: 'email',
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to join waitlist' },
        { status: 500 }
      );
    }

    // Send verification email
    const verificationUrl = `${SITE_URL}/verify-email/${token}`;
    const emailResult = await sendEmail({
      to: normalizedEmail,
      subject: 'Verify your email - GreenLine365 Waitlist',
      html: getVerificationEmailHtml(name || '', verificationUrl, 'waitlist'),
    });

    if (!emailResult.success) {
      console.error('[Waitlist] Email send failed:', emailResult.error);
      // In dev, still return success
      if (process.env.NODE_ENV === 'development') {
        console.log(`[DEV] Verification URL: ${verificationUrl}`);
      }
    }

    return NextResponse.json(
      { 
        message: 'Please check your email to verify and complete your signup!',
        requiresVerification: true,
        data 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error adding to waitlist:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
