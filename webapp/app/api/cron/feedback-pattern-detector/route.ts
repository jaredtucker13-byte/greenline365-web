/**
 * Feedback Pattern Detector Cron
 *
 * Runs daily. Analyzes anonymous feedback for PATTERNS, not individual complaints.
 *
 * THE RULE:
 * - One person saying something = stored but invisible to owner
 * - A PATTERN (3+ mentions of same theme, or recurring theme over time) = generates an insight
 * - Only insights get surfaced to business owner, NEVER individual feedback
 *
 * This protects employees while giving owners actionable intelligence.
 *
 * GET /api/cron/feedback-pattern-detector
 *   Protected by CRON_SECRET.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { callOpenRouterJSON } from '@/lib/openrouter';
import { notify } from '@/lib/notifications';

// Minimum number of feedback entries mentioning the same theme before it becomes a pattern
const PATTERN_THRESHOLD = 3;

// Look back window in days
const LOOKBACK_DAYS = 30;

export async function GET(request: NextRequest) {
  // Verify cron secret
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServerClient();

  try {
    const lookbackDate = new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000).toISOString();

    // Get all businesses that have feedback
    const { data: businesses } = await supabase
      .from('anonymous_feedback')
      .select('business_id')
      .gte('created_at', lookbackDate)
      .order('business_id');

    if (!businesses?.length) {
      return NextResponse.json({ message: 'No feedback to analyze', patterns: 0 });
    }

    // Deduplicate business IDs
    const uniqueBusinessIds = [...new Set(businesses.map((b: any) => b.business_id))];
    let totalPatterns = 0;

    for (const businessId of uniqueBusinessIds) {
      // Get recent feedback for this business
      const { data: feedback } = await supabase
        .from('anonymous_feedback')
        .select('id, feedback_text, sentiment, themes, urgency, ai_summary, created_at')
        .eq('business_id', businessId)
        .gte('created_at', lookbackDate)
        .order('created_at', { ascending: false });

      if (!feedback || feedback.length < PATTERN_THRESHOLD) {
        continue; // Not enough data points for patterns
      }

      // Analyze for patterns using AI
      const patterns = await detectPatterns(feedback);

      if (patterns.length === 0) continue;

      totalPatterns += patterns.length;

      // Store each detected pattern as a feedback insight
      for (const pattern of patterns) {
        // Only surface patterns that meet threshold
        if (pattern.mention_count < PATTERN_THRESHOLD) continue;

        const { data: insight } = await supabase
          .from('feedback_insights')
          .upsert({
            business_id: businessId,
            theme: pattern.theme,
            pattern_summary: pattern.summary,
            mention_count: pattern.mention_count,
            sentiment_trend: pattern.sentiment_trend,
            urgency: pattern.urgency,
            recommended_actions: pattern.recommended_actions,
            time_span_days: LOOKBACK_DAYS,
            detected_at: new Date().toISOString(),
          }, {
            onConflict: 'business_id,theme',
          })
          .select('id')
          .single();

        // Notify the business owner about the pattern (NOT individual feedback)
        if (insight) {
          await notify({
            businessId: businessId as string,
            title: `Team Insight: "${pattern.theme}"`,
            body: pattern.summary,
            category: 'feedback',
            severity: pattern.urgency === 'high' ? 'warning' : 'info',
            sourceType: 'feedback_insight',
            sourceId: insight.id as string,
            actionUrl: '/admin-v2/team-insights',
            actionLabel: 'View Insight',
            channels: ['dashboard'],
          });
        }
      }
    }

    return NextResponse.json({
      message: `Analyzed ${uniqueBusinessIds.length} businesses, found ${totalPatterns} patterns`,
      businesses_analyzed: uniqueBusinessIds.length,
      patterns_detected: totalPatterns,
    });

  } catch (error: any) {
    console.error('[Feedback Pattern Detector] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ── Pattern Detection AI ───────────────────────────────────────────

interface FeedbackPattern {
  theme: string;
  summary: string;
  mention_count: number;
  sentiment_trend: string;
  urgency: string;
  recommended_actions: string[];
}

async function detectPatterns(feedback: any[]): Promise<FeedbackPattern[]> {
  try {
    const feedbackSummaries = feedback.map((f, i) =>
      `[${i + 1}] ${f.ai_summary || f.feedback_text.substring(0, 200)} (sentiment: ${f.sentiment || 'unknown'}, themes: ${f.themes?.join(', ') || 'none'})`
    ).join('\n');

    const { parsed } = await callOpenRouterJSON({
      model: 'anthropic/claude-sonnet-4.6',
      messages: [{
        role: 'system',
        content: `You analyze anonymous employee feedback for a service business looking for PATTERNS.

IMPORTANT RULES:
- You are looking for PATTERNS, not individual complaints
- A pattern = the same theme appearing in ${PATTERN_THRESHOLD}+ separate feedback entries
- One person complaining about something is NOT a pattern
- You must be able to point to multiple separate entries that share the theme
- Protect individual identity — never quote individual feedback verbatim
- Focus on actionable insights the business owner can use to improve

Return JSON:
{
  "patterns": [
    {
      "theme": "Short theme name (e.g., 'Communication gaps', 'Schedule concerns', 'Tool quality')",
      "summary": "2-3 sentence summary of the pattern WITHOUT identifying individuals. Use language like 'multiple team members' or 'several employees'",
      "mention_count": 3,
      "sentiment_trend": "worsening|stable|improving",
      "urgency": "low|medium|high",
      "recommended_actions": ["Action 1", "Action 2"]
    }
  ]
}

If no patterns meet the ${PATTERN_THRESHOLD}-mention threshold, return: {"patterns": []}`
      }, {
        role: 'user',
        content: `Analyze these ${feedback.length} anonymous feedback entries for patterns:\n\n${feedbackSummaries}`
      }],
      temperature: 0.3,
      max_tokens: 1500,
      caller: 'GL365 Feedback Pattern Detector',
    });

    return parsed.patterns || [];
  } catch (error) {
    console.error('[Pattern Detection] AI error:', error);
    return [];
  }
}
