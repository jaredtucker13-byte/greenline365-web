import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Code Redemption API
 * 
 * Public endpoint for redeeming promo codes during onboarding
 * 
 * POST /api/redeem-code - Validate and redeem a code
 */

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { code, businessId } = body;

    if (!code || !businessId) {
      return NextResponse.json(
        { error: 'Code and business ID required' },
        { status: 400 }
      );
    }

    // Verify user has access to this business
    const { data: access } = await supabase
      .from('user_businesses')
      .select('role')
      .eq('user_id', user.id)
      .eq('business_id', businessId)
      .single();

    if (!access) {
      return NextResponse.json(
        { error: 'Access denied to this business' },
        { status: 403 }
      );
    }

    // Get IP and user agent for audit
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Call the redemption function
    const { data: result, error } = await supabase
      .rpc('redeem_access_code', {
        p_code: code.toUpperCase().trim(),
        p_business_id: businessId,
        p_user_id: user.id,
        p_ip_address: ip,
        p_user_agent: userAgent,
      });

    if (error) {
      console.error('[Redeem Code API] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      tier: result.tier,
      codeType: result.code_type,
      message: 'Code redeemed successfully',
    });

  } catch (error: any) {
    console.error('[Redeem Code API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Validate code without redeeming (for preview)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json(
        { error: 'Code required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check if code exists and is valid (without auth required for preview)
    const { data: accessCode, error } = await supabase
      .from('access_codes')
      .select('id, code, linked_tier, code_type, description, max_uses, current_uses, expires_at, is_active')
      .eq('code', code.toUpperCase().trim())
      .single();

    if (error || !accessCode) {
      return NextResponse.json(
        { valid: false, error: 'Invalid code' },
        { status: 404 }
      );
    }

    // Check validity
    const isExpired = accessCode.expires_at && new Date(accessCode.expires_at) < new Date();
    const isMaxedOut = accessCode.current_uses >= accessCode.max_uses;
    const isValid = accessCode.is_active && !isExpired && !isMaxedOut;

    return NextResponse.json({
      valid: isValid,
      code: accessCode.code,
      tier: accessCode.linked_tier,
      codeType: accessCode.code_type,
      description: accessCode.description,
      usesRemaining: accessCode.max_uses - accessCode.current_uses,
      expiresAt: accessCode.expires_at,
      ...(isExpired && { error: 'Code has expired' }),
      ...(isMaxedOut && { error: 'Code has reached maximum uses' }),
      ...(!accessCode.is_active && { error: 'Code is no longer active' }),
    });

  } catch (error: any) {
    console.error('[Validate Code API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
