import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
function getServiceClient() { return createClient(supabaseUrl, supabaseServiceKey); }

/**
 * Community Polls API — Public
 *
 * GET /api/directory/community-polls
 *   ?status=active          — filter by status (default: active)
 *   ?category=plumbing      — filter by category
 *   ?destination=tampa      — filter by destination_slug
 *   ?limit=10               — max polls to return
 *
 * Returns active polls with their options sorted by vote_count DESC.
 */

export async function GET(request: NextRequest) {
  const service = getServiceClient();
  const { searchParams } = new URL(request.url);

  const status = searchParams.get('status') || 'active';
  const category = searchParams.get('category');
  const destination = searchParams.get('destination');
  const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);

  // Build polls query
  let pollsQuery = service
    .from('community_polls')
    .select('id, title, description, category, destination_slug, status, created_at, closes_at')
    .eq('status', status)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (category) pollsQuery = pollsQuery.eq('category', category);
  if (destination) pollsQuery = pollsQuery.eq('destination_slug', destination);

  const { data: polls, error: pollsError } = await pollsQuery;

  if (pollsError) {
    return NextResponse.json({ error: pollsError.message }, { status: 500 });
  }

  if (!polls || polls.length === 0) {
    return NextResponse.json({ polls: [] });
  }

  // Fetch options for all returned polls
  const pollIds = polls.map(p => p.id);
  const { data: options, error: optionsError } = await service
    .from('community_poll_options')
    .select('id, poll_id, business_id, business_name, business_image, vote_count')
    .in('poll_id', pollIds)
    .order('vote_count', { ascending: false });

  if (optionsError) {
    return NextResponse.json({ error: optionsError.message }, { status: 500 });
  }

  // Group options by poll_id
  const optionsByPoll = new Map<string, typeof options>();
  for (const opt of options || []) {
    const existing = optionsByPoll.get(opt.poll_id) || [];
    existing.push(opt);
    optionsByPoll.set(opt.poll_id, existing);
  }

  // Assemble response
  const result = polls.map(poll => ({
    ...poll,
    options: optionsByPoll.get(poll.id) || [],
    total_votes: (optionsByPoll.get(poll.id) || []).reduce((sum, o) => sum + (o.vote_count || 0), 0),
  }));

  return NextResponse.json({ polls: result });
}
