import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { callOpenRouterJSON } from '@/lib/openrouter';

/**
 * Brain Capture API
 *
 * Captures thoughts from Slack (or other sources) and routes to appropriate buckets
 * Uses Claude Opus 4.6 for intelligent classification
 *
 * POST /api/brain/capture - Capture and route a thought
 * GET /api/brain/inbox - Get unprocessed thoughts
 */

interface CaptureThoughtRequest {
  businessId: string;
  text: string;
  source?: string;
  slackMessageId?: string;
  slackThreadTs?: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const body: CaptureThoughtRequest = await request.json();
    const { text, businessId, source = 'web', slackMessageId, slackThreadTs } = body;

    const slackToken = request.headers.get('x-slack-token');

    if (!slackToken) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { data: access } = await supabase
        .from('user_businesses')
        .select('role')
        .eq('user_id', user.id)
        .eq('business_id', businessId)
        .single();

      if (!access) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    if (!text || !businessId) {
      return NextResponse.json(
        { error: 'Text and business ID required' },
        { status: 400 }
      );
    }

    // Step 1: Save to inbox
    const { data: thought, error: saveError } = await supabase
      .from('brain_thoughts')
      .insert({
        business_id: businessId,
        raw_text: text,
        source,
        slack_message_id: slackMessageId,
        slack_thread_ts: slackThreadTs,
      })
      .select()
      .single();

    if (saveError) {
      console.error('[Brain Capture] Save error:', saveError);
      return NextResponse.json(
        { error: 'Failed to save thought', details: saveError.message },
        { status: 500 }
      );
    }

    // Step 2: Classify with AI
    const classification = await classifyThought(text);

    // Step 3: Route to appropriate bucket
    const routed = await routeThought(supabase, thought.id, businessId, text, classification);

    // Step 4: Mark as processed
    await supabase
      .from('brain_thoughts')
      .update({
        is_processed: true,
        classified_bucket: classification.bucket,
        confidence: classification.confidence,
        processed_at: new Date().toISOString(),
      })
      .eq('id', thought.id);

    return NextResponse.json({
      success: true,
      thought,
      classification,
      routed,
    });

  } catch (error: any) {
    console.error('[Brain Capture] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function classifyThought(text: string): Promise<{
  bucket: string;
  confidence: number;
  reasoning: string;
  title?: string;
}> {
  try {
    const { parsed } = await callOpenRouterJSON({
      model: 'anthropic/claude-opus-4.6',
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
      caller: 'GL365 Brain Capture',
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
): Promise<boolean> {
  try {
    const title = classification.title || text.substring(0, 100);

    switch (classification.bucket) {
      case 'people':
        await supabase.from('brain_people').insert({
          business_id: businessId,
          name: title,
          notes: text,
          context: 'Captured from Second Brain',
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

    return true;
  } catch (error) {
    console.error('[Route Thought] Error:', error);
    return false;
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');

    if (!businessId) {
      return NextResponse.json(
        { error: 'Business ID required' },
        { status: 400 }
      );
    }

    const { data: thoughts, error } = await supabase
      .from('brain_thoughts')
      .select('*')
      .eq('business_id', businessId)
      .eq('is_processed', false)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      thoughts: thoughts || [],
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
