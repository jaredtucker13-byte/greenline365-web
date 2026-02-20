import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { createServerClient } from '@/lib/supabase/server';

// GET /api/team — list team members for the current user's account
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;

  const { user, supabase } = auth;

  const { data: members, error } = await supabase
    .from('account_members')
    .select(`
      id, account_id, user_id, status, listing_ids,
      invited_at, accepted_at, created_at,
      role:roles(id, slug, name),
      member:profiles!account_members_user_id_fkey(email, full_name, avatar_url)
    `)
    .or(`account_id.eq.${user.id},user_id.eq.${user.id}`)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ members });
}

// POST /api/team — invite a new team member
export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;

  const { user } = auth;
  const serviceClient = createServerClient();
  const body = await request.json();

  const { email, role_id, listing_ids } = body;

  if (!email || !role_id) {
    return NextResponse.json(
      { error: 'email and role_id are required' },
      { status: 400 }
    );
  }

  // Verify the role exists
  const { data: role, error: roleError } = await serviceClient
    .from('roles')
    .select('id, slug')
    .eq('id', role_id)
    .single();

  if (roleError || !role) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
  }

  // Cannot assign owner role via invitation
  if (role.slug === 'owner') {
    return NextResponse.json(
      { error: 'Cannot invite with owner role' },
      { status: 400 }
    );
  }

  // Find the user by email (they must have an account)
  const { data: invitee } = await serviceClient
    .from('profiles')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (!invitee) {
    return NextResponse.json(
      { error: 'User not found. They must create an account first.' },
      { status: 404 }
    );
  }

  // Check for duplicate membership
  const { data: existing } = await serviceClient
    .from('account_members')
    .select('id, status')
    .eq('account_id', user.id)
    .eq('user_id', invitee.id)
    .maybeSingle();

  if (existing && existing.status !== 'revoked') {
    return NextResponse.json(
      { error: 'User is already a team member' },
      { status: 409 }
    );
  }

  // Create or re-invite the membership
  if (existing && existing.status === 'revoked') {
    const { data: updated, error } = await serviceClient
      .from('account_members')
      .update({
        role_id,
        listing_ids: listing_ids || null,
        status: 'invited',
        invited_at: new Date().toISOString(),
        accepted_at: null,
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ member: updated }, { status: 200 });
  }

  const { data: member, error } = await serviceClient
    .from('account_members')
    .insert({
      account_id: user.id,
      user_id: invitee.id,
      role_id,
      listing_ids: listing_ids || null,
      status: 'invited',
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ member }, { status: 201 });
}
