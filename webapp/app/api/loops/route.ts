import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
function getServiceClient() { return createClient(supabaseUrl, supabaseServiceKey); }

/**
 * GET /api/loops
 *
 * Query params:
 *   ?type=date-night     — filter by loop_type
 *   ?destination=st-pete-beach — filter by destination_slug
 *   ?listing_id=uuid     — find loops containing a specific listing
 *   ?limit=20            — max results (default 50)
 */
export async function GET(request: NextRequest) {
  const service = getServiceClient();
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const destination = searchParams.get('destination');
  const listingId = searchParams.get('listing_id');
  const limit = parseInt(searchParams.get('limit') || '50', 10);

  try {
    // If filtering by listing_id, find loops that contain this listing
    if (listingId) {
      const { data: stops } = await service
        .from('loop_stops')
        .select('loop_id')
        .eq('listing_id', listingId);

      if (!stops || stops.length === 0) {
        return NextResponse.json({ loops: [], total: 0 });
      }

      const loopIds = [...new Set(stops.map(s => s.loop_id))];
      const { data: loops } = await service
        .from('loops')
        .select('*')
        .in('id', loopIds)
        .eq('is_published', true)
        .order('sort_order', { ascending: true })
        .limit(limit);

      return NextResponse.json({ loops: loops || [], total: loops?.length || 0 });
    }

    // Standard query with optional filters
    let query = service
      .from('loops')
      .select('*, loop_stops(id)', { count: 'exact' })
      .eq('is_published', true)
      .order('sort_order', { ascending: true })
      .limit(limit);

    if (type) query = query.eq('loop_type', type);
    if (destination) query = query.eq('destination_slug', destination);

    const { data: loops, count } = await query;

    // Add stop counts
    const loopsWithCounts = (loops || []).map(loop => ({
      ...loop,
      stops_count: loop.loop_stops?.length || 0,
      loop_stops: undefined,
    }));

    return NextResponse.json({ loops: loopsWithCounts, total: count || 0 });
  } catch (error: any) {
    return NextResponse.json({ loops: [], total: 0, error: error.message }, { status: 500 });
  }
}
