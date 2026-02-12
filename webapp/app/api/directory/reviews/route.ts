import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
function getServiceClient() { return createClient(supabaseUrl, supabaseServiceKey); }

/**
 * GL365 Reviews API
 *
 * GET   /api/directory/reviews?listing_id=xxx         — Public: get reviews for a listing
 * POST  /api/directory/reviews                        — Public: submit a review
 * PATCH /api/directory/reviews                        — Owner: respond to review / manage
 */

interface Review {
  id: string;
  reviewer_name: string;
  rating: number;
  text: string;
  created_at: string;
  response: { text: string; responded_at: string; method: 'manual' | 'ai_approved' | 'ai_auto' } | null;
  ai_draft: { text: string; generated_at: string; status: 'pending' | 'approved' | 'rejected' | 'edited' } | null;
}

// Generate AI response draft
async function generateAIResponse(businessName: string, industry: string, reviewText: string, rating: number, reviewerName: string, ownerPreferences?: string): Promise<string> {
  if (!OPENROUTER_API_KEY) return '';

  const prompt = `You are responding to a customer review on behalf of "${businessName}" (a ${industry.replace(/-/g, ' ')} business).

Review by ${reviewerName} (${rating}/5 stars):
"${reviewText}"

${ownerPreferences ? `Business owner tone preferences: ${ownerPreferences}` : ''}

Write a professional, warm, and authentic response (2-4 sentences). Be specific to what they mentioned. If positive, thank them genuinely. If negative, acknowledge the concern, apologize where appropriate, and offer to make it right. Never be defensive. Sign off with just the business name.`;

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://greenline365.com',
        'X-Title': 'GL365 Review Response AI',
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    if (!res.ok) return '';
    const data = await res.json();
    return data.choices?.[0]?.message?.content || '';
  } catch {
    return '';
  }
}

// GET — Public: reviews for a listing
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const listingId = searchParams.get('listing_id');

  if (!listingId) return NextResponse.json({ error: 'listing_id required' }, { status: 400 });

  const service = getServiceClient();
  const { data: listing } = await service
    .from('directory_listings')
    .select('id, business_name, metadata')
    .eq('id', listingId)
    .single();

  if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 });

  const reviews: Review[] = (listing.metadata?.gl365_reviews || []).map((r: Review) => ({
    id: r.id,
    reviewer_name: r.reviewer_name,
    rating: r.rating,
    text: r.text,
    created_at: r.created_at,
    response: r.response,
    // Don't expose AI drafts publicly
  }));

  // Sort newest first
  reviews.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const avgRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

  return NextResponse.json({
    reviews,
    total: reviews.length,
    average_rating: Math.round(avgRating * 10) / 10,
  });
}

// POST — Public: submit a review
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { listing_id, reviewer_name, rating, text } = body;

    if (!listing_id || !reviewer_name || !rating || !text) {
      return NextResponse.json({ error: 'listing_id, reviewer_name, rating, text required' }, { status: 400 });
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be 1-5' }, { status: 400 });
    }

    const service = getServiceClient();
    const { data: listing } = await service
      .from('directory_listings')
      .select('id, business_name, industry, metadata')
      .eq('id', listing_id)
      .single();

    if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 });

    const metadata = listing.metadata || {};
    const reviews: Review[] = metadata.gl365_reviews || [];
    const settings = metadata.review_settings || {};
    const activityLog: any[] = metadata.review_activity_log || [];

    const newReview: Review = {
      id: `rev_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      reviewer_name,
      rating,
      text,
      created_at: new Date().toISOString(),
      response: null,
      ai_draft: null,
    };

    // Generate AI draft response
    const aiDraftText = await generateAIResponse(
      listing.business_name,
      listing.industry,
      text,
      rating,
      reviewer_name,
      settings.tone_preferences
    );

    if (aiDraftText) {
      newReview.ai_draft = {
        text: aiDraftText,
        generated_at: new Date().toISOString(),
        status: 'pending',
      };

      // If autopilot is on, auto-approve and post the response
      if (settings.auto_respond) {
        newReview.response = {
          text: aiDraftText,
          responded_at: new Date().toISOString(),
          method: 'ai_auto',
        };
        newReview.ai_draft.status = 'approved';

        activityLog.push({
          type: 'ai_auto_response',
          review_id: newReview.id,
          timestamp: new Date().toISOString(),
        });
      }
    }

    reviews.push(newReview);

    // Log the review submission
    activityLog.push({
      type: 'review_submitted',
      review_id: newReview.id,
      reviewer_name,
      rating,
      timestamp: new Date().toISOString(),
    });

    // Update avg rating
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    const { error } = await service
      .from('directory_listings')
      .update({
        metadata: { ...metadata, gl365_reviews: reviews, review_activity_log: activityLog },
        avg_feedback_rating: Math.round(avgRating * 10) / 10,
        total_feedback_count: reviews.length,
        updated_at: new Date().toISOString(),
      })
      .eq('id', listing_id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({
      success: true,
      review_id: newReview.id,
      ai_response_auto: settings.auto_respond && !!aiDraftText,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH — Owner: respond to review, toggle settings, provide feedback
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { listing_id, action } = body;

    if (!listing_id || !action) {
      return NextResponse.json({ error: 'listing_id and action required' }, { status: 400 });
    }

    const service = getServiceClient();
    const { data: listing } = await service
      .from('directory_listings')
      .select('id, claimed_by, business_name, industry, metadata')
      .eq('id', listing_id)
      .single();

    if (!listing || listing.claimed_by !== user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const metadata = listing.metadata || {};
    const reviews: Review[] = metadata.gl365_reviews || [];
    const settings = metadata.review_settings || {};
    const activityLog: any[] = metadata.review_activity_log || [];

    switch (action) {
      // Approve AI draft response
      case 'approve_draft': {
        const { review_id } = body;
        const idx = reviews.findIndex(r => r.id === review_id);
        if (idx === -1) return NextResponse.json({ error: 'Review not found' }, { status: 404 });

        if (!reviews[idx].ai_draft) return NextResponse.json({ error: 'No AI draft to approve' }, { status: 400 });

        reviews[idx].response = {
          text: reviews[idx].ai_draft!.text,
          responded_at: new Date().toISOString(),
          method: 'ai_approved',
        };
        reviews[idx].ai_draft!.status = 'approved';

        activityLog.push({ type: 'draft_approved', review_id, timestamp: new Date().toISOString() });
        break;
      }

      // Edit and post response (owner modifies AI draft or writes their own)
      case 'respond': {
        const { review_id, response_text } = body;
        const idx = reviews.findIndex(r => r.id === review_id);
        if (idx === -1) return NextResponse.json({ error: 'Review not found' }, { status: 404 });

        reviews[idx].response = {
          text: response_text,
          responded_at: new Date().toISOString(),
          method: 'manual',
        };
        if (reviews[idx].ai_draft) reviews[idx].ai_draft!.status = 'edited';

        activityLog.push({ type: 'manual_response', review_id, timestamp: new Date().toISOString() });
        break;
      }

      // Reject AI draft
      case 'reject_draft': {
        const { review_id: rejId } = body;
        const idx = reviews.findIndex(r => r.id === rejId);
        if (idx === -1) return NextResponse.json({ error: 'Review not found' }, { status: 404 });

        if (reviews[idx].ai_draft) reviews[idx].ai_draft!.status = 'rejected';

        activityLog.push({ type: 'draft_rejected', review_id: rejId, timestamp: new Date().toISOString() });
        break;
      }

      // Regenerate AI draft with feedback
      case 'regenerate': {
        const { review_id: regenId, feedback } = body;
        const idx = reviews.findIndex(r => r.id === regenId);
        if (idx === -1) return NextResponse.json({ error: 'Review not found' }, { status: 404 });

        const review = reviews[idx];
        const newDraft = await generateAIResponse(
          listing.business_name,
          listing.industry,
          review.text,
          review.rating,
          review.reviewer_name,
          feedback || settings.tone_preferences
        );

        if (newDraft) {
          reviews[idx].ai_draft = {
            text: newDraft,
            generated_at: new Date().toISOString(),
            status: 'pending',
          };
        }

        activityLog.push({ type: 'draft_regenerated', review_id: regenId, feedback, timestamp: new Date().toISOString() });
        break;
      }

      // Toggle autopilot
      case 'toggle_auto': {
        const newAutoState = !settings.auto_respond;
        settings.auto_respond = newAutoState;
        settings[newAutoState ? 'auto_enabled_at' : 'auto_disabled_at'] = new Date().toISOString();

        activityLog.push({
          type: newAutoState ? 'autopilot_enabled' : 'autopilot_disabled',
          timestamp: new Date().toISOString(),
        });
        break;
      }

      // Update tone preferences
      case 'update_tone': {
        const { tone_preferences } = body;
        settings.tone_preferences = tone_preferences;

        activityLog.push({ type: 'tone_updated', tone_preferences, timestamp: new Date().toISOString() });
        break;
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const { error } = await service
      .from('directory_listings')
      .update({
        metadata: { ...metadata, gl365_reviews: reviews, review_settings: settings, review_activity_log: activityLog },
        updated_at: new Date().toISOString(),
      })
      .eq('id', listing_id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, settings, reviews_count: reviews.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Manage endpoint for business owners — returns reviews with AI drafts
export { };
