import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSkillContextForIntent, getSkillContext, getCoreMarketingContext } from '@/lib/marketing-skills-loader';
import { CHAT_FORMAT_DIRECTIVE } from '@/lib/format-standards';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// =====================================================
// TEMPORAL CONTENT GENERATION ENGINE
// From 15 years in the future
// =====================================================

interface BlueprintSection {
  id: string;
  name: string;
  purpose: string;
  word_count: number;
  required: boolean;
}

interface ContentBlueprint {
  id: string;
  blueprint_code: string;
  blueprint_name: string;
  blueprint_icon: string;
  category: string;
  difficulty_level: string;
  estimated_time_minutes: number;
  emotional_arc: string;
  persuasion_triggers: string[];
  structure: { sections: BlueprintSection[] };
  ai_prompts: Record<string, string>;
  ideal_word_count_min: number;
  ideal_word_count_max: number;
  recommended_headers: number;
  recommended_images: number;
  outputs_to: string[];
}

// AI Generation using OpenRouter
async function generateWithAI(prompt: string, maxTokens: number = 1000): Promise<string> {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OpenRouter API key not configured');
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://greenline365.com',
      'X-Title': 'GreenLine365 Content Forge'
    },
    body: JSON.stringify({
      model: 'anthropic/claude-opus-4.6',
      messages: [
        {
          role: 'system',
          content: `You are a world-class content strategist from 15 years in the future. You write content that converts readers into customers. Your writing is clear, punchy, and valuable. You avoid fluff, jargon, and generic advice. Every sentence earns its place.${CHAT_FORMAT_DIRECTIVE}${getSkillContextForIntent(prompt)}${getCoreMarketingContext()}`
        },
        { role: 'user', content: prompt }
      ],
      max_tokens: maxTokens,
      temperature: 0.7
    })
  });

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

// Score content quality
function scoreContent(content: string, blueprint: ContentBlueprint): Record<string, number> {
  const wordCount = content.split(/\s+/).length;
  const sentences = content.split(/[.!?]+/).filter(s => s.trim());
  const avgSentenceLength = wordCount / sentences.length;
  const headers = (content.match(/^#{1,3}\s/gm) || []).length;
  const bullets = (content.match(/^[-*]\s/gm) || []).length;
  const hasHook = content.substring(0, 200).includes('?') || content.substring(0, 200).includes('!');
  const hasCTA = content.toLowerCase().includes('book') || content.toLowerCase().includes('call') || 
                 content.toLowerCase().includes('sign up') || content.toLowerCase().includes('get started') ||
                 content.toLowerCase().includes('click') || content.toLowerCase().includes('download');

  // Calculate scores (0-100)
  const hookScore = hasHook ? 85 : 50;
  const structureScore = Math.min(100, (headers * 10) + (bullets * 2) + (avgSentenceLength < 20 ? 30 : 10));
  const lengthScore = wordCount >= blueprint.ideal_word_count_min && wordCount <= blueprint.ideal_word_count_max 
    ? 90 : Math.max(40, 90 - Math.abs(wordCount - blueprint.ideal_word_count_min) / 10);
  const ctaScore = hasCTA ? 85 : 40;
  const readabilityScore = avgSentenceLength < 25 ? 85 : avgSentenceLength < 35 ? 70 : 50;

  const overall = Math.round((hookScore + structureScore + lengthScore + ctaScore + readabilityScore) / 5);

  return {
    overall,
    hook_score: hookScore,
    structure_score: structureScore,
    length_score: lengthScore,
    cta_score: ctaScore,
    readability_score: readabilityScore,
    word_count: wordCount,
    header_count: headers
  };
}

// Generate engagement prediction
function predictEngagement(scores: Record<string, number>, blueprint: ContentBlueprint): Record<string, any> {
  const baseEngagement = scores.overall / 100;
  const categoryBoost = blueprint.category === 'viral' ? 1.2 : blueprint.category === 'conversion' ? 1.1 : 1.0;
  
  return {
    predicted_engagement_score: Math.round(baseEngagement * categoryBoost * 100) / 100,
    predicted_shares: Math.round(baseEngagement * 50 * categoryBoost),
    predicted_time_on_page_seconds: Math.round(scores.word_count / 4 * baseEngagement),
    confidence_level: Math.min(0.85, 0.5 + (scores.overall / 200)),
    optimization_suggestions: [
      scores.hook_score < 70 ? 'Strengthen your opening hook with a question or bold statement' : null,
      scores.structure_score < 70 ? 'Add more headers and bullet points for scannability' : null,
      scores.cta_score < 70 ? 'Add a clearer call-to-action at the end' : null,
      scores.readability_score < 70 ? 'Shorten your sentences for better readability' : null
    ].filter(Boolean)
  };
}

// Repurpose content to other formats
async function repurposeContent(content: string, title: string, targetFormat: string): Promise<string> {
  const prompts: Record<string, string> = {
    twitter_thread: `Convert this blog post into a Twitter/X thread. Rules:
- Start with a hook tweet that makes people stop scrolling
- Use 8-12 tweets maximum
- Each tweet should be valuable standalone
- End with a call to action
- Use line breaks for readability
- No hashtags

Blog post:
${content}`,
    
    linkedin: `Convert this blog post into a LinkedIn post. Rules:
- Start with a hook line (pattern interrupt)
- Use short paragraphs (1-2 sentences each)
- Include line breaks for mobile readability
- End with a question to drive engagement
- Keep under 1300 characters
- Professional but human tone

Blog post:
${content}`,

    instagram_caption: `Convert this blog post into an Instagram caption. Rules:
- Start with a hook
- Break into short, punchy paragraphs
- Use emojis sparingly but strategically
- End with a CTA and relevant hashtags (5-10)
- Keep it conversational and relatable

Blog post:
${content}`,

    email: `Convert this blog post into an email newsletter. Rules:
- Subject line that gets opens (curiosity or benefit)
- Personal greeting
- Get to the value fast
- Use "you" language
- Clear single CTA
- P.S. line with bonus tip or urgency

Blog post:
${content}`,

    video_script: `Convert this blog post into a video script (2-3 minutes). Rules:
- Hook in first 5 seconds
- Conversational tone (like talking to a friend)
- Clear sections with transitions
- End with CTA and subscribe prompt
- Include [B-ROLL] and [GRAPHIC] suggestions

Blog post:
${content}`
  };

  return generateWithAI(prompts[targetFormat] || prompts.twitter_thread, 1500);
}

// Generate headline variants
async function generateHeadlineVariants(title: string, topic: string, blueprint: ContentBlueprint): Promise<any[]> {
  const prompt = `Generate 5 alternative headlines for this blog post. The current title is: "${title}"
Topic: ${topic}
Format: ${blueprint.blueprint_name}
Category: ${blueprint.category}

For each headline, provide:
1. The headline
2. Predicted CTR score (1-10)
3. Why it works

Make each headline use a different approach:
- Curiosity gap
- Specific number/result
- How-to
- Contrarian/pattern interrupt
- Emotional trigger

Return as JSON array: [{"headline": "...", "ctr_score": 8, "approach": "...", "why": "..."}]`;

  const result = await generateWithAI(prompt, 800);
  try {
    // Extract JSON from response
    const jsonMatch = result.match(/\[[\s\S]*\]/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : [];
  } catch {
    return [];
  }
}

// =====================================================
// API ROUTES
// =====================================================

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  switch (action) {
    case 'blueprints': {
      const { data: blueprints } = await supabase
        .from('content_blueprints')
        .select('*')
        .order('blueprint_code');
      
      return NextResponse.json({
        success: true,
        blueprints: blueprints?.map(b => ({
          ...b,
          structure: b.structure,
          ai_prompts: b.ai_prompts
        }))
      });
    }

    case 'pillars': {
      const tenantId = searchParams.get('tenant_id');
      const { data: pillars } = await supabase
        .from('content_pillars')
        .select('*')
        .eq('tenant_id', tenantId);
      
      return NextResponse.json({ success: true, pillars });
    }

    case 'calendar': {
      const tenantId = searchParams.get('tenant_id');
      const startDate = searchParams.get('start_date');
      const endDate = searchParams.get('end_date');
      
      let query = supabase
        .from('content_calendar')
        .select('*, pillar:pillar_id(*), blueprint:blueprint_id(*)')
        .eq('tenant_id', tenantId);
      
      if (startDate) query = query.gte('scheduled_date', startDate);
      if (endDate) query = query.lte('scheduled_date', endDate);
      
      const { data: calendar } = await query.order('scheduled_date');
      
      return NextResponse.json({ success: true, calendar });
    }

    default:
      return NextResponse.json({
        name: 'Content Forge 2.0 - Temporal Content Architecture',
        version: '2.0.0',
        description: 'From 15 years in the future. Content that predicts its own success.',
        endpoints: {
          'GET ?action=blueprints': 'Get all content blueprints',
          'GET ?action=pillars&tenant_id=X': 'Get tenant content pillars',
          'GET ?action=calendar&tenant_id=X': 'Get content calendar',
          'POST action=generate': 'Generate content from blueprint',
          'POST action=score': 'Score content quality',
          'POST action=repurpose': 'Convert to other formats',
          'POST action=headlines': 'Generate headline variants',
          'POST action=calendar_generate': 'Generate 4-week calendar'
        }
      });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      // Generate content from blueprint
      case 'generate': {
        const { blueprint_code, topic, target_audience, pillar_context, tone } = body;
        
        // Get blueprint
        const { data: blueprint } = await supabase
          .from('content_blueprints')
          .select('*')
          .eq('blueprint_code', blueprint_code)
          .single();
        
        if (!blueprint) {
          return NextResponse.json({ success: false, error: 'Blueprint not found' }, { status: 404 });
        }

        // Generate each section
        const sections: Record<string, string> = {};
        const structure = blueprint.structure as { sections: BlueprintSection[] };
        
        for (const section of structure.sections) {
          const sectionPrompt = blueprint.ai_prompts[section.id];
          const fullPrompt = `${sectionPrompt}

Topic: ${topic}
Target Audience: ${target_audience || 'Local business owners'}
Tone: ${tone || blueprint.emotional_arc}
${pillar_context ? `Context: ${pillar_context}` : ''}

Write approximately ${section.word_count} words. Be specific, actionable, and engaging.`;

          sections[section.id] = await generateWithAI(fullPrompt, Math.ceil(section.word_count * 1.5));
        }

        // Combine into full content
        const fullContent = structure.sections
          .map(s => `## ${s.name}\n\n${sections[s.id]}`)
          .join('\n\n');

        // Score it
        const scores = scoreContent(fullContent, blueprint);
        const predictions = predictEngagement(scores, blueprint);

        // Generate headline variants
        const headlines = await generateHeadlineVariants(topic, topic, blueprint);

        return NextResponse.json({
          success: true,
          content: {
            sections,
            full_content: fullContent,
            blueprint_used: blueprint.blueprint_name
          },
          scores,
          predictions,
          headline_variants: headlines
        });
      }

      // Score existing content
      case 'score': {
        const { content, blueprint_code } = body;
        
        const { data: blueprint } = await supabase
          .from('content_blueprints')
          .select('*')
          .eq('blueprint_code', blueprint_code)
          .single();
        
        if (!blueprint) {
          return NextResponse.json({ success: false, error: 'Blueprint not found' }, { status: 404 });
        }

        const scores = scoreContent(content, blueprint);
        const predictions = predictEngagement(scores, blueprint);

        return NextResponse.json({
          success: true,
          scores,
          predictions
        });
      }

      // Repurpose content
      case 'repurpose': {
        const { content, title, format } = body;
        
        const repurposed = await repurposeContent(content, title, format);
        
        return NextResponse.json({
          success: true,
          format,
          content: repurposed
        });
      }

      // Generate headline variants
      case 'headlines': {
        const { title, topic, blueprint_code } = body;
        
        const { data: blueprint } = await supabase
          .from('content_blueprints')
          .select('*')
          .eq('blueprint_code', blueprint_code)
          .single();
        
        const headlines = await generateHeadlineVariants(title, topic, blueprint);
        
        return NextResponse.json({
          success: true,
          headlines
        });
      }

      // Generate 4-week content calendar
      case 'calendar_generate': {
        const { tenant_id, pillars, weeks = 4 } = body;
        
        // Get all blueprints
        const { data: blueprints } = await supabase
          .from('content_blueprints')
          .select('*');
        
        const calendarItems = [];
        const startDate = new Date();
        
        for (let week = 0; week < weeks; week++) {
          const pillar = pillars[week % pillars.length];
          const blueprint = blueprints![week % blueprints!.length];
          
          const postDate = new Date(startDate);
          postDate.setDate(postDate.getDate() + (week * 7));
          
          // Generate title idea
          const titlePrompt = `Generate a compelling blog post title for:
Pillar: ${pillar.pillar_name}
Format: ${blueprint.blueprint_name}
Target: ${pillar.target_audience || 'Local business owners'}
Keywords: ${pillar.primary_keywords?.join(', ') || 'local business, marketing'}

Return just the title, nothing else.`;

          const title = await generateWithAI(titlePrompt, 50);
          
          calendarItems.push({
            scheduled_date: postDate.toISOString().split('T')[0],
            pillar_id: pillar.id,
            blueprint_id: blueprint.id,
            working_title: title.trim(),
            pillar_name: pillar.pillar_name,
            blueprint_name: blueprint.blueprint_name,
            blueprint_icon: blueprint.blueprint_icon,
            content_type: week % 3 === 0 ? 'evergreen' : 'timely'
          });
        }
        
        return NextResponse.json({
          success: true,
          calendar: calendarItems,
          weeks_generated: weeks
        });
      }

      default:
        return NextResponse.json({ 
          success: false, 
          error: 'Unknown action' 
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Content Forge Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
