/**
 * Anonymous Feedback API
 *
 * GET /api/brain/feedback?businessId=...
 *   → Get anonymous feedback for a business (admin/owner only)
 *   → Supports filtering by sentiment, urgency, reviewed status
 *
 * PATCH /api/brain/feedback
 *   → Mark feedback as reviewed, add admin notes
 *
 * POST /api/brain/feedback/report
 *   → Generate AI coaching report from recent feedback
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');
    const sentiment = searchParams.get('sentiment');
    const unreviewed = searchParams.get('unreviewed') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!businessId) {
      return NextResponse.json({ error: 'businessId required' }, { status: 400 });
    }

    // Verify user is owner/admin of this business
    const { data: access } = await supabase
      .from('user_businesses')
      .select('role')
      .eq('user_id', user.id)
      .eq('business_id', businessId)
      .single();

    if (!access || !['owner', 'admin'].includes(access.role)) {
      return NextResponse.json({ error: 'Only owners and admins can view feedback' }, { status: 403 });
    }

    let query = supabase
      .from('anonymous_feedback')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (sentiment) {
      query = query.eq('sentiment', sentiment);
    }

    if (unreviewed) {
      query = query.eq('is_reviewed', false);
    }

    const { data: feedback, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get summary stats
    const { data: stats } = await supabase
      .from('anonymous_feedback')
      .select('sentiment')
      .eq('business_id', businessId);

    const sentimentCounts = {
      positive: 0,
      negative: 0,
      neutral: 0,
      mixed: 0,
      unclassified: 0,
      total: stats?.length || 0,
    };

    stats?.forEach((item: any) => {
      if (item.sentiment && sentimentCounts.hasOwnProperty(item.sentiment)) {
        sentimentCounts[item.sentiment as keyof typeof sentimentCounts] =
          (sentimentCounts[item.sentiment as keyof typeof sentimentCounts] as number) + 1;
      } else {
        sentimentCounts.unclassified++;
      }
    });

    return NextResponse.json({
      feedback: feedback || [],
      stats: sentimentCounts,
    });

  } catch (error: any) {
    console.error('GET /api/brain/feedback error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { feedbackId, adminNotes } = body;

    if (!feedbackId) {
      return NextResponse.json({ error: 'feedbackId required' }, { status: 400 });
    }

    const { data: updated, error } = await supabase
      .from('anonymous_feedback')
      .update({
        is_reviewed: true,
        reviewed_at: new Date().toISOString(),
        admin_notes: adminNotes || null,
      })
      .eq('id', feedbackId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, feedback: updated });

  } catch (error: any) {
    console.error('PATCH /api/brain/feedback error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
