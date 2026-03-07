import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';

/**
 * Code Redemption API
 *
 * POST /api/redeem-code - Validate and redeem a code (auth required)
 * GET  /api/redeem-code - Validate a code without redeeming (auth + rate-limited)
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
      return NextResponse.json({ error: 'Failed to redeem code' }, { status: 500 });
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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Validate code without redeeming (for preview) - requires auth + rate-limited
export async function GET(request: NextRequest) {
  // Rate limit: 5 attempts per minute per IP to prevent enumeration
  const rl = rateLimit(request, { max: 5, windowMs: 60_000 });
  if (!rl.allowed) return rateLimitResponse(rl.retryAfter);

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json(
        { error: 'Code required' },
        { status: 400 }
      );
    }

    const { data: accessCode, error } = await supabase
      .from('access_codes')
      .select('id, code, linked_tier, code_type, description, max_uses, current_uses, expires_at, is_active')
      .eq('code', code.toUpperCase().trim())
      .single();

    if (error || !accessCode) {
      // Return generic error to prevent code enumeration
      return NextResponse.json(
        { valid: false, error: 'Invalid code' },
        { status: 404 }
      );
    }

    // Check validity
    const isExpired = accessCode.expires_at && new Date(accessCode.expires_at) < new Date();
    const isMaxedOut = accessCode.current_uses >= accessCode.max_uses;
    const isValid = accessCode.is_active && !isExpired && !isMaxedOut;

    // Return minimal info - don't expose internal details like usesRemaining
    return NextResponse.json({
      valid: isValid,
      tier: isValid ? accessCode.linked_tier : undefined,
      codeType: isValid ? accessCode.code_type : undefined,
      description: isValid ? accessCode.description : undefined,
      ...(isExpired && { error: 'Code has expired' }),
      ...(isMaxedOut && { error: 'Code has reached maximum uses' }),
      ...(!accessCode.is_active && { error: 'Code is no longer active' }),
    });

  } catch (error: any) {
    console.error('[Validate Code API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
