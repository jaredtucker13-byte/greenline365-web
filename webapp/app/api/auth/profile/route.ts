import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';

/**
 * PATCH /api/auth/profile — Update user profile metadata
 */
export async function PATCH(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof Response) return authResult;
  const { supabase } = authResult;

  try {
    const body = await request.json();
    const { full_name, phone, company_name } = body;

    const { error } = await supabase.auth.updateUser({
      data: {
        full_name: full_name || undefined,
        phone: phone || undefined,
        company_name: company_name || undefined,
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
