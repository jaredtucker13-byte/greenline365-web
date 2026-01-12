import { NextRequest, NextResponse } from 'next/server';

/**
 * Blog AI Enhancement API
 * Uses OpenRouter with model selection for different tasks:
 * - Claude for creative content enhancement
 * - GPT-4o for outlines and structure
 * - Fast models for quick suggestions
 */

type AIAction = 
  | 'generate_outline'
  | 'enhance_content'
  | 'enhance_content_with_title'
  | 'generate_meta'
  | 'suggest_headlines'
  | 'suggest_tags'
  | 'improve_seo'
  | 'custom_generate';

interface AIRequest {
  action: AIAction;
  title?: string;
  content?: string;
  category?: string;
  keywords?: string[];
  customPrompt?: string;
}

// Model selection based on task
const getModel = (action: AIAction): string => {
  switch (action) {
    case 'enhance_content':
    case 'enhance_content_with_title':
    case 'custom_generate':
      // Claude excels at creative writing enhancement
      return 'anthropic/claude-3.5-sonnet';
    case 'generate_outline':
    case 'suggest_headlines':
      // GPT-4o for structured outputs
      return 'openai/gpt-4o';
    case 'generate_meta':
    case 'suggest_tags':
    case 'improve_seo':
      // Fast model for quick tasks
      return 'openai/gpt-4o-mini';
    default:
      return 'openai/gpt-4o-mini';
  }
};

// System prompts for each action
const getSystemPrompt = (action: AIAction): string => {
  switch (action) {
    case 'generate_outline':
      return `You are a professional content strategist. Generate a detailed blog post outline with:
- An engaging introduction hook
- 4-6 main sections with subpoints
- A compelling conclusion with CTA
Format as markdown with ## for sections and bullet points for subpoints.`;

    case 'enhance_content':
      return `You are an expert editor and content enhancer. Improve the given blog content by:
- Making it more engaging and readable
- Adding vivid examples and analogies
- Improving flow and transitions
- Keeping the original voice and message
- Optimizing for web readability (short paragraphs, subheadings)
Return the enhanced content in markdown format.`;

    case 'enhance_content_with_title':
      return `You are an expert editor and content enhancer. Your task is to:
1. Improve the blog content to be more engaging, readable, and polished
2. Generate a compelling NEW title that matches the enhanced content

Enhancement guidelines:
- Make content more engaging and readable
- Add vivid examples and analogies where appropriate
- Improve flow and transitions
- Keep the original voice and message
- Optimize for web readability (short paragraphs, subheadings)

You MUST return a JSON object with this exact structure:
{
  "title": "Your new suggested title here",
  "content": "The enhanced blog content in markdown format here..."
}

Make sure the title is SEO-friendly (50-60 characters) and accurately reflects the enhanced content.`;

    case 'generate_meta':
      return `You are an SEO specialist. Generate:
1. A compelling meta description (150-160 characters) that includes the main keyword and a call to action
2. 5-7 relevant meta keywords
Return as JSON: {"description": "...", "keywords": ["...", "..."]}`;

    case 'suggest_headlines':
      return `You are a headline specialist. Generate 5 alternative headline options that are:
- Attention-grabbing and click-worthy
- SEO-optimized (50-60 characters ideal)
- Clear about the value to readers
Return as JSON array: ["headline1", "headline2", ...]`;

    case 'suggest_tags':
      return `You are a content categorization expert. Suggest 5-8 relevant tags that:
- Are specific and searchable
- Mix broad and niche terms
- Would help readers find this content
Return as JSON array: ["tag1", "tag2", ...]`;

    case 'improve_seo':
      return `You are an SEO content optimizer. Analyze and suggest improvements:
1. Keyword optimization opportunities
2. Heading structure improvements
3. Internal linking suggestions
4. Readability enhancements
5. Meta description recommendation
Return as JSON: {"suggestions": [...], "priority": "high/medium/low", "estimatedImpact": "..."}`;

    default:
      return 'You are a helpful content assistant.';
  }
};

export async function POST(request: NextRequest) {
  try {
    const body: AIRequest = await request.json();
    const { action, title, content, category, keywords, customPrompt } = body;

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      );
    }

    const model = getModel(action);
    let systemPrompt = getSystemPrompt(action);

    // Build user message based on action
    let userMessage = '';
    switch (action) {
      case 'custom_generate':
        if (!customPrompt) {
          return NextResponse.json({ error: 'Custom prompt is required' }, { status: 400 });
        }
        systemPrompt = `You are a professional blog content writer. Create engaging, well-structured content based on the user's prompt. 
Write in a professional yet approachable tone. Use markdown formatting with proper headings, bullet points, and paragraphs.
Focus on providing valuable, actionable information that readers can use.
${category ? `The content is for the ${category} category.` : ''}
${title ? `The blog title context is: "${title}"` : ''}`;
        userMessage = customPrompt;
        if (content) {
          userMessage += `\n\nExisting content context:\n${content.substring(0, 500)}...`;
        }
        break;

      case 'generate_outline':
        if (!title) {
          return NextResponse.json({ error: 'Title is required for outline generation' }, { status: 400 });
        }
        userMessage = `Create a detailed blog outline for: "${title}"${category ? `\nCategory: ${category}` : ''}${keywords?.length ? `\nTarget keywords: ${keywords.join(', ')}` : ''}`;
        break;

      case 'enhance_content':
        if (!content) {
          return NextResponse.json({ error: 'Content is required for enhancement' }, { status: 400 });
        }
        userMessage = `Enhance this blog post:\n\nTitle: ${title || 'Untitled'}\n\nContent:\n${content}`;
        break;

      case 'enhance_content_with_title':
        if (!content) {
          return NextResponse.json({ error: 'Content is required for enhancement' }, { status: 400 });
        }
        userMessage = `Enhance this blog post and suggest a matching title:\n\nCurrent Title: ${title || 'Untitled'}\n${category ? `Category: ${category}\n` : ''}\nContent:\n${content}\n\nRemember to return a JSON object with "title" and "content" keys.`;
        break;

      case 'generate_meta':
        if (!title || !content) {
          return NextResponse.json({ error: 'Title and content are required for meta generation' }, { status: 400 });
        }
        userMessage = `Generate SEO meta for:\n\nTitle: ${title}\n\nContent excerpt: ${content.substring(0, 500)}...`;
        break;

      case 'suggest_headlines':
        if (!title) {
          return NextResponse.json({ error: 'Title is required for headline suggestions' }, { status: 400 });
        }
        userMessage = `Suggest alternative headlines for: "${title}"${content ? `\n\nContent preview: ${content.substring(0, 300)}...` : ''}`;
        break;

      case 'suggest_tags':
        if (!title && !content) {
          return NextResponse.json({ error: 'Title or content is required for tag suggestions' }, { status: 400 });
        }
        userMessage = `Suggest tags for:\n\nTitle: ${title || 'Untitled'}\n\nContent: ${content?.substring(0, 500) || 'No content yet'}`;
        break;

      case 'improve_seo':
        if (!title || !content) {
          return NextResponse.json({ error: 'Title and content are required for SEO analysis' }, { status: 400 });
        }
        userMessage = `Analyze and suggest SEO improvements for:\n\nTitle: ${title}\n\nContent:\n${content}`;
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    console.log(`[Blog AI] Action: ${action}, Model: ${model}`);

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://greenline365.com',
        'X-Title': 'GreenLine365 Blog AI',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        stream: false,
        temperature: action === 'enhance_content' || action === 'enhance_content_with_title' ? 0.7 : 0.5,
        max_tokens: action === 'enhance_content' || action === 'enhance_content_with_title' ? 2500 : 1000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[Blog AI] OpenRouter error:', error);
      return NextResponse.json(
        { error: 'AI service error' },
        { status: 500 }
      );
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || '';

    // Parse JSON responses for certain actions
    let result: any = { raw: aiResponse };

    if (['generate_meta', 'suggest_headlines', 'suggest_tags', 'improve_seo', 'enhance_content_with_title'].includes(action)) {
      try {
        // Extract JSON from response (may be wrapped in markdown code blocks)
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
        if (jsonMatch) {
          result.parsed = JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        // Keep raw response if JSON parsing fails
        console.log('[Blog AI] Could not parse JSON response');
      }
    }

    return NextResponse.json({
      action,
      model,
      result: result.parsed || aiResponse,
      raw: aiResponse,
    });

  } catch (error: any) {
    console.error('[Blog AI] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
