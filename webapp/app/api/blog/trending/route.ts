import { NextRequest, NextResponse } from 'next/server';
import { callOpenRouter } from '@/lib/openrouter';

interface TrendingRequest {
  industry?: string; // Now optional
  niche?: string;
  type?: 'trending' | 'ideas' | 'news' | 'questions';
  count?: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: TrendingRequest = await request.json();
    const { industry, niche, type = 'trending', count = 5 } = body;

    // Industry is now OPTIONAL - default to general trending topics
    const industryContext = industry 
      ? `in the ${industry}${niche ? ` (specifically ${niche})` : ''} industry`
      : 'across all industries';

    // Build the search prompt based on type
    const prompts: Record<string, string> = {
      trending: `What are the top ${count} trending topics and conversations happening RIGHT NOW ${industryContext}? Focus on what people are actively discussing THIS WEEK in 2025. For each topic, provide:
1. The topic/trend name
2. Why it's trending (1-2 sentences)
3. A potential blog title idea
4. Relevant keywords (3-5)

Return ONLY a valid JSON array with this exact format, no other text:
[{"topic": "Topic Name", "reason": "Why trending", "blogTitle": "Blog Title Idea", "keywords": ["keyword1", "keyword2"]}]`,

      ideas: `Generate ${count} unique and engaging blog post ideas ${industry ? `for a ${industry}${niche ? ` (${niche})` : ''} business` : 'that would work for any business'} in 2025. Focus on topics that would attract organic search traffic and provide real value. For each idea:
1. Blog title (compelling, SEO-friendly)
2. Brief description (2-3 sentences)
3. Target audience
4. Estimated difficulty (easy/medium/hard)

Return ONLY a valid JSON array with this exact format, no other text:
[{"title": "Blog Title", "description": "Description", "audience": "Target Audience", "difficulty": "easy"}]`,

      news: `What are the ${count} most important recent news and developments ${industryContext} from the PAST WEEK? For each item:
1. Headline summary
2. Why it matters for businesses
3. Source type (if known)
4. Potential content angle

Return ONLY a valid JSON array with this exact format, no other text:
[{"headline": "News Headline", "importance": "Why it matters", "source": "Source", "contentAngle": "Content angle"}]`,

      questions: `What are the ${count} most frequently asked questions by people ${industry ? `interested in ${industry}${niche ? ` (${niche})` : ''}` : 'searching online'} right now? Focus on questions with high search intent:
1. The question
2. Search intent type (informational/transactional/navigational)
3. Suggested answer approach
4. Related long-tail keywords

Return ONLY a valid JSON array with this exact format, no other text:
[{"question": "Question?", "intent": "informational", "approach": "How to answer", "keywords": ["keyword1", "keyword2"]}]`,
    };

    const systemPrompt = `You are a content research expert with access to current internet information. Your job is to identify trending topics, content opportunities, and market insights. IMPORTANT: Return ONLY valid JSON arrays as specified - no markdown, no code blocks, no explanations. Just the raw JSON array.`;

    const { content } = await callOpenRouter({
      model: 'perplexity/sonar', // Perplexity Sonar with online search via OpenRouter
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompts[type] || prompts.trending },
      ],
      temperature: 0.3,
      max_tokens: 2000,
      caller: 'blog-trending',
    });

    // Parse JSON from response
    let results = [];
    try {
      // Clean and extract JSON array from response
      let cleanedContent = content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      const jsonMatch = cleanedContent.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        results = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error('[Trending] JSON parse error:', parseError);
      console.log('[Trending] Raw content:', content.slice(0, 500));
      // Return raw content if parsing fails
      return NextResponse.json({
        success: true,
        type,
        industry,
        niche,
        results: [],
        rawContent: content,
        message: 'Results returned as text (JSON parsing failed)',
      });
    }

    return NextResponse.json({
      success: true,
      type,
      industry,
      niche,
      results,
      count: results.length,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('[Trending API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
