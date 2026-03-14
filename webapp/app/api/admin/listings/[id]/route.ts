/**
 * Admin Single Listing API — Full detail CRUD + status transitions + photos + reviews + analytics
 *
 * GET    /api/admin/listings/[id]               — Full listing detail
 * PATCH  /api/admin/listings/[id]               — Update listing fields / status transitions / photos / reviews
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { createServerClient } from '@/lib/supabase/server';
import { logAuditEvent } from '@/lib/audit-logger';

type RouteContext = { params: Promise<{ id: string }> };

async function verifyAccess(userId: string, listingId: string, service: ReturnType<typeof createServerClient>) {
  const { data: listing } = await service
    .from('directory_listings')
    .select('*')
    .eq('id', listingId)
    .single();

  if (!listing) return { error: NextResponse.json({ error: 'Listing not found' }, { status: 404 }), listing: null };

  const { data: profile } = await service
    .from('profiles')
    .select('is_admin')
    .eq('id', userId)
    .single();

  const isAdmin = profile?.is_admin === true;
  if (!isAdmin && listing.claimed_by !== userId) {
    return { error: NextResponse.json({ error: 'Not authorized' }, { status: 403 }), listing: null };
  }

  return { error: null, listing, isAdmin };
}

// ─── GET: Full listing detail with related data ─────────────────────────────
export async function GET(request: NextRequest, context: RouteContext) {
  const authResult = await requireAuth(request);
  if (authResult instanceof Response) return authResult;
  const { user } = authResult;

  const { id } = await context.params;
  const service = createServerClient();
  const access = await verifyAccess(user.id, id, service);
  if (access.error) return access.error;

  const listing = access.listing!;

  // Fetch related data in parallel
  const [feedbackRes, analyticsRes] = await Promise.all([
    service
      .from('directory_feedback')
      .select('id, rating, feedback_text, feedback_type, submitter_name, submitter_email, status, admin_response, created_at')
      .eq('listing_id', id)
      .order('created_at', { ascending: false })
      .limit(50),
    service
      .from('analytics_events')
      .select('event_name, occurred_at, metadata')
      .eq('entity_type', 'listing')
      .eq('entity_id', id)
      .order('occurred_at', { ascending: false })
      .limit(200),
  ]);

  // Compute analytics summary
  const events = analyticsRes.data || [];
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const recentEvents = events.filter(e => new Date(e.occurred_at) >= thirtyDaysAgo);

  const analyticsSummary = {
    total_views: events.filter(e => e.event_name === 'listing_view').length,
    total_clicks: events.filter(e => e.event_name === 'listing_click').length,
    total_calls: events.filter(e => e.event_name === 'listing_call').length,
    total_directions: events.filter(e => e.event_name === 'listing_directions').length,
    total_website_clicks: events.filter(e => e.event_name === 'listing_website').length,
    views_30d: recentEvents.filter(e => e.event_name === 'listing_view').length,
    clicks_30d: recentEvents.filter(e => e.event_name === 'listing_click').length,
    calls_30d: recentEvents.filter(e => e.event_name === 'listing_call').length,
  };

  // Derive status
  const meta = (listing.metadata as Record<string, unknown>) || {};
  const status = meta.status === 'archived' ? 'archived'
    : meta.status === 'pending_review' ? 'pending_review'
    : meta.status === 'unpublished' ? 'unpublished'
    : listing.is_published ? 'published'
    : 'draft';

  return NextResponse.json({
    ...listing,
    status,
    feedback: feedbackRes.data || [],
    analytics: analyticsSummary,
  });
}

// ─── PATCH: Update listing / status transitions / photos / reviews ──────────
export async function PATCH(request: NextRequest, context: RouteContext) {
  const authResult = await requireAuth(request);
  if (authResult instanceof Response) return authResult;
  const { user } = authResult;

  const { id } = await context.params;
  const service = createServerClient();
  const access = await verifyAccess(user.id, id, service);
  if (access.error) return access.error;

  const listing = access.listing!;
  const body = await request.json();
  const { action } = body;

  // Route to specific handlers
  if (action === 'update_status') return handleStatusTransition(service, user.id, listing, body);
  if (action === 'update_photos') return handlePhotoUpdate(service, user.id, listing, body);
  if (action === 'respond_review') return handleReviewResponse(service, user.id, listing, body);
  if (action === 'flag_review') return handleReviewFlag(service, user.id, listing, body);
  if (action === 'approve_review') return handleReviewApprove(service, user.id, listing, body);
  if (action === 'update_hours') return handleHoursUpdate(service, user.id, listing, body);
  if (action === 'update_menu') return handleMenuUpdate(service, user.id, listing, body);

  // Default: update listing fields
  return handleFieldUpdate(service, user.id, listing, body);
}

// ─── Field Update ───────────────────────────────────────────────────────────
async function handleFieldUpdate(
  service: ReturnType<typeof createServerClient>,
  userId: string,
  listing: Record<string, unknown>,
  body: Record<string, unknown>
) {
  const allowedFields = [
    'business_name', 'description', 'industry', 'subcategories',
    'address_line1', 'city', 'state', 'zip_code',
    'phone', 'email', 'website', 'logo_url',
    'tags', 'cover_image_url', 'gallery_images',
  ];

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  const before: Record<string, unknown> = {};
  const after: Record<string, unknown> = {};

  for (const field of allowedFields) {
    if (field in body && body[field] !== undefined) {
      before[field] = listing[field];
      after[field] = body[field];
      updates[field] = body[field];
    }
  }

  // Handle metadata sub-fields (social_links, service_areas, publish_at)
  if (body.social_links || body.service_areas || body.publish_at) {
    const meta = { ...(listing.metadata as Record<string, unknown> || {}) };
    if (body.social_links) meta.social_links = body.social_links;
    if (body.service_areas) meta.service_areas = body.service_areas;
    if (body.publish_at) meta.publish_at = body.publish_at;
    updates.metadata = meta;
  }

  // Slug update if business_name changed
  if (updates.business_name && updates.business_name !== listing.business_name) {
    const baseSlug = slugify(updates.business_name as string);
    let slug = baseSlug;
    const { data: existing } = await service
      .from('directory_listings')
      .select('id')
      .eq('slug', slug)
      .neq('id', listing.id as string)
      .limit(1);
    if (existing && existing.length > 0) {
      slug = `${baseSlug}-${Date.now().toString(36)}`;
    }
    updates.slug = slug;
  }

  // Validation
  const errors: string[] = [];
  if (updates.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updates.email as string)) errors.push('Invalid email');
  if (updates.phone && !/^[\d\s()+-]{7,20}$/.test(updates.phone as string)) errors.push('Invalid phone');
  if (updates.website && !/^https?:\/\/.+/.test(updates.website as string)) errors.push('Website must start with http(s)://');

  if (errors.length > 0) {
    return NextResponse.json({ error: 'Validation failed', details: errors }, { status: 400 });
  }

  const { data, error } = await service
    .from('directory_listings')
    .update(updates)
    .eq('id', listing.id as string)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAuditEvent(service, userId, {
    action: 'listing.update',
    actionCategory: 'data',
    resourceType: 'directory_listing',
    resourceId: listing.id as string,
    description: `Updated listing: ${listing.business_name}`,
    changes: { before, after },
  });

  return NextResponse.json(data);
}

// ─── Status Transition ──────────────────────────────────────────────────────
async function handleStatusTransition(
  service: ReturnType<typeof createServerClient>,
  userId: string,
  listing: Record<string, unknown>,
  body: { new_status: string }
) {
  const { new_status } = body;
  const validStatuses = ['draft', 'pending_review', 'published', 'unpublished', 'archived'];
  if (!validStatuses.includes(new_status)) {
    return NextResponse.json({ error: `Invalid status. Valid: ${validStatuses.join(', ')}` }, { status: 400 });
  }

  const meta = { ...(listing.metadata as Record<string, unknown> || {}) };
  const oldStatus = meta.status || (listing.is_published ? 'published' : 'draft');

  // Transition rules
  const validTransitions: Record<string, string[]> = {
    draft: ['pending_review', 'published'],
    pending_review: ['published', 'draft'],
    published: ['unpublished', 'archived'],
    unpublished: ['published', 'draft', 'archived'],
    archived: ['draft'],
  };

  if (!validTransitions[oldStatus as string]?.includes(new_status)) {
    return NextResponse.json({
      error: `Invalid transition from ${oldStatus} to ${new_status}`,
      valid_transitions: validTransitions[oldStatus as string],
    }, { status: 400 });
  }

  meta.status = new_status;
  meta[`${new_status}_at`] = new Date().toISOString();
  meta[`${new_status}_by`] = userId;

  const isPublished = new_status === 'published';

  const { data, error } = await service
    .from('directory_listings')
    .update({
      is_published: isPublished,
      metadata: meta,
      updated_at: new Date().toISOString(),
    })
    .eq('id', listing.id as string)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAuditEvent(service, userId, {
    action: `listing.status_${new_status}`,
    actionCategory: 'admin',
    resourceType: 'directory_listing',
    resourceId: listing.id as string,
    description: `Status changed: ${oldStatus} → ${new_status} for "${listing.business_name}"`,
    changes: { before: { status: oldStatus }, after: { status: new_status } },
  });

  return NextResponse.json({ ...data, status: new_status });
}

// ─── Photo Update ───────────────────────────────────────────────────────────
async function handlePhotoUpdate(
  service: ReturnType<typeof createServerClient>,
  userId: string,
  listing: Record<string, unknown>,
  body: { photo_action: string; photos?: string[]; photo_url?: string; position?: number }
) {
  const { photo_action } = body;
  const gallery = [...((listing.gallery_images as string[]) || [])];
  const meta = { ...(listing.metadata as Record<string, unknown> || {}) };

  switch (photo_action) {
    case 'add': {
      if (!body.photo_url) return NextResponse.json({ error: 'photo_url required' }, { status: 400 });
      gallery.push(body.photo_url);
      break;
    }
    case 'remove': {
      if (!body.photo_url) return NextResponse.json({ error: 'photo_url required' }, { status: 400 });
      const idx = gallery.indexOf(body.photo_url);
      if (idx > -1) gallery.splice(idx, 1);
      // Also remove from selected if present
      if (meta.selected_photos) {
        meta.selected_photos = (meta.selected_photos as string[]).filter(p => p !== body.photo_url);
      }
      break;
    }
    case 'reorder': {
      if (!Array.isArray(body.photos)) return NextResponse.json({ error: 'photos array required' }, { status: 400 });
      // Replace gallery with the new order (must contain same URLs)
      gallery.length = 0;
      gallery.push(...body.photos);
      break;
    }
    case 'set_cover': {
      if (!body.photo_url) return NextResponse.json({ error: 'photo_url required' }, { status: 400 });
      const { error } = await service
        .from('directory_listings')
        .update({ cover_image_url: body.photo_url, updated_at: new Date().toISOString() })
        .eq('id', listing.id as string);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, cover_image_url: body.photo_url });
    }
    default:
      return NextResponse.json({ error: 'Invalid photo_action. Valid: add, remove, reorder, set_cover' }, { status: 400 });
  }

  const { data, error } = await service
    .from('directory_listings')
    .update({
      gallery_images: gallery,
      metadata: meta,
      cover_image_url: gallery[0] || (listing.cover_image_url as string),
      updated_at: new Date().toISOString(),
    })
    .eq('id', listing.id as string)
    .select('id, gallery_images, cover_image_url')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAuditEvent(service, userId, {
    action: `listing.photo_${photo_action}`,
    actionCategory: 'data',
    resourceType: 'directory_listing',
    resourceId: listing.id as string,
    description: `Photo ${photo_action} on "${listing.business_name}"`,
  });

  return NextResponse.json(data);
}

// ─── Review Response ────────────────────────────────────────────────────────
async function handleReviewResponse(
  service: ReturnType<typeof createServerClient>,
  userId: string,
  listing: Record<string, unknown>,
  body: { review_id: string; response_text: string }
) {
  const { review_id, response_text } = body;
  if (!review_id || !response_text?.trim()) {
    return NextResponse.json({ error: 'review_id and response_text required' }, { status: 400 });
  }

  const { data, error } = await service
    .from('directory_feedback')
    .update({
      admin_response: response_text.trim(),
      admin_responded_at: new Date().toISOString(),
      admin_responded_by: userId,
    })
    .eq('id', review_id)
    .eq('listing_id', listing.id as string)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// ─── Review Flag ────────────────────────────────────────────────────────────
async function handleReviewFlag(
  service: ReturnType<typeof createServerClient>,
  userId: string,
  listing: Record<string, unknown>,
  body: { review_id: string; reason?: string }
) {
  const { review_id, reason } = body;
  if (!review_id) return NextResponse.json({ error: 'review_id required' }, { status: 400 });

  const { data, error } = await service
    .from('directory_feedback')
    .update({
      status: 'flagged',
      flag_reason: reason || 'Flagged by business owner',
      flagged_at: new Date().toISOString(),
      flagged_by: userId,
    })
    .eq('id', review_id)
    .eq('listing_id', listing.id as string)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// ─── Review Approve ─────────────────────────────────────────────────────────
async function handleReviewApprove(
  service: ReturnType<typeof createServerClient>,
  userId: string,
  listing: Record<string, unknown>,
  body: { review_id: string }
) {
  const { review_id } = body;
  if (!review_id) return NextResponse.json({ error: 'review_id required' }, { status: 400 });

  const { data, error } = await service
    .from('directory_feedback')
    .update({ status: 'approved' })
    .eq('id', review_id)
    .eq('listing_id', listing.id as string)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// ─── Hours Update ───────────────────────────────────────────────────────────
async function handleHoursUpdate(
  service: ReturnType<typeof createServerClient>,
  userId: string,
  listing: Record<string, unknown>,
  body: { hours: Record<string, unknown>; special_hours?: Array<Record<string, unknown>> }
) {
  const { hours, special_hours } = body;
  if (!hours) return NextResponse.json({ error: 'hours object required' }, { status: 400 });

  const meta = { ...(listing.metadata as Record<string, unknown> || {}) };
  if (special_hours) meta.special_hours = special_hours;

  const { data, error } = await service
    .from('directory_listings')
    .update({
      hours,
      metadata: meta,
      updated_at: new Date().toISOString(),
    })
    .eq('id', listing.id as string)
    .select('id, hours, metadata')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAuditEvent(service, userId, {
    action: 'listing.update_hours',
    actionCategory: 'data',
    resourceType: 'directory_listing',
    resourceId: listing.id as string,
    description: `Updated hours for "${listing.business_name}"`,
  });

  return NextResponse.json(data);
}

// ─── Menu Update ────────────────────────────────────────────────────────────
async function handleMenuUpdate(
  service: ReturnType<typeof createServerClient>,
  userId: string,
  listing: Record<string, unknown>,
  body: { sections: Array<Record<string, unknown>> }
) {
  const { sections } = body;
  if (!Array.isArray(sections)) return NextResponse.json({ error: 'sections array required' }, { status: 400 });

  // Upsert into listing_menus
  const { data: existing } = await service
    .from('listing_menus')
    .select('id')
    .eq('listing_id', listing.id as string)
    .single();

  let result;
  if (existing) {
    result = await service
      .from('listing_menus')
      .update({ sections, updated_at: new Date().toISOString() })
      .eq('listing_id', listing.id as string)
      .select()
      .single();
  } else {
    result = await service
      .from('listing_menus')
      .insert({ listing_id: listing.id as string, sections })
      .select()
      .single();
  }

  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 });

  await logAuditEvent(service, userId, {
    action: 'listing.update_menu',
    actionCategory: 'data',
    resourceType: 'directory_listing',
    resourceId: listing.id as string,
    description: `Updated menu/services for "${listing.business_name}"`,
  });

  return NextResponse.json(result.data);
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 80);
}
