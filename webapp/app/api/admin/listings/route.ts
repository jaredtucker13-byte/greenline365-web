/**
 * Admin Listings API — Full CRUD with search, filter, pagination, bulk actions
 *
 * GET    /api/admin/listings            — List with search/filter/sort/pagination
 * POST   /api/admin/listings            — Create new listing
 * PATCH  /api/admin/listings            — Bulk actions (publish, unpublish, archive, delete)
 * DELETE /api/admin/listings?id=xxx     — Soft-delete (archive) a single listing
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { createServerClient } from '@/lib/supabase/server';
import { logAuditEvent } from '@/lib/audit-logger';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 80);
}

// ─── GET: List with search/filter/sort/pagination ───────────────────────────
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof Response) return authResult;
  const { user } = authResult;

  const service = createServerClient();
  const url = new URL(request.url);

  const search = url.searchParams.get('search') || '';
  const category = url.searchParams.get('category') || '';
  const status = url.searchParams.get('status') || '';
  const tier = url.searchParams.get('tier') || '';
  const sortBy = url.searchParams.get('sort') || 'updated_at';
  const sortDir = url.searchParams.get('dir') === 'asc' ? true : false;
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
  const perPage = Math.min(100, Math.max(1, parseInt(url.searchParams.get('per_page') || '20')));
  const offset = (page - 1) * perPage;

  // Check if user is admin (can see all) or regular user (sees own listings)
  const { data: profile } = await service
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  const isAdmin = profile?.is_admin === true;

  let query = service
    .from('directory_listings')
    .select(
      'id, business_name, slug, industry, city, state, zip_code, tier, is_published, is_claimed, claimed_by, cover_image_url, phone, email, website, avg_feedback_rating, total_feedback_count, trust_score, created_at, updated_at, metadata',
      { count: 'exact' }
    );

  // Tenant scoping: non-admins only see their own listings
  if (!isAdmin) {
    query = query.eq('claimed_by', user.id);
  }

  // Filters
  if (search) {
    query = query.or(
      `business_name.ilike.%${search}%,city.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`
    );
  }
  if (category) query = query.eq('industry', category);
  if (tier) query = query.eq('tier', tier);

  // Status filter maps to DB fields
  if (status === 'published') query = query.eq('is_published', true);
  else if (status === 'draft') query = query.eq('is_published', false).or('metadata->>status.is.null,metadata->>status.eq.draft');
  else if (status === 'pending_review') query = query.eq('metadata->>status', 'pending_review');
  else if (status === 'archived') query = query.eq('metadata->>status', 'archived');
  else if (status === 'unpublished') query = query.eq('is_published', false).eq('metadata->>status', 'unpublished');

  // Sorting
  const validSorts = ['business_name', 'created_at', 'updated_at', 'tier', 'city', 'avg_feedback_rating', 'trust_score'];
  const sortColumn = validSorts.includes(sortBy) ? sortBy : 'updated_at';
  query = query.order(sortColumn, { ascending: sortDir });

  // Pagination
  query = query.range(offset, offset + perPage - 1);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Derive status for each listing
  const listings = (data || []).map((l: Record<string, unknown>) => ({
    ...l,
    status: deriveStatus(l),
  }));

  return NextResponse.json({
    listings,
    pagination: {
      page,
      per_page: perPage,
      total: count || 0,
      total_pages: Math.ceil((count || 0) / perPage),
    },
  });
}

function deriveStatus(listing: Record<string, unknown>): string {
  const meta = listing.metadata as Record<string, unknown> | null;
  if (meta?.status === 'archived') return 'archived';
  if (meta?.status === 'pending_review') return 'pending_review';
  if (meta?.status === 'unpublished') return 'unpublished';
  if (listing.is_published) return 'published';
  return 'draft';
}

// ─── POST: Create new listing ───────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof Response) return authResult;
  const { user } = authResult;

  const service = createServerClient();
  const body = await request.json();

  const {
    business_name, description, industry, address_line1, city, state, zip_code,
    phone, email, website, logo_url, hours, social_links, tags, subcategories,
    service_areas, publish_at,
  } = body;

  // Validation
  const errors: string[] = [];
  if (!business_name?.trim()) errors.push('Business name is required');
  if (!industry?.trim()) errors.push('Category is required');
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Invalid email format');
  if (phone && !/^[\d\s()+-]{7,20}$/.test(phone)) errors.push('Invalid phone format');
  if (website && !/^https?:\/\/.+/.test(website)) errors.push('Website must start with http:// or https://');

  if (errors.length > 0) {
    return NextResponse.json({ error: 'Validation failed', details: errors }, { status: 400 });
  }

  // Duplicate detection: same name + city
  if (city) {
    const { data: existing } = await service
      .from('directory_listings')
      .select('id, business_name, city')
      .ilike('business_name', business_name.trim())
      .ilike('city', city.trim())
      .limit(1);

    if (existing && existing.length > 0) {
      return NextResponse.json({
        error: 'Possible duplicate',
        details: [`A listing for "${business_name}" in ${city} already exists (ID: ${existing[0].id})`],
        duplicate_id: existing[0].id,
      }, { status: 409 });
    }
  }

  // Generate slug
  const baseSlug = slugify(business_name.trim());
  let slug = baseSlug;
  const { data: slugCheck } = await service
    .from('directory_listings')
    .select('id')
    .eq('slug', slug)
    .limit(1);

  if (slugCheck && slugCheck.length > 0) {
    slug = `${baseSlug}-${Date.now().toString(36)}`;
  }

  const metadata: Record<string, unknown> = {
    status: 'draft',
    social_links: social_links || {},
    service_areas: service_areas || [],
    created_by: user.id,
  };
  if (publish_at) metadata.publish_at = publish_at;

  // Look up the user's business (tenant) for the FK, if they have one
  const { data: userBusiness } = await service
    .from('businesses')
    .select('id')
    .eq('owner_id', user.id)
    .limit(1)
    .maybeSingle();

  const { data, error } = await service
    .from('directory_listings')
    .insert({
      business_name: business_name.trim(),
      slug,
      description: description?.trim() || null,
      industry: industry.trim(),
      subcategories: subcategories || [],
      address_line1: address_line1?.trim() || null,
      city: city?.trim() || null,
      state: state?.trim() || null,
      zip_code: zip_code?.trim() || null,
      phone: phone?.trim() || null,
      email: email?.trim() || null,
      website: website?.trim() || null,
      logo_url: logo_url || null,
      business_hours: hours || {},
      tags: tags || [],
      tier: 'free',
      is_published: false,
      is_claimed: true,
      claimed_by: user.id,
      tenant_id: userBusiness?.id || null,
      metadata,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Audit log
  await logAuditEvent(service, user.id, {
    action: 'listing.create',
    actionCategory: 'data',
    resourceType: 'directory_listing',
    resourceId: data.id,
    description: `Created listing: ${business_name}`,
    metadata: { slug, industry, city, state },
  });

  return NextResponse.json(data, { status: 201 });
}

// ─── PATCH: Bulk actions ────────────────────────────────────────────────────
export async function PATCH(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof Response) return authResult;
  const { user } = authResult;

  const service = createServerClient();
  const body = await request.json();
  const { ids, action: bulkAction } = body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: 'ids array required' }, { status: 400 });
  }

  const validActions = ['publish', 'unpublish', 'archive', 'delete', 'set_pending_review', 'restore_draft'];
  if (!validActions.includes(bulkAction)) {
    return NextResponse.json({ error: `Invalid action. Valid: ${validActions.join(', ')}` }, { status: 400 });
  }

  // Verify ownership (non-admins can only modify their own)
  const { data: profile } = await service
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) {
    const { data: owned } = await service
      .from('directory_listings')
      .select('id')
      .in('id', ids)
      .eq('claimed_by', user.id);

    const ownedIds = (owned || []).map((l: { id: string }) => l.id);
    const unauthorized = ids.filter((id: string) => !ownedIds.includes(id));
    if (unauthorized.length > 0) {
      return NextResponse.json({ error: 'Not authorized for some listings', unauthorized_ids: unauthorized }, { status: 403 });
    }
  }

  let updatePayload: Record<string, unknown> = { updated_at: new Date().toISOString() };

  switch (bulkAction) {
    case 'publish':
      updatePayload.is_published = true;
      updatePayload['metadata'] = undefined; // We'll do a merge below
      break;
    case 'unpublish':
      updatePayload.is_published = false;
      break;
    case 'archive':
      updatePayload.is_published = false;
      break;
    case 'delete':
      updatePayload.is_published = false;
      break;
    case 'set_pending_review':
      break;
    case 'restore_draft':
      updatePayload.is_published = false;
      break;
  }

  // For metadata-dependent updates, we need to process each listing individually
  let processed = 0;
  let errors: string[] = [];

  for (const id of ids) {
    const { data: current } = await service
      .from('directory_listings')
      .select('id, metadata, business_name')
      .eq('id', id)
      .single();

    if (!current) {
      errors.push(`Listing ${id} not found`);
      continue;
    }

    const meta = (current.metadata as Record<string, unknown>) || {};

    switch (bulkAction) {
      case 'publish':
        meta.status = 'published';
        meta.published_at = new Date().toISOString();
        meta.published_by = user.id;
        break;
      case 'unpublish':
        meta.status = 'unpublished';
        meta.unpublished_at = new Date().toISOString();
        meta.unpublished_by = user.id;
        break;
      case 'archive':
        meta.status = 'archived';
        meta.archived_at = new Date().toISOString();
        meta.archived_by = user.id;
        break;
      case 'delete':
        meta.status = 'archived';
        meta.soft_deleted = true;
        meta.deleted_at = new Date().toISOString();
        meta.deleted_by = user.id;
        break;
      case 'set_pending_review':
        meta.status = 'pending_review';
        meta.review_requested_at = new Date().toISOString();
        meta.review_requested_by = user.id;
        break;
      case 'restore_draft':
        meta.status = 'draft';
        delete meta.archived_at;
        delete meta.soft_deleted;
        delete meta.deleted_at;
        break;
    }

    const { error } = await service
      .from('directory_listings')
      .update({
        ...updatePayload,
        metadata: meta,
        ...(bulkAction === 'publish' ? { is_published: true } : {}),
      })
      .eq('id', id);

    if (error) {
      errors.push(`Failed to update ${id}: ${error.message}`);
    } else {
      processed++;
    }
  }

  // Audit log
  await logAuditEvent(service, user.id, {
    action: `listing.bulk_${bulkAction}`,
    actionCategory: 'admin',
    description: `Bulk ${bulkAction}: ${processed} listings`,
    metadata: { ids, action: bulkAction, processed, errors },
  });

  return NextResponse.json({ processed, errors, total: ids.length });
}

// ─── DELETE: Soft-delete a single listing ───────────────────────────────────
export async function DELETE(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof Response) return authResult;
  const { user } = authResult;

  const service = createServerClient();
  const url = new URL(request.url);
  const id = url.searchParams.get('id');

  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  // Verify ownership
  const { data: listing } = await service
    .from('directory_listings')
    .select('id, claimed_by, business_name, metadata')
    .eq('id', id)
    .single();

  if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 });

  const { data: profile } = await service
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin && listing.claimed_by !== user.id) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  const meta = (listing.metadata as Record<string, unknown>) || {};
  meta.status = 'archived';
  meta.soft_deleted = true;
  meta.deleted_at = new Date().toISOString();
  meta.deleted_by = user.id;

  const { error } = await service
    .from('directory_listings')
    .update({
      is_published: false,
      metadata: meta,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAuditEvent(service, user.id, {
    action: 'listing.delete',
    actionCategory: 'data',
    resourceType: 'directory_listing',
    resourceId: id,
    description: `Archived listing: ${listing.business_name}`,
  });

  return NextResponse.json({ success: true });
}
