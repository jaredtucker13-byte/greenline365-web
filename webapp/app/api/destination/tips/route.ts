/**
 * Destination Insider Tips
 * GET /api/destination/tips?slug=st-pete-beach
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('slug');
  if (!slug) return NextResponse.json({ tips: [] });

  try {
    const { data, error } = await supabase
      .from('destination_tips')
      .select('id, tip_text, tip_category, upvotes')
      .eq('destination_slug', slug)
      .eq('is_approved', true)
      .order('sort_order', { ascending: true })
      .order('upvotes', { ascending: false })
      .limit(20);

    if (error) {
      // Table may not exist yet
      console.warn('[Destination Tips] Query error:', error.message);
      return NextResponse.json({ tips: [] });
    }

    return NextResponse.json({ tips: data || [] }, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
    });
  } catch (err: any) {
    return NextResponse.json({ tips: [], error: err.message }, { status: 500 });
  }
}
