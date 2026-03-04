/**
 * Destination Resource Downloads
 * GET /api/destination/resources?slug=st-pete-beach
 *
 * Returns downloadable resources (PDFs, GPX files, maps) for a destination.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('slug');
  if (!slug) return NextResponse.json({ resources: [] });

  try {
    // Find listings tagged with this destination that are public resources
    const { data: listings } = await supabase
      .from('directory_listings_public')
      .select('id')
      .eq('is_published', true)
      .contains('tags', [`destination:${slug}`]);

    const listingIds = (listings || []).map((l: any) => l.id);

    if (listingIds.length === 0) {
      return NextResponse.json({ resources: [] });
    }

    const { data: resources, error } = await supabase
      .from('resource_links')
      .select('id, title, description, file_url, file_type, download_count, is_featured')
      .in('listing_id', listingIds)
      .order('is_featured', { ascending: false })
      .order('download_count', { ascending: false })
      .limit(20);

    if (error) {
      // Table may not exist yet
      console.warn('[Destination Resources] Query error:', error.message);
      return NextResponse.json({ resources: [] });
    }

    return NextResponse.json({ resources: resources || [] }, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
    });
  } catch (err: any) {
    return NextResponse.json({ resources: [], error: err.message }, { status: 500 });
  }
}
