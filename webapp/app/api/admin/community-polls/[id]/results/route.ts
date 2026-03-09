import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth/middleware';

/**
 * Admin Community Poll Results API
 *
 * GET /api/admin/community-polls/[id]/results — Vote data for a specific poll
 *
 * Protected with requireAdmin + is_admin check.
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof Response) return authResult;

  const { id: pollId } = await params;
  const db = createServerClient();

  // Get poll
  const { data: poll, error: pollError } = await db
    .from('community_polls')
    .select('*')
    .eq('id', pollId)
    .single();

  if (pollError || !poll) {
    return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
  }

  // Get options sorted by votes
  const { data: options } = await db
    .from('community_poll_options')
    .select('id, poll_id, business_id, business_name, business_image, vote_count, created_at')
    .eq('poll_id', pollId)
    .order('vote_count', { ascending: false });

  // Get total unique voters
  const { count: totalVoters } = await db
    .from('community_poll_votes')
    .select('*', { count: 'exact', head: true })
    .eq('poll_id', pollId);

  // Get votes over time (grouped by day)
  const { data: votes } = await db
    .from('community_poll_votes')
    .select('created_at, option_id')
    .eq('poll_id', pollId)
    .order('created_at');

  // Group votes by day
  const votesByDay: Record<string, number> = {};
  for (const v of votes || []) {
    const day = new Date(v.created_at).toISOString().split('T')[0];
    votesByDay[day] = (votesByDay[day] || 0) + 1;
  }

  const totalVotes = (options || []).reduce((s: number, o: any) => s + (o.vote_count || 0), 0);

  return NextResponse.json({
    poll,
    options: (options || []).map((opt: any, idx: number) => ({
      ...opt,
      rank: idx + 1,
      percentage: totalVotes > 0 ? Math.round((opt.vote_count / totalVotes) * 100) : 0,
    })),
    totalVotes,
    totalVoters: totalVoters || 0,
    votesByDay,
  });
}
