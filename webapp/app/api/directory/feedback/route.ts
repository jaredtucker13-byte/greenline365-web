import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
function getServiceClient() { return createClient(supabaseUrl, supabaseServiceKey); }

// GET /api/directory/feedback?listing_id=xxx - Get feedback for a listing
export async function GET(request: NextRequest) {
  const supabase = getServiceClient();
  const { searchParams } = new URL(request.url);
  const listingId = searchParams.get('listing_id');

  if (!listingId) return NextResponse.json({ error: 'listing_id required' }, { status: 400 });

  const { data, error } = await supabase
    .from('directory_feedback')
    .select('*')
    .eq('listing_id', listingId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

// POST /api/directory/feedback - Submit public feedback (no auth required)
export async function POST(request: NextRequest) {
  const supabase = getServiceClient();
  const body = await request.json();
  const { listing_id, rating, feedback_text, feedback_type, categories, submitter_name, submitter_email, is_red_flag, red_flag_type, source } = body;

  if (!listing_id || !rating) {
    return NextResponse.json({ error: 'listing_id and rating required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('directory_feedback')
    .insert({
      listing_id, rating: Math.min(5, Math.max(1, rating)),
      feedback_text: feedback_text || null,
      feedback_type: feedback_type || 'general',
      categories: categories || {},
      submitter_name: submitter_name || null,
      submitter_email: submitter_email || null,
      is_red_flag: is_red_flag || false,
      red_flag_type: red_flag_type || null,
      source: source || 'qr',
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Check if feedback triggers a badge
  const { data: listing } = await supabase
    .from('directory_listings')
    .select('id, total_feedback_count, avg_feedback_rating')
    .eq('id', listing_id)
    .single();

  if (listing && listing.total_feedback_count >= 50 && listing.avg_feedback_rating >= 4.0) {
    // Check if community_favorite badge already exists
    const { data: existing } = await supabase
      .from('directory_badges')
      .select('id')
      .eq('listing_id', listing_id)
      .eq('badge_type', 'community_favorite')
      .eq('is_active', true)
      .single();

    if (!existing) {
      await supabase.from('directory_badges').insert({
        listing_id, badge_type: 'community_favorite',
        badge_label: 'Community Favorite', badge_color: '#00D4FF', badge_icon: 'heart',
        earned_via: 'feedback', earned_details: { threshold: 50, avg_rating: listing.avg_feedback_rating },
        feedback_threshold_met: true,
      });
    }
  }

  return NextResponse.json(data, { status: 201 });
}
