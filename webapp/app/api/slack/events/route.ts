/**
 * Slack Events API Handler
 *
 * Receives all events from the Slack workspace:
 * - Messages in #second-brain → Brain capture + AI classification
 * - Messages in #anonymous-feedback → Strip identity, store, delete original
 * - URL verification challenge (required for Slack app setup)
 *
 * POST /api/slack/events
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { callOpenRouterJSON } from '@/lib/openrouter';
import {
  verifySlackSignature,
  classifyChannel,
  postMessage,
  deleteMessage,
  addReaction,
  downloadSlackFile,
  formatBrainAckBlocks,
  formatFeedbackAckBlocks,
  type SlackEvent,
  type SlackMessageEvent,
} from '@/lib/slack';

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const body: SlackEvent = JSON.parse(rawBody);

    // ── Step 1: URL Verification (Slack sends this during app setup) ──
    if (body.type === 'url_verification') {
      return NextResponse.json({ challenge: body.challenge });
    }

    // ── Step 2: Verify request signature ──
    const signingSecret = process.env.SLACK_SIGNING_SECRET;
    if (signingSecret) {
      const signature = request.headers.get('x-slack-signature') || '';
      const timestamp = request.headers.get('x-slack-request-timestamp') || '';

      if (!verifySlackSignature(signingSecret, signature, timestamp, rawBody)) {
        console.error('[Slack Events] Invalid signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    // ── Step 3: Process event callbacks ──
    if (body.type === 'event_callback' && body.event) {
      const event = body.event;

      // Ignore bot messages (prevent loops)
      if (event.bot_id || event.subtype === 'bot_message') {
        return NextResponse.json({ ok: true });
      }

      // Ignore message edits/deletes
      if (event.subtype && event.subtype !== 'file_share') {
        return NextResponse.json({ ok: true });
      }

      // Route based on channel
      const channelType = classifyChannel(event.channel);

      switch (channelType) {
        case 'brain':
          // Respond immediately, process async
          await handleBrainMessage(event);
          break;

        case 'feedback':
          await handleAnonymousFeedback(event);
          break;

        default:
          console.log(`[Slack Events] Unrouted message in channel ${event.channel}`);
          break;
      }
    }

    // Slack expects a 200 within 3 seconds
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('[Slack Events] Error:', error);
    // Still return 200 to prevent Slack from retrying
    return NextResponse.json({ ok: true });
  }
}

// ── Brain Message Handler ──────────────────────────────────────────

async function handleBrainMessage(event: SlackMessageEvent) {
  const supabase = createServerClient();
  const businessId = process.env.BUSINESS_ID;

  if (!businessId) {
    console.error('[Slack Brain] BUSINESS_ID not configured');
    return;
  }

  try {
    // Acknowledge receipt with a reaction
    await addReaction(event.channel, event.ts, 'brain').catch(() => {});

    // Save to brain_thoughts inbox
    const { data: thought, error: saveError } = await supabase
      .from('brain_thoughts')
      .insert({
        business_id: businessId,
        raw_text: event.text,
        source: 'slack',
        slack_message_id: event.ts,
        slack_thread_ts: event.thread_ts,
      })
      .select()
      .single();

    if (saveError) {
      console.error('[Slack Brain] Save error:', saveError);
      return;
    }

    // Classify with AI
    const classification = await classifyThought(event.text);

    // Route to appropriate bucket
    await routeThought(supabase, thought.id, businessId, event.text, classification);

    // Mark as processed
    await supabase
      .from('brain_thoughts')
      .update({
        is_processed: true,
        classified_bucket: classification.bucket,
        confidence: classification.confidence,
        processed_at: new Date().toISOString(),
      })
      .eq('id', thought.id);

    // Reply in thread with classification result
    await postMessage({
      channel: event.channel,
      text: `Captured → ${classification.bucket}: ${classification.title || 'Thought captured'}`,
      thread_ts: event.ts,
      blocks: formatBrainAckBlocks(classification),
    });

  } catch (error) {
    console.error('[Slack Brain] Processing error:', error);
  }
}

// ── Anonymous Feedback Handler ─────────────────────────────────────

async function handleAnonymousFeedback(event: SlackMessageEvent) {
  const supabase = createServerClient();
  const businessId = process.env.BUSINESS_ID;

  if (!businessId) {
    console.error('[Slack Feedback] BUSINESS_ID not configured');
    return;
  }

  try {
    // Step 1: Store the feedback with NO identity information
    const { error: saveError } = await supabase
      .from('anonymous_feedback')
      .insert({
        business_id: businessId,
        feedback_text: event.text,
        sentiment: null, // Will be classified async
        source_channel: 'slack',
        has_attachments: !!(event.files && event.files.length > 0),
      });

    if (saveError) {
      console.error('[Slack Feedback] Save error:', saveError);
      return;
    }

    // Step 2: Delete the original message to erase identity
    try {
      await deleteMessage(event.channel, event.ts);
    } catch (deleteErr) {
      // If we can't delete (permissions), at least we tried
      console.error('[Slack Feedback] Could not delete original message:', deleteErr);
    }

    // Step 3: Post anonymous acknowledgment
    await postMessage({
      channel: event.channel,
      text: 'Anonymous feedback received. Your identity has been removed.',
      blocks: formatFeedbackAckBlocks(),
    });

    // Step 4: Classify sentiment asynchronously
    await classifyFeedbackSentiment(supabase, event.text, businessId);

  } catch (error) {
    console.error('[Slack Feedback] Processing error:', error);
  }
}

// ── AI Classification ──────────────────────────────────────────────

async function classifyThought(text: string): Promise<{
  bucket: string;
  confidence: number;
  reasoning: string;
  title?: string;
}> {
  try {
    const { parsed } = await callOpenRouterJSON({
      model: 'anthropic/claude-sonnet-4.6',
      messages: [{
        role: 'system',
        content: `You are an intelligent thought router for a business owner's "Second Brain." Classify incoming thoughts into the correct bucket.

BUCKETS:
- people: Mentions a specific person by name, relationship context, follow-up reminders, networking notes.
- projects: Active work items, business goals, tasks with deliverables, things being built.
- ideas: Insights, concepts, future possibilities, brainstorms, strategies.
- admin: Errands, todos, deadlines, bills, scheduling, operational tasks.

RULES:
- If it mentions a person's name → people
- If it has an action verb + deliverable → projects
- If it's speculative or starts with "what if" → ideas
- If it's a routine task or errand → admin
- When unsure, choose the most actionable bucket

Return JSON: {"bucket": "people|projects|ideas|admin", "confidence": 0.0-1.0, "title": "short 5-8 word title", "reasoning": "brief explanation"}`
      }, {
        role: 'user',
        content: `Classify this thought:\n\n"${text}"`
      }],
      temperature: 0.2,
      max_tokens: 200,
      caller: 'GL365 Slack Brain Router',
    });

    return parsed;
  } catch (error) {
    console.error('[Classify Thought] Error:', error);
    return { bucket: 'ideas', confidence: 0.5, reasoning: 'Classification failed' };
  }
}

async function routeThought(
  supabase: any,
  thoughtId: string,
  businessId: string,
  text: string,
  classification: { bucket: string; confidence: number; title?: string }
): Promise<void> {
  const title = classification.title || text.substring(0, 100);

  switch (classification.bucket) {
    case 'people':
      await supabase.from('brain_people').insert({
        business_id: businessId,
        name: title,
        notes: text,
        context: 'Captured from Slack #second-brain',
      });
      break;

    case 'projects':
      await supabase.from('brain_projects').insert({
        business_id: businessId,
        title,
        next_action: text,
        status: 'active',
      });
      break;

    case 'ideas':
      await supabase.from('brain_ideas').insert({
        business_id: businessId,
        title,
        description: text,
      });
      break;

    case 'admin':
      await supabase.from('brain_admin').insert({
        business_id: businessId,
        task: text,
      });
      break;
  }
}

async function classifyFeedbackSentiment(
  supabase: any,
  text: string,
  businessId: string
): Promise<void> {
  try {
    const { parsed } = await callOpenRouterJSON({
      model: 'anthropic/claude-sonnet-4.6',
      messages: [{
        role: 'system',
        content: `You are analyzing anonymous employee feedback for a service business.
Classify the sentiment and extract actionable themes.

Return JSON:
{
  "sentiment": "positive|negative|neutral|mixed",
  "themes": ["theme1", "theme2"],
  "urgency": "low|medium|high",
  "summary": "One sentence summary of the feedback"
}`
      }, {
        role: 'user',
        content: `Analyze this anonymous employee feedback:\n\n"${text}"`
      }],
      temperature: 0.3,
      max_tokens: 200,
      caller: 'GL365 Feedback Analyzer',
    });

    // Update the most recent feedback entry for this business
    const { data: recent } = await supabase
      .from('anonymous_feedback')
      .select('id')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (recent) {
      await supabase
        .from('anonymous_feedback')
        .update({
          sentiment: parsed.sentiment,
          themes: parsed.themes,
          urgency: parsed.urgency,
          ai_summary: parsed.summary,
        })
        .eq('id', recent.id);
    }
  } catch (error) {
    console.error('[Feedback Sentiment] Error:', error);
  }
}
