import { NextRequest, NextResponse } from 'next/server';
import { getSkillContext, getCoreMarketingContext } from '@/lib/marketing-skills-loader';
import { CHAT_FORMAT_DIRECTIVE } from '@/lib/format-standards';
import { callOpenRouter, callOpenRouterJSON } from '@/lib/openrouter';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { captureException } from '@/lib/error-tracking';

/**
 * Blog AI Enhancement API
 * Uses Claude Sonnet 4.6 via OpenRouter for all blog tasks
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

const MODEL = 'anthropic/claude-sonnet-4.6';

// System prompts for each action
const getSystemPrompt = (action: AIAction): string => {
  const contentSkill = getSkillContext('content-strategy');
  const copySkill = getSkillContext('copywriting');

  switch (action) {
    case 'generate_outline':
      return `You are a professional content strategist. Generate a detailed blog post outline with:
- An engaging introduction hook
- 4-6 main sections with subpoints
- A compelling conclusion with CTA
Format as markdown with ## for sections and bullet points for subpoints.${CHAT_FORMAT_DIRECTIVE}${contentSkill}`;

    case 'enhance_content':
      return `You are an expert editor and content enhancer. Improve the given blog content by:
- Making it more engaging and readable
- Adding vivid examples and analogies
- Improving flow and transitions
- Keeping the original voice and message
- Optimizing for web readability (short paragraphs, subheadings)
Return the enhanced content in markdown format.${copySkill}`;

    case 'enhance_content_with_title':
      return `You are an expert editor and content enhancer. Your task is to:
1. Improve the blog content to be more engaging, readable, and polished
2. Generate a compelling NEW title that matches the enhanced content

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
  const rl = rateLimit(request, { max: 10, windowMs: 60_000 });
  if (!rl.allowed) return rateLimitResponse(rl.retryAfter);

  try {
    const body: AIRequest = await request.json();
    const { action, title, content, category, keywords, customPrompt } = body;

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }

    let systemPrompt = getSystemPrompt(action);
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
        if (!title) return NextResponse.json({ error: 'Title is required for outline generation' }, { status: 400 });
        userMessage = `Create a detailed blog outline for: "${title}"${category ? `\nCategory: ${category}` : ''}${keywords?.length ? `\nTarget keywords: ${keywords.join(', ')}` : ''}`;
        break;

      case 'enhance_content':
        if (!content) return NextResponse.json({ error: 'Content is required for enhancement' }, { status: 400 });
        userMessage = `Enhance this blog post:\n\nTitle: ${title || 'Untitled'}\n\nContent:\n${content}`;
        break;

      case 'enhance_content_with_title':
        if (!content) return NextResponse.json({ error: 'Content is required for enhancement' }, { status: 400 });
        userMessage = `Enhance this blog post and suggest a matching title:\n\nCurrent Title: ${title || 'Untitled'}\n${category ? `Category: ${category}\n` : ''}\nContent:\n${content}\n\nRemember to return a JSON object with "title" and "content" keys.`;
        break;

      case 'generate_meta':
        if (!title || !content) return NextResponse.json({ error: 'Title and content are required for meta generation' }, { status: 400 });
        userMessage = `Generate SEO meta for:\n\nTitle: ${title}\n\nContent excerpt: ${content.substring(0, 500)}...`;
        break;

      case 'suggest_headlines':
        if (!title) return NextResponse.json({ error: 'Title is required for headline suggestions' }, { status: 400 });
        userMessage = `Suggest alternative headlines for: "${title}"${content ? `\n\nContent preview: ${content.substring(0, 300)}...` : ''}`;
        break;

      case 'suggest_tags':
        if (!title && !content) return NextResponse.json({ error: 'Title or content is required for tag suggestions' }, { status: 400 });
        userMessage = `Suggest tags for:\n\nTitle: ${title || 'Untitled'}\n\nContent: ${content?.substring(0, 500) || 'No content yet'}`;
        break;

      case 'improve_seo':
        if (!title || !content) return NextResponse.json({ error: 'Title and content are required for SEO analysis' }, { status: 400 });
        userMessage = `Analyze and suggest SEO improvements for:\n\nTitle: ${title}\n\nContent:\n${content}`;
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const isJsonAction = ['generate_meta', 'suggest_headlines', 'suggest_tags', 'improve_seo', 'enhance_content_with_title'].includes(action);

    let result: any;
    let raw: string;

    if (isJsonAction) {
      try {
        const { parsed, content: rawContent } = await callOpenRouterJSON({
          model: MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
          ],
          temperature: 0.5,
          max_tokens: action === 'enhance_content_with_title' ? 2500 : 1000,
          caller: `GL365 Blog AI (${action})`,
        });
        result = parsed;
        raw = rawContent;
      } catch {
        // Fallback to non-JSON mode if JSON parsing fails
        const { content: rawContent } = await callOpenRouter({
          model: MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
          ],
          temperature: 0.5,
          max_tokens: action === 'enhance_content_with_title' ? 2500 : 1000,
          caller: `GL365 Blog AI (${action})`,
        });
        result = rawContent;
        raw = rawContent;
      }
    } else {
      const { content: rawContent } = await callOpenRouter({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature: action === 'enhance_content' ? 0.7 : 0.5,
        max_tokens: action === 'enhance_content' ? 2500 : 1000,
        caller: `GL365 Blog AI (${action})`,
      });
      result = rawContent;
      raw = rawContent;
    }

    return NextResponse.json({
      action,
      model: MODEL,
      result,
      raw,
    });

  } catch (error: unknown) {
    captureException(error, { source: 'api/blog/ai', extra: { method: 'POST' } });
    console.error('[Blog AI] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
