import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { createServerClient } from '@/lib/supabase/server';

// PATCH /api/team/[id] — update team member role or listing scope
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;

  const { user } = auth;
  const { id } = await params;
  const serviceClient = createServerClient();
  const body = await request.json();

  // Verify ownership of the membership
  const { data: existing, error: fetchError } = await serviceClient
    .from('account_members')
    .select('id, account_id, status')
    .eq('id', id)
    .eq('account_id', user.id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: 'Team member not found' }, { status: 404 });
  }

  const updates: Record<string, unknown> = {};

  if (body.role_id !== undefined) {
    // Verify the role exists and is not 'owner'
    const { data: role } = await serviceClient
      .from('roles')
      .select('id, slug')
      .eq('id', body.role_id)
      .single();

    if (!role) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }
    if (role.slug === 'owner') {
      return NextResponse.json({ error: 'Cannot assign owner role' }, { status: 400 });
    }
    updates.role_id = body.role_id;
  }

  if (body.listing_ids !== undefined) {
    updates.listing_ids = body.listing_ids;
  }

  if (body.status === 'active' && existing.status === 'invited') {
    updates.status = 'active';
    updates.accepted_at = new Date().toISOString();
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const { data: updated, error } = await serviceClient
    .from('account_members')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ member: updated });
}

// DELETE /api/team/[id] — revoke team member access
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;

  const { user } = auth;
  const { id } = await params;
  const serviceClient = createServerClient();

  // Verify ownership
  const { data: existing, error: fetchError } = await serviceClient
    .from('account_members')
    .select('id, account_id')
    .eq('id', id)
    .eq('account_id', user.id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: 'Team member not found' }, { status: 404 });
  }

  const { error } = await serviceClient
    .from('account_members')
    .update({ status: 'revoked' })
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: 'Team member access revoked' });
}
