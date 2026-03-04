import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
function getServiceClient() { return createClient(supabaseUrl, supabaseServiceKey); }

/**
 * GET /api/loops/[slug]
 *
 * Returns full loop detail including all stops with joined listing data.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const service = getServiceClient();

  try {
    // Fetch the loop
    const { data: loop, error: loopError } = await service
      .from('loops')
      .select('*')
      .eq('slug', slug)
      .eq('is_published', true)
      .single();

    if (loopError || !loop) {
      return NextResponse.json({ error: 'Loop not found' }, { status: 404 });
    }

    // Fetch stops with joined listing data
    const { data: stops } = await service
      .from('loop_stops')
      .select(`
        id,
        stop_order,
        custom_name,
        custom_description,
        custom_image_url,
        duration_minutes,
        transition_note,
        metadata,
        listing:directory_listings_public (
          id,
          business_name,
          slug,
          industry,
          city,
          state,
          cover_image_url,
          tier,
          avg_feedback_rating,
          total_feedback_count,
          phone
        )
      `)
      .eq('loop_id', loop.id)
      .order('stop_order', { ascending: true });

    // Fetch related loops (same destination or same type, excluding current)
    const { data: related } = await service
      .from('loops')
      .select('id, name, slug, loop_type, destination_slug, cover_image_url, duration_estimate, vibe, short_description')
      .eq('is_published', true)
      .neq('id', loop.id)
      .or(`destination_slug.eq.${loop.destination_slug},loop_type.eq.${loop.loop_type}`)
      .limit(3);

    return NextResponse.json({
      loop: {
        ...loop,
        stops: stops || [],
        stops_count: stops?.length || 0,
      },
      related: related || [],
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
