import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth/middleware';

/**
 * Admin Community Polls API — Full CRUD
 *
 * GET  /api/admin/community-polls           — List all polls with options & KPIs
 * POST /api/admin/community-polls           — Create a new poll
 * PUT  /api/admin/community-polls           — Update a poll (pollId in body)
 * DELETE /api/admin/community-polls         — Delete a poll (pollId in body)
 *
 * All endpoints protected with requireAdmin + is_admin check.
 */

// ─── GET — List all polls ───────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof Response) return authResult;

  const db = createServerClient();
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(50, parseInt(searchParams.get('limit') || '25', 10));
  const offset = (page - 1) * limit;

  let query = db
    .from('community_polls')
    .select('*', { count: 'exact' });

  if (search) query = query.ilike('title', `%${search}%`);
  if (status) query = query.eq('status', status);

  const { data: polls, count, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Enrich with options
  const pollIds = (polls || []).map((p: any) => p.id);
  let options: any[] = [];
  if (pollIds.length > 0) {
    const { data } = await db
      .from('community_poll_options')
      .select('id, poll_id, business_id, business_name, business_image, vote_count')
      .in('poll_id', pollIds)
      .order('vote_count', { ascending: false });
    options = data || [];
  }

  const optionsByPoll = new Map<string, any[]>();
  for (const opt of options) {
    const arr = optionsByPoll.get(opt.poll_id) || [];
    arr.push(opt);
    optionsByPoll.set(opt.poll_id, arr);
  }

  const enriched = (polls || []).map((poll: any) => {
    const opts = optionsByPoll.get(poll.id) || [];
    return {
      ...poll,
      options: opts,
      options_count: opts.length,
      total_votes: opts.reduce((s: number, o: any) => s + (o.vote_count || 0), 0),
    };
  });

  // KPIs
  const { count: totalActive } = await db
    .from('community_polls')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  const { data: allOptions } = await db.from('community_poll_options').select('vote_count');
  const totalVotesCast = (allOptions || []).reduce((s: number, o: any) => s + (o.vote_count || 0), 0);

  let mostPopularTitle = '—';
  if (enriched.length > 0) {
    const sorted = [...enriched].sort((a: any, b: any) => b.total_votes - a.total_votes);
    mostPopularTitle = sorted[0]?.title || '—';
  }

  return NextResponse.json({
    polls: enriched,
    total: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / limit),
    kpis: { totalActive: totalActive || 0, totalVotesCast, mostPopularTitle },
  });
}

// ─── POST — Create poll ─────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof Response) return authResult;

  const db = createServerClient();
  const body = await request.json();
  const { title, description, category, destination_slug, status: pollStatus, closes_at, options } = body;

  if (!title || !category) {
    return NextResponse.json({ error: 'title and category required' }, { status: 400 });
  }

  const { data: poll, error } = await db
    .from('community_polls')
    .insert({
      title,
      description: description || null,
      category,
      destination_slug: destination_slug || null,
      status: pollStatus || 'draft',
      closes_at: closes_at || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (options && Array.isArray(options) && options.length > 0) {
    const optionRows = options
      .filter((o: any) => o.business_name?.trim())
      .map((opt: any) => ({
        poll_id: poll.id,
        business_id: opt.business_id || crypto.randomUUID(),
        business_name: opt.business_name,
        business_image: opt.business_image || null,
      }));

    if (optionRows.length > 0) {
      await db.from('community_poll_options').insert(optionRows);
    }
  }

  return NextResponse.json({ success: true, poll });
}

// ─── PUT — Update poll ──────────────────────────────────────────────────────

export async function PUT(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof Response) return authResult;

  const db = createServerClient();
  const body = await request.json();
  const { pollId, updates } = body;

  if (!pollId) return NextResponse.json({ error: 'pollId required' }, { status: 400 });

  const { data, error } = await db
    .from('community_polls')
    .update(updates)
    .eq('id', pollId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, poll: data });
}

// ─── DELETE — Delete poll ───────────────────────────────────────────────────

export async function DELETE(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof Response) return authResult;

  const db = createServerClient();
  const body = await request.json();
  const { pollId } = body;

  if (!pollId) return NextResponse.json({ error: 'pollId required' }, { status: 400 });

  const { error } = await db
    .from('community_polls')
    .delete()
    .eq('id', pollId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
