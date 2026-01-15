import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { nanoid } from 'nanoid';

/**
 * Access Codes API
 * 
 * Admin-only endpoints for managing promo codes
 * 
 * POST /api/admin/access-codes - Generate new code
 * GET /api/admin/access-codes - List all codes
 * PATCH /api/admin/access-codes - Update/deactivate code
 * DELETE /api/admin/access-codes - Delete code
 */

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { 
      codeType = 'promo',
      linkedTier = 'tier1',
      maxUses = 1,
      expiresInDays = null,
      description = '',
      featureOverrides = null,
      customCode = null // Allow custom codes or auto-generate
    } = body;

    // Generate code or use custom
    let code: string;
    if (customCode) {
      // Validate custom code
      if (!/^[A-Z0-9-]{6,30}$/.test(customCode)) {
        return NextResponse.json(
          { error: 'Custom code must be 6-30 characters, uppercase letters, numbers, and hyphens only' },
          { status: 400 }
        );
      }
      code = customCode;
    } else {
      // Auto-generate code based on type
      const prefix = codeType === 'family' ? 'FAMILY' 
                   : codeType === 'beta' ? 'BETA'
                   : codeType === 'lifetime' ? 'LIFETIME'
                   : codeType === 'partner' ? 'PARTNER'
                   : 'PROMO';
      
      const uniqueId = nanoid(8).toUpperCase(); // Cryptographically secure
      code = `${prefix}-${uniqueId}`;
    }

    // Calculate expiration
    let expiresAt = null;
    if (expiresInDays) {
      const expDate = new Date();
      expDate.setDate(expDate.getDate() + expiresInDays);
      expiresAt = expDate.toISOString();
    }

    // Create code
    const { data: accessCode, error } = await supabase
      .from('access_codes')
      .insert({
        code,
        max_uses: maxUses,
        linked_tier: linkedTier,
        code_type: codeType,
        description,
        expires_at: expiresAt,
        feature_overrides: featureOverrides,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('[Access Codes API] Create error:', error);
      if (error.code === '23505') { // Unique violation
        return NextResponse.json(
          { error: 'Code already exists' },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      code: accessCode,
    });

  } catch (error: any) {
    console.error('[Access Codes API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const codeType = searchParams.get('type');
    const activeOnly = searchParams.get('activeOnly') === 'true';

    let query = supabase
      .from('access_codes')
      .select('*, code_redemptions(count)')
      .order('created_at', { ascending: false });

    if (codeType) {
      query = query.eq('code_type', codeType);
    }

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data: codes, error } = await query;

    if (error) {
      console.error('[Access Codes API] List error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      codes: codes || [],
    });

  } catch (error: any) {
    console.error('[Access Codes API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { codeId, updates } = body;

    if (!codeId) {
      return NextResponse.json(
        { error: 'Code ID required' },
        { status: 400 }
      );
    }

    const { data: code, error } = await supabase
      .from('access_codes')
      .update(updates)
      .eq('id', codeId)
      .select()
      .single();

    if (error) {
      console.error('[Access Codes API] Update error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      code,
    });

  } catch (error: any) {
    console.error('[Access Codes API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const codeId = searchParams.get('id');

    if (!codeId) {
      return NextResponse.json(
        { error: 'Code ID required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('access_codes')
      .delete()
      .eq('id', codeId);

    if (error) {
      console.error('[Access Codes API] Delete error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
    });

  } catch (error: any) {
    console.error('[Access Codes API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
