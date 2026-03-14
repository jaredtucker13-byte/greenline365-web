import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { createServerClient } from '@/lib/supabase/server';

/**
 * Find the tenant ID for the authenticated user.
 * The user may be an owner (tenants.owner_id) or a member (tenant_members.user_id).
 */
async function findUserTenantId(
  service: ReturnType<typeof createServerClient>,
  userId: string
): Promise<string | null> {
  // Check if user owns a tenant
  const { data: ownedTenant } = await service
    .from('tenants')
    .select('id')
    .eq('owner_id', userId)
    .limit(1)
    .maybeSingle();

  if (ownedTenant) return ownedTenant.id;

  // Check if user is a member of a tenant
  const { data: membership } = await service
    .from('tenant_members')
    .select('tenant_id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle();

  return membership?.tenant_id || null;
}

/**
 * GET /api/portal/team — List team members and available roles
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof Response) return authResult;
    const { user } = authResult;

    const service = createServerClient();

    const tenantId = await findUserTenantId(service, user.id);
    if (!tenantId) {
      return NextResponse.json({ error: 'No tenant found for this user' }, { status: 404 });
    }

    // Fetch team members with role info
    const { data: members, error: membersError } = await service
      .from('tenant_members')
      .select(`
        id,
        user_id,
        role_id,
        status,
        created_at,
        invited_email,
        role:roles(id, name, slug)
      `)
      .eq('tenant_id', tenantId)
      .neq('status', 'revoked');

    if (membersError) {
      return NextResponse.json({ error: membersError.message }, { status: 500 });
    }

    // Get profile info for members who have user_ids
    const userIds = (members || [])
      .map((m) => m.user_id)
      .filter(Boolean);

    let profileMap: Record<string, { email: string; full_name: string | null }> = {};
    if (userIds.length > 0) {
      const { data: profiles } = await service
        .from('profiles')
        .select('id, email, full_name')
        .in('id', userIds);

      for (const p of profiles || []) {
        profileMap[p.id] = { email: p.email, full_name: p.full_name };
      }
    }

    // Enrich members with profile data
    const enrichedMembers = (members || []).map((m) => ({
      id: m.id,
      user_id: m.user_id,
      email: m.user_id ? profileMap[m.user_id]?.email : m.invited_email,
      name: m.user_id ? profileMap[m.user_id]?.full_name : null,
      role: m.role,
      status: m.status,
      created_at: m.created_at,
    }));

    // Fetch available roles
    const { data: roles } = await service
      .from('roles')
      .select('id, name, slug, description')
      .order('name');

    return NextResponse.json({
      members: enrichedMembers,
      roles: roles || [],
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[PORTAL/TEAM] GET Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/portal/team — Invite a new team member
 * Body: { email, role_id }
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof Response) return authResult;
    const { user } = authResult;

    const body = await request.json();
    const { email, role_id } = body;

    if (!email || !role_id) {
      return NextResponse.json({ error: 'email and role_id are required' }, { status: 400 });
    }

    const service = createServerClient();

    const tenantId = await findUserTenantId(service, user.id);
    if (!tenantId) {
      return NextResponse.json({ error: 'No tenant found for this user' }, { status: 404 });
    }

    // Check if user is tenant owner (only owners can invite)
    const { data: tenant } = await service
      .from('tenants')
      .select('id, owner_id')
      .eq('id', tenantId)
      .single();

    if (!tenant || tenant.owner_id !== user.id) {
      return NextResponse.json({ error: 'Only tenant owners can invite members' }, { status: 403 });
    }

    // Check for existing invitation/membership
    const { data: existing } = await service
      .from('tenant_members')
      .select('id, status')
      .eq('tenant_id', tenantId)
      .eq('invited_email', email)
      .neq('status', 'revoked')
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: 'This email has already been invited or is an active member' },
        { status: 409 }
      );
    }

    // Create the invitation
    const { data: member, error: insertError } = await service
      .from('tenant_members')
      .insert({
        tenant_id: tenantId,
        role_id,
        invited_email: email,
        status: 'invited',
        invited_by: user.id,
      })
      .select(`
        id,
        user_id,
        role_id,
        status,
        created_at,
        invited_email,
        role:roles(id, name, slug)
      `)
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({
      member: {
        id: member.id,
        user_id: member.user_id,
        email: member.invited_email,
        name: null,
        role: member.role,
        status: member.status,
        created_at: member.created_at,
      },
    }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[PORTAL/TEAM] POST Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/portal/team — Revoke a team member
 * Body: { member_id }
 */
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof Response) return authResult;
    const { user } = authResult;

    const body = await request.json();
    const { member_id } = body;

    if (!member_id) {
      return NextResponse.json({ error: 'member_id is required' }, { status: 400 });
    }

    const service = createServerClient();

    const tenantId = await findUserTenantId(service, user.id);
    if (!tenantId) {
      return NextResponse.json({ error: 'No tenant found for this user' }, { status: 404 });
    }

    // Verify ownership
    const { data: tenant } = await service
      .from('tenants')
      .select('id, owner_id')
      .eq('id', tenantId)
      .single();

    if (!tenant || tenant.owner_id !== user.id) {
      return NextResponse.json({ error: 'Only tenant owners can remove members' }, { status: 403 });
    }

    // Revoke the member (soft delete)
    const { error: updateError } = await service
      .from('tenant_members')
      .update({ status: 'revoked' })
      .eq('id', member_id)
      .eq('tenant_id', tenantId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[PORTAL/TEAM] DELETE Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * PATCH /api/portal/team — Update a team member's role
 * Body: { member_id, role_id }
 */
export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof Response) return authResult;
    const { user } = authResult;

    const body = await request.json();
    const { member_id, role_id } = body;

    if (!member_id || !role_id) {
      return NextResponse.json({ error: 'member_id and role_id are required' }, { status: 400 });
    }

    const service = createServerClient();

    const tenantId = await findUserTenantId(service, user.id);
    if (!tenantId) {
      return NextResponse.json({ error: 'No tenant found for this user' }, { status: 404 });
    }

    // Verify ownership
    const { data: tenant } = await service
      .from('tenants')
      .select('id, owner_id')
      .eq('id', tenantId)
      .single();

    if (!tenant || tenant.owner_id !== user.id) {
      return NextResponse.json({ error: 'Only tenant owners can change roles' }, { status: 403 });
    }

    // Update the member's role
    const { data: updated, error: updateError } = await service
      .from('tenant_members')
      .update({ role_id })
      .eq('id', member_id)
      .eq('tenant_id', tenantId)
      .select(`
        id,
        user_id,
        role_id,
        status,
        created_at,
        invited_email,
        role:roles(id, name, slug)
      `)
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      member: {
        id: updated.id,
        user_id: updated.user_id,
        email: updated.invited_email,
        role: updated.role,
        status: updated.status,
        created_at: updated.created_at,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[PORTAL/TEAM] PATCH Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
