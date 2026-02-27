import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/middleware';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
function getServiceClient() { return createClient(supabaseUrl, supabaseServiceKey); }

/**
 * Admin Directory Management API
 *
 * GET    /api/admin/directory              — List/search all listings (with stats)
 * GET    /api/admin/directory?id=xxx       — Get single listing with full detail
 * PATCH  /api/admin/directory              — Update any listing (no tier gating)
 * POST   /api/admin/directory              — Admin actions (award badge, manage polls, moderate reviews)
 * DELETE /api/admin/directory              — Unpublish or delete listing
 */

export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof Response) return authResult;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const service = getServiceClient();

  // Single listing detail
  if (id) {
    const { data: listing, error } = await service
      .from('directory_listings')
      .select('*, directory_badges(*)')
      .eq('id', id)
      .single();

    if (error || !listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    // Get reviews
    const { data: reviews } = await service
      .from('directory_feedback')
      .select('*')
      .eq('listing_id', id)
      .order('created_at', { ascending: false })
      .limit(50);

    // Get polls from metadata
    const polls = listing.metadata?.polls || [];

    return NextResponse.json({ listing, reviews: reviews || [], polls });
  }

  // List all listings with filters
  const search = searchParams.get('search') || '';
  const tier = searchParams.get('tier') || '';
  const city = searchParams.get('city') || '';
  const industry = searchParams.get('industry') || '';
  const claimed = searchParams.get('claimed'); // 'true', 'false', or null for all
  const published = searchParams.get('published'); // 'true', 'false', or null for all
  const sortBy = searchParams.get('sort') || 'created_at';
  const sortDir = searchParams.get('dir') === 'asc' ? true : false;
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');

  let query = service
    .from('directory_listings')
    .select('id, business_name, slug, industry, city, state, tier, is_claimed, is_published, trust_score, avg_feedback_rating, total_feedback_count, cover_image_url, phone, email, created_at, updated_at, metadata', { count: 'exact' });

  if (search) {
    query = query.or(`business_name.ilike.%${search}%,industry.ilike.%${search}%,city.ilike.%${search}%`);
  }
  if (tier) query = query.eq('tier', tier);
  if (city) query = query.ilike('city', `%${city}%`);
  if (industry) query = query.eq('industry', industry);
  if (claimed === 'true') query = query.eq('is_claimed', true);
  if (claimed === 'false') query = query.eq('is_claimed', false);
  if (published === 'true') query = query.eq('is_published', true);
  if (published === 'false') query = query.eq('is_published', false);

  query = query.order(sortBy, { ascending: sortDir });
  query = query.range(offset, offset + limit - 1);

  const { data: listings, count, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get aggregate stats
  const { data: stats } = await service.rpc('get_directory_admin_stats').maybeSingle();

  // Fallback stats if RPC doesn't exist
  const fallbackStats = (stats as Record<string, number> | null) || {
    total: count || 0,
    claimed: 0,
    unclaimed: 0,
    free: 0,
    pro: 0,
    premium: 0,
  };

  // Calculate stats from results if RPC not available
  if (!stats) {
    const { count: totalCount } = await service.from('directory_listings').select('id', { count: 'exact', head: true });
    const { count: claimedCount } = await service.from('directory_listings').select('id', { count: 'exact', head: true }).eq('is_claimed', true);
    const { count: freeCount } = await service.from('directory_listings').select('id', { count: 'exact', head: true }).eq('tier', 'free');
    const { count: proCount } = await service.from('directory_listings').select('id', { count: 'exact', head: true }).eq('tier', 'pro');
    const { count: premiumCount } = await service.from('directory_listings').select('id', { count: 'exact', head: true }).eq('tier', 'premium');

    fallbackStats.total = totalCount || 0;
    fallbackStats.claimed = claimedCount || 0;
    fallbackStats.unclaimed = (totalCount || 0) - (claimedCount || 0);
    fallbackStats.free = freeCount || 0;
    fallbackStats.pro = proCount || 0;
    fallbackStats.premium = premiumCount || 0;
  }

  return NextResponse.json({
    listings: listings || [],
    total: count || 0,
    stats: fallbackStats,
  });
}

export async function PATCH(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof Response) return authResult;

  const body = await request.json();
  const { id, ...updates } = body;

  if (!id) {
    return NextResponse.json({ error: 'Listing id required' }, { status: 400 });
  }

  const service = getServiceClient();

  // Get current listing for metadata merge
  const { data: current } = await service
    .from('directory_listings')
    .select('metadata')
    .eq('id', id)
    .single();

  if (!current) {
    return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
  }

  // Build safe update object — admin can update anything
  const safeUpdates: Record<string, unknown> = {};

  const directFields = [
    'business_name', 'description', 'phone', 'website', 'email',
    'address_line1', 'city', 'state', 'zip_code', 'industry',
    'subcategories', 'tags', 'logo_url', 'cover_image_url',
    'gallery_images', 'tier', 'trust_score', 'is_published',
    'is_claimed', 'claimed_by',
  ];

  for (const field of directFields) {
    if (field in updates) safeUpdates[field] = updates[field];
  }

  // Handle metadata fields — merge with existing
  const metadataFields = [
    'video_url', 'owner_video_url', 'owner_name', 'owner_bio',
    'google_rating', 'google_review_count', 'google_maps_url',
    'featured_boost', 'coupons', 'polls',
  ];
  const hasMetadataUpdate = metadataFields.some(f => f in updates);

  if (hasMetadataUpdate) {
    const existingMetadata = (current.metadata as Record<string, unknown>) || {};
    const metadataUpdates: Record<string, unknown> = {};
    for (const field of metadataFields) {
      if (field in updates) {
        metadataUpdates[field] = updates[field];
      }
    }
    safeUpdates.metadata = { ...existingMetadata, ...metadataUpdates };
  }

  safeUpdates.updated_at = new Date().toISOString();

  const { data, error } = await service
    .from('directory_listings')
    .update(safeUpdates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, listing: data });
}

export async function POST(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof Response) return authResult;

  const body = await request.json();
  const { action, ...params } = body;
  const service = getServiceClient();

  switch (action) {
    // ─── BADGE MANAGEMENT ───
    case 'award_badge': {
      const { listing_id, badge_type, badge_label, badge_color, badge_icon, earned_via, earned_details, expires_at } = params;
      if (!listing_id || !badge_type || !badge_label) {
        return NextResponse.json({ error: 'listing_id, badge_type, and badge_label required' }, { status: 400 });
      }
      const { data, error } = await service.from('directory_badges').insert({
        listing_id,
        badge_type,
        badge_label,
        badge_color: badge_color || '#C9A84C',
        badge_icon: badge_icon || 'shield',
        earned_via: earned_via || 'admin_manual',
        earned_details: earned_details || { awarded_by: 'admin' },
        is_active: true,
        earned_at: new Date().toISOString(),
        expires_at: expires_at || null,
      }).select().single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, badge: data });
    }

    case 'revoke_badge': {
      const { badge_id, reason } = params;
      if (!badge_id) return NextResponse.json({ error: 'badge_id required' }, { status: 400 });

      const { error } = await service.from('directory_badges').update({
        is_active: false,
        revoked_at: new Date().toISOString(),
        revoke_reason: reason || 'Admin revoked',
      }).eq('id', badge_id);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    // ─── POLL MANAGEMENT ───
    case 'create_poll': {
      const { listing_id, title, questions } = params;
      if (!listing_id || !title || !questions) {
        return NextResponse.json({ error: 'listing_id, title, and questions required' }, { status: 400 });
      }

      const { data: listing } = await service
        .from('directory_listings')
        .select('id, metadata')
        .eq('id', listing_id)
        .single();

      if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 });

      const existingPolls = (listing.metadata as any)?.polls || [];
      const newPoll = {
        id: crypto.randomUUID(),
        title,
        questions,
        responses: [],
        is_active: true,
        created_at: new Date().toISOString(),
        created_by: 'admin',
      };

      const { error } = await service
        .from('directory_listings')
        .update({
          metadata: { ...(listing.metadata as any || {}), polls: [...existingPolls, newPoll] },
          updated_at: new Date().toISOString(),
        })
        .eq('id', listing_id);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, poll: newPoll });
    }

    case 'deactivate_poll': {
      const { listing_id, poll_id } = params;
      if (!listing_id || !poll_id) return NextResponse.json({ error: 'listing_id and poll_id required' }, { status: 400 });

      const { data: listing } = await service
        .from('directory_listings')
        .select('id, metadata')
        .eq('id', listing_id)
        .single();

      if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 });

      const polls = ((listing.metadata as any)?.polls || []).map((p: any) =>
        p.id === poll_id ? { ...p, is_active: false } : p
      );

      const { error } = await service
        .from('directory_listings')
        .update({
          metadata: { ...(listing.metadata as any || {}), polls },
          updated_at: new Date().toISOString(),
        })
        .eq('id', listing_id);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    // ─── REVIEW MODERATION ───
    case 'delete_review': {
      const { review_id } = params;
      if (!review_id) return NextResponse.json({ error: 'review_id required' }, { status: 400 });

      const { error } = await service.from('directory_feedback').delete().eq('id', review_id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    case 'flag_review': {
      const { review_id, red_flag_type } = params;
      if (!review_id) return NextResponse.json({ error: 'review_id required' }, { status: 400 });

      const { error } = await service.from('directory_feedback').update({
        is_red_flag: true,
        red_flag_type: red_flag_type || 'admin_flagged',
      }).eq('id', review_id);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    default:
      return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof Response) return authResult;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const hard = searchParams.get('hard') === 'true';

  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const service = getServiceClient();

  if (hard) {
    // Hard delete — removes from DB entirely
    const { error } = await service.from('directory_listings').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, action: 'deleted' });
  } else {
    // Soft delete — just unpublish
    const { error } = await service.from('directory_listings').update({
      is_published: false,
      updated_at: new Date().toISOString(),
    }).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, action: 'unpublished' });
  }
}
