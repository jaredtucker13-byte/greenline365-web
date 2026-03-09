import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
function getServiceClient() { return createClient(supabaseUrl, supabaseServiceKey); }

/**
 * Community Poll Vote API
 *
 * POST /api/directory/community-polls/vote
 * Body: { poll_id: string, option_id: string }
 *
 * Generates a voter fingerprint from IP + User-Agent to prevent
 * duplicate votes without requiring login.
 */

function generateFingerprint(request: NextRequest): string {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown';
  const ua = request.headers.get('user-agent') || 'unknown';

  return createHash('sha256')
    .update(`${ip}::${ua}`)
    .digest('hex');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { poll_id, option_id } = body;

    if (!poll_id || !option_id) {
      return NextResponse.json({ error: 'poll_id and option_id required' }, { status: 400 });
    }

    const service = getServiceClient();
    const fingerprint = generateFingerprint(request);

    // Verify poll is active
    const { data: poll } = await service
      .from('community_polls')
      .select('id, status, closes_at')
      .eq('id', poll_id)
      .single();

    if (!poll) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
    }

    if (poll.status !== 'active') {
      return NextResponse.json({ error: 'Poll is not active' }, { status: 400 });
    }

    if (poll.closes_at && new Date(poll.closes_at) < new Date()) {
      return NextResponse.json({ error: 'Poll has closed' }, { status: 400 });
    }

    // Verify option belongs to this poll
    const { data: option } = await service
      .from('community_poll_options')
      .select('id, poll_id')
      .eq('id', option_id)
      .eq('poll_id', poll_id)
      .single();

    if (!option) {
      return NextResponse.json({ error: 'Option not found for this poll' }, { status: 404 });
    }

    // Insert vote (unique constraint will prevent duplicates)
    const { error: voteError } = await service
      .from('community_poll_votes')
      .insert({
        poll_id,
        option_id,
        voter_fingerprint: fingerprint,
      });

    if (voteError) {
      if (voteError.code === '23505') {
        return NextResponse.json({ error: 'You have already voted in this poll' }, { status: 409 });
      }
      return NextResponse.json({ error: voteError.message }, { status: 500 });
    }

    // Increment denormalized vote_count
    const { error: rpcError } = await service.rpc('increment_vote_count', { target_option_id: option_id });
    if (rpcError) {
      // Fallback: manual increment if RPC doesn't exist yet
      await service
        .from('community_poll_options')
        .update({ vote_count: (option as any).vote_count + 1 })
        .eq('id', option_id);
    }

    return NextResponse.json({ success: true, message: 'Vote recorded' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
