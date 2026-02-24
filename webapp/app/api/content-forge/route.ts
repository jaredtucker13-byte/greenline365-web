import { NextRequest, NextResponse } from 'next/server';
import { callOpenRouter } from '@/lib/openrouter';

// Model mapping — all through OpenRouter
const MODELS = {
  'smart-thinking': 'anthropic/claude-sonnet-4.6',
  'blog-content': 'anthropic/claude-sonnet-4.6',
  'web-search': 'perplexity/llama-3.1-sonar-large-128k-online',
  'default': 'anthropic/claude-sonnet-4.6'
};

interface ContentForgeRequest {
  action: 'caption' | 'keywords' | 'description' | 'blog' | 'hashtags' | 'trends';
  contentType?: 'photo' | 'product' | 'video' | 'blog';
  businessType?: string;
  location?: string;
  productName?: string;
  imageDescription?: string;
  brandHashtag?: string;
  additionalContext?: string;
}

async function aiCall(model: string, systemPrompt: string, userPrompt: string): Promise<string> {
  const { content } = await callOpenRouter({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    max_tokens: 1000,
    temperature: 0.7,
    caller: 'GL365 ContentForge',
  });
  return content;
}

async function generateCaption(params: ContentForgeRequest): Promise<string> {
  return aiCall(MODELS['smart-thinking'],
    `You are a social media expert specializing in engaging captions for local businesses.
Write captions that are:
- Authentic and conversational
- Include a call-to-action
- Optimized for engagement
- 2-3 sentences max`,
    `Generate an engaging social media caption for a ${params.businessType || 'local business'} ${params.location ? `in ${params.location}` : ''}.
${params.contentType ? `Content type: ${params.contentType}` : ''}
${params.imageDescription ? `Image shows: ${params.imageDescription}` : ''}
${params.additionalContext ? `Additional context: ${params.additionalContext}` : ''}

Write only the caption, nothing else.`);
}

async function generateKeywords(params: ContentForgeRequest): Promise<string[]> {
  const response = await aiCall(MODELS['smart-thinking'],
    'You are an SEO and social media keyword expert. Generate relevant, high-traffic keywords for local business content.',
    `Generate 8-10 relevant keywords for:
Business type: ${params.businessType || 'local business'}
${params.location ? `Location: ${params.location}` : ''}
${params.contentType ? `Content type: ${params.contentType}` : ''}
${params.productName ? `Product/Service: ${params.productName}` : ''}

Return only the keywords as a comma-separated list, nothing else.`);
  return response.split(',').map(k => k.trim()).filter(k => k.length > 0);
}

async function generateDescription(params: ContentForgeRequest): Promise<string> {
  return aiCall(MODELS['smart-thinking'],
    `You are a professional copywriter specializing in product descriptions for small businesses.
Write descriptions that are:
- Compelling and benefit-focused
- Include key features
- Have a clear value proposition
- 3-4 sentences max`,
    `Write a product/service description for:
${params.productName ? `Product/Service: ${params.productName}` : 'a local business offering'}
Business type: ${params.businessType || 'local business'}
${params.imageDescription ? `Details: ${params.imageDescription}` : ''}
${params.additionalContext ? `Additional info: ${params.additionalContext}` : ''}

Write only the description, nothing else.`);
}

async function generateBlog(params: ContentForgeRequest): Promise<{ title: string; content: string }> {
  const response = await aiCall(MODELS['blog-content'],
    `You are a content marketing expert writing blog posts for small businesses.
Create engaging, SEO-friendly blog content that:
- Provides real value to readers
- Is authentic and relatable
- Includes practical tips
- Is optimized for local search`,
    `Write a short blog post (300-400 words) for:
Business type: ${params.businessType || 'local business'}
${params.location ? `Location: ${params.location}` : ''}
${params.additionalContext ? `Topic/Context: ${params.additionalContext}` : 'general business tips'}

Format your response as:
TITLE: [Your title here]
CONTENT: [Your blog content here]`);

  const titleMatch = response.match(/TITLE:\s*([\s\S]+?)(?:\n|CONTENT:)/);
  const contentMatch = response.match(/CONTENT:\s*([\s\S]+)/);

  return {
    title: titleMatch?.[1]?.trim() || 'Untitled Blog Post',
    content: contentMatch?.[1]?.trim() || response
  };
}

async function generateHashtags(params: ContentForgeRequest): Promise<{ standard: string[]; optional: string[] }> {
  const response = await aiCall(MODELS['blog-content'],
    `You are a social media hashtag strategist. Generate hashtags that:
- Balance reach and discoverability
- Include local hashtags when relevant
- Mix popular and niche tags
- Are currently trending when applicable`,
    `Generate hashtags for:
Business type: ${params.businessType || 'local business'}
${params.location ? `Location: ${params.location}` : ''}
${params.brandHashtag ? `Brand hashtag: ${params.brandHashtag}` : ''}
${params.contentType ? `Content type: ${params.contentType}` : ''}

Format your response as:
STANDARD: [2-3 essential hashtags that should always be used]
OPTIONAL: [3-5 additional hashtags to rotate]

Include # symbol with each hashtag.`);

  const standardMatch = response.match(/STANDARD:\s*([\s\S]+?)(?:\n|OPTIONAL:)/);
  const optionalMatch = response.match(/OPTIONAL:\s*([\s\S]+)/);

  const parseHashtags = (text: string | undefined): string[] => {
    if (!text) return [];
    return text.match(/#\w+/g) || [];
  };

  return {
    standard: parseHashtags(standardMatch?.[1]),
    optional: parseHashtags(optionalMatch?.[1])
  };
}

async function getTrends(params: ContentForgeRequest): Promise<{ trends: string[]; suggestions: string[] }> {
  const response = await aiCall(MODELS['web-search'],
    'You are a local marketing trend analyst. Find current, actionable trends and events that small businesses can use for content.',
    `Find current trends and events for:
Business type: ${params.businessType || 'local business'}
${params.location ? `Location: ${params.location}` : 'general local trends'}

Format your response as:
TRENDS: [List 3-5 current trends or events, one per line]
SUGGESTIONS: [List 2-3 content ideas based on these trends, one per line]`);

  const trendsMatch = response.match(/TRENDS:\s*([\s\S]+?)(?:\n\n|SUGGESTIONS:)/);
  const suggestionsMatch = response.match(/SUGGESTIONS:\s*([\s\S]+)/);

  const parseList = (text: string | undefined): string[] => {
    if (!text) return [];
    return text.split('\n').map(line => line.replace(/^[-•*\d.]\s*/, '').trim()).filter(line => line.length > 0);
  };

  return {
    trends: parseList(trendsMatch?.[1]),
    suggestions: parseList(suggestionsMatch?.[1])
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: ContentForgeRequest = await request.json();

    if (!body.action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }

    let result: unknown;

    switch (body.action) {
      case 'caption':
        result = { caption: await generateCaption(body) };
        break;
      case 'keywords':
        result = { keywords: await generateKeywords(body) };
        break;
      case 'description':
        result = { description: await generateDescription(body) };
        break;
      case 'blog':
        result = await generateBlog(body);
        break;
      case 'hashtags':
        result = await generateHashtags(body);
        break;
      case 'trends':
        result = await getTrends(body);
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('ContentForge API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'ContentForge API',
    actions: ['caption', 'keywords', 'description', 'blog', 'hashtags', 'trends'],
    models: {
      'smart-thinking': 'Claude Sonnet 4.6 (captions, keywords, descriptions)',
      'blog-content': 'Claude Sonnet 4.6 (blogs, hashtags)',
      'web-search': 'Perplexity (live trends)'
    }
  });
}
