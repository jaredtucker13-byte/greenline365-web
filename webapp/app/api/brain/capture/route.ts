import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Brain Capture API
 * 
 * Captures thoughts from Slack (or other sources) and routes to appropriate buckets
 * Uses Gemini 3 Pro for intelligent classification
 * 
 * POST /api/brain/capture - Capture and route a thought
 * GET /api/brain/inbox - Get unprocessed thoughts
 * POST /api/brain/process - Process a specific thought
 */

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// Use Opus 4.6 for better classification
const CLASSIFIER_MODEL = 'anthropic/claude-opus-4.6';

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
    
    // Parse body ONCE at the start
    const body: CaptureThoughtRequest = await request.json();
    const { text, businessId, source = 'web', slackMessageId, slackThreadTs } = body;
    
    // Check if this is from Slack webhook (might not have auth)
    const slackToken = request.headers.get('x-slack-token');
    
    if (!slackToken) {
      // Normal authenticated request
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      // Verify access
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

// Classify thought using Gemini 3 Pro
async function classifyThought(text: string): Promise<{
  bucket: string;
  confidence: number;
  reasoning: string;
}> {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: CLASSIFIER_MODEL,
        messages: [{
          role: 'system',
          content: `You are an intelligent thought router for a business owner's "Second Brain." Classify incoming thoughts into the correct bucket.

BUCKETS:
- people: Mentions a specific person by name, relationship context, follow-up reminders, networking notes. Examples: "Follow up with Mike about the proposal", "Sarah's birthday is next week"
- projects: Active work items, business goals, tasks with deliverables, things being built. Examples: "Finish the campaign manager", "Launch the email sequence by Friday"
- ideas: Insights, concepts, future possibilities, brainstorms, strategies. Examples: "What if we offered a referral program?", "The pricing should include analytics"
- admin: Errands, todos, deadlines, bills, scheduling, operational tasks. Examples: "Pay the hosting bill", "Renew domain before March", "Schedule dentist appointment"

RULES:
- If it mentions a person's name → people
- If it has an action verb + deliverable → projects
- If it's speculative or starts with "what if" → ideas
- If it's a routine task or errand → admin
- When unsure, choose the most actionable bucket

Return ONLY valid JSON: {"bucket": "people|projects|ideas|admin", "confidence": 0.0-1.0, "title": "short 5-8 word title", "reasoning": "brief explanation"}`
        }, {
          role: 'user',
          content: `Classify this thought:\n\n"${text}"`
        }],
        temperature: 0.2,
        max_tokens: 200,
      }),
    });

    const result = await response.json();
    const responseText = result.choices?.[0]?.message?.content || '';
    
    const jsonMatch = responseText.match(/\{[\s\S]*?\}/);
    if (!jsonMatch) {
      return { bucket: 'ideas', confidence: 0.5, reasoning: 'Default classification' };
    }

    return JSON.parse(jsonMatch[0]);

  } catch (error) {
    console.error('[Classify Thought] Error:', error);
    return { bucket: 'ideas', confidence: 0.5, reasoning: 'Classification failed' };
  }
}

// Route thought to appropriate bucket
async function routeThought(
  supabase: any,
  thoughtId: string,
  businessId: string,
  text: string,
  classification: { bucket: string; confidence: number }
): Promise<boolean> {
  try {
    switch (classification.bucket) {
      case 'people':
        // Extract person details and save
        await supabase.from('brain_people').insert({
          business_id: businessId,
          name: 'Extracted from thought', // Would need better extraction
          notes: text,
        });
        break;
        
      case 'projects':
        await supabase.from('brain_projects').insert({
          business_id: businessId,
          title: text.substring(0, 100),
          next_action: text,
          status: 'active',
        });
        break;
        
      case 'ideas':
        await supabase.from('brain_ideas').insert({
          business_id: businessId,
          title: text.substring(0, 100),
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

// Get unprocessed thoughts
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
