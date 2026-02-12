import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
function getServiceClient() { return createClient(supabaseUrl, supabaseServiceKey); }

/**
 * Custom Poll Templates API
 * 
 * GET  /api/directory/addons/polls?listing_id=xxx — Get polls for a listing
 * POST /api/directory/addons/polls                — Create a poll (owner)
 * PATCH /api/directory/addons/polls               — Submit poll response (public)
 */

interface PollQuestion {
  id: string;
  text: string;
  type: 'rating' | 'choice' | 'text';
  options?: string[];
}

interface Poll {
  id: string;
  title: string;
  questions: PollQuestion[];
  responses: any[];
  is_active: boolean;
  created_at: string;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const listingId = searchParams.get('listing_id');

  if (!listingId) {
    return NextResponse.json({ error: 'listing_id required' }, { status: 400 });
  }

  const service = getServiceClient();
  const { data: listing } = await service
    .from('directory_listings')
    .select('id, metadata')
    .eq('id', listingId)
    .single();

  if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 });

  const polls: Poll[] = (listing.metadata?.polls || []).map((p: Poll) => ({
    ...p,
    responses: undefined, // Don't expose individual responses publicly
    response_count: p.responses?.length || 0,
  }));

  return NextResponse.json({ polls: polls.filter(p => p.is_active) });
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { listing_id, title, questions } = body;

    if (!listing_id || !title || !questions?.length) {
      return NextResponse.json({ error: 'listing_id, title, questions required' }, { status: 400 });
    }

    const service = getServiceClient();
    const { data: listing } = await service
      .from('directory_listings')
      .select('id, claimed_by, metadata')
      .eq('id', listing_id)
      .single();

    if (!listing || listing.claimed_by !== user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const newPoll: Poll = {
      id: `poll_${Date.now()}`,
      title,
      questions: questions.map((q: any, i: number) => ({ id: `q_${i}`, ...q })),
      responses: [],
      is_active: true,
      created_at: new Date().toISOString(),
    };

    const metadata = listing.metadata || {};
    const polls = metadata.polls || [];
    polls.push(newPoll);

    const { error } = await service
      .from('directory_listings')
      .update({ metadata: { ...metadata, polls }, updated_at: new Date().toISOString() })
      .eq('id', listing_id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, poll: { ...newPoll, responses: undefined } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Submit poll response (public)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { listing_id, poll_id, answers } = body;

    if (!listing_id || !poll_id || !answers) {
      return NextResponse.json({ error: 'listing_id, poll_id, answers required' }, { status: 400 });
    }

    const service = getServiceClient();
    const { data: listing } = await service
      .from('directory_listings')
      .select('id, metadata')
      .eq('id', listing_id)
      .single();

    if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 });

    const metadata = listing.metadata || {};
    const polls: Poll[] = metadata.polls || [];
    const pollIdx = polls.findIndex(p => p.id === poll_id && p.is_active);

    if (pollIdx === -1) return NextResponse.json({ error: 'Poll not found' }, { status: 404 });

    polls[pollIdx].responses.push({
      answers,
      submitted_at: new Date().toISOString(),
    });

    const { error } = await service
      .from('directory_listings')
      .update({ metadata: { ...metadata, polls }, updated_at: new Date().toISOString() })
      .eq('id', listing_id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, message: 'Response recorded' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
