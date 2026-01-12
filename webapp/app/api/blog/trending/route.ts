import { NextRequest, NextResponse } from 'next/server';

// Perplexity API for trending topic research
const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';

interface TrendingRequest {
  industry: string;
  niche?: string;
  type?: 'trending' | 'ideas' | 'news' | 'questions';
  count?: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: TrendingRequest = await request.json();
    const { industry, niche, type = 'trending', count = 5 } = body;

    if (!industry) {
      return NextResponse.json(
        { error: 'Industry is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.PERPLEXITY_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Perplexity API key not configured' },
        { status: 500 }
      );
    }

    // Build the search prompt based on type
    const prompts: Record<string, string> = {
      trending: `What are the top ${count} trending topics and conversations happening right now in the ${industry}${niche ? ` (specifically ${niche})` : ''} industry? Focus on what people are actively discussing this week. For each topic, provide:
1. The topic/trend name
2. Why it's trending (1-2 sentences)
3. A potential blog title idea
4. Relevant keywords (3-5)

Return as JSON array with format: [{"topic": "", "reason": "", "blogTitle": "", "keywords": []}]`,

      ideas: `Generate ${count} unique and engaging blog post ideas for a ${industry}${niche ? ` (${niche})` : ''} business. Focus on topics that would attract organic search traffic and provide real value. For each idea, provide:
1. Blog title (compelling, SEO-friendly)
2. Brief description (2-3 sentences)
3. Target audience
4. Estimated difficulty (easy/medium/hard)

Return as JSON array with format: [{"title": "", "description": "", "audience": "", "difficulty": ""}]`,

      news: `What are the ${count} most important recent news and developments in the ${industry}${niche ? ` (${niche})` : ''} industry from the past week? For each item, provide:
1. Headline summary
2. Why it matters for businesses
3. Source type (if known)
4. Potential content angle

Return as JSON array with format: [{"headline": "", "importance": "", "source": "", "contentAngle": ""}]`,

      questions: `What are the ${count} most frequently asked questions by people interested in ${industry}${niche ? ` (${niche})` : ''} right now? Focus on questions with high search intent. For each question, provide:
1. The question
2. Search intent type (informational/transactional/navigational)
3. Suggested answer approach
4. Related long-tail keywords

Return as JSON array with format: [{"question": "", "intent": "", "approach": "", "keywords": []}]`,
    };

    const systemPrompt = `You are a content research expert specializing in identifying trending topics, content opportunities, and market insights. You have real-time access to current information. Always return valid JSON arrays as specified. Be specific and actionable.`;

    const response = await fetch(PERPLEXITY_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online', // Online model for real-time search
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompts[type] || prompts.trending },
        ],
        temperature: 0.2,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Perplexity API] Error:', errorText);
      return NextResponse.json(
        { error: 'Failed to fetch trending topics' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    // Parse JSON from response
    let results = [];
    try {
      // Extract JSON array from response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        results = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error('[Perplexity] JSON parse error:', parseError);
      // Return raw content if parsing fails
      return NextResponse.json({
        success: true,
        type,
        industry,
        niche,
        results: [],
        rawContent: content,
        message: 'Results returned as text (parsing failed)',
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
