import { NextRequest, NextResponse } from 'next/server';

// OpenRouter API configuration
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// Model mapping based on user's requirements
const MODELS = {
  // GPT-5.2 for smart thinking and content generation
  'smart-thinking': 'openai/gpt-4o', // Using gpt-4o as fallback since gpt-5.2 may not be available
  // Claude Sonnet 4.5 for blog content and hashtags
  'blog-content': 'anthropic/claude-3.5-sonnet',
  // Perplexity for live web search
  'web-search': 'perplexity/llama-3.1-sonar-large-128k-online',
  // Default fallback
  'default': 'openai/gpt-4o'
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

async function callOpenRouter(
  model: string,
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OpenRouter API key not configured');
  }

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://greenline365.com',
      'X-Title': 'GreenLine365 ContentForge'
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 1000,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('OpenRouter API error:', error);
    throw new Error(`OpenRouter API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || '';
}

// Generate AI caption for content
async function generateCaption(params: ContentForgeRequest): Promise<string> {
  const systemPrompt = `You are a social media expert specializing in engaging captions for local businesses. 
Write captions that are:
- Authentic and conversational
- Include a call-to-action
- Optimized for engagement
- 2-3 sentences max`;

  const userPrompt = `Generate an engaging social media caption for a ${params.businessType || 'local business'} ${params.location ? `in ${params.location}` : ''}.
${params.contentType ? `Content type: ${params.contentType}` : ''}
${params.imageDescription ? `Image shows: ${params.imageDescription}` : ''}
${params.additionalContext ? `Additional context: ${params.additionalContext}` : ''}

Write only the caption, nothing else.`;

  return callOpenRouter(MODELS['smart-thinking'], systemPrompt, userPrompt);
}

// Generate relevant keywords
async function generateKeywords(params: ContentForgeRequest): Promise<string[]> {
  const systemPrompt = `You are an SEO and social media keyword expert. Generate relevant, high-traffic keywords for local business content.`;

  const userPrompt = `Generate 8-10 relevant keywords for:
Business type: ${params.businessType || 'local business'}
${params.location ? `Location: ${params.location}` : ''}
${params.contentType ? `Content type: ${params.contentType}` : ''}
${params.productName ? `Product/Service: ${params.productName}` : ''}

Return only the keywords as a comma-separated list, nothing else.`;

  const response = await callOpenRouter(MODELS['smart-thinking'], systemPrompt, userPrompt);
  return response.split(',').map(k => k.trim()).filter(k => k.length > 0);
}

// Generate product description
async function generateDescription(params: ContentForgeRequest): Promise<string> {
  const systemPrompt = `You are a professional copywriter specializing in product descriptions for small businesses.
Write descriptions that are:
- Compelling and benefit-focused
- Include key features
- Have a clear value proposition
- 3-4 sentences max`;

  const userPrompt = `Write a product/service description for:
${params.productName ? `Product/Service: ${params.productName}` : 'a local business offering'}
Business type: ${params.businessType || 'local business'}
${params.imageDescription ? `Details: ${params.imageDescription}` : ''}
${params.additionalContext ? `Additional info: ${params.additionalContext}` : ''}

Write only the description, nothing else.`;

  return callOpenRouter(MODELS['smart-thinking'], systemPrompt, userPrompt);
}

// Generate blog content using Claude
async function generateBlog(params: ContentForgeRequest): Promise<{ title: string; content: string }> {
  const systemPrompt = `You are a content marketing expert writing blog posts for small businesses. 
Create engaging, SEO-friendly blog content that:
- Provides real value to readers
- Is authentic and relatable
- Includes practical tips
- Is optimized for local search`;

  const userPrompt = `Write a short blog post (300-400 words) for:
Business type: ${params.businessType || 'local business'}
${params.location ? `Location: ${params.location}` : ''}
${params.additionalContext ? `Topic/Context: ${params.additionalContext}` : 'general business tips'}

Format your response as:
TITLE: [Your title here]
CONTENT: [Your blog content here]`;

  const response = await callOpenRouter(MODELS['blog-content'], systemPrompt, userPrompt);
  
  // Parse the response
  const titleMatch = response.match(/TITLE:\s*(.+?)(?:\n|CONTENT:)/s);
  const contentMatch = response.match(/CONTENT:\s*(.+)/s);
  
  return {
    title: titleMatch?.[1]?.trim() || 'Untitled Blog Post',
    content: contentMatch?.[1]?.trim() || response
  };
}

// Generate smart hashtags using Claude
async function generateHashtags(params: ContentForgeRequest): Promise<{ standard: string[]; optional: string[] }> {
  const systemPrompt = `You are a social media hashtag strategist. Generate hashtags that:
- Balance reach and discoverability
- Include local hashtags when relevant
- Mix popular and niche tags
- Are currently trending when applicable`;

  const userPrompt = `Generate hashtags for:
Business type: ${params.businessType || 'local business'}
${params.location ? `Location: ${params.location}` : ''}
${params.brandHashtag ? `Brand hashtag: ${params.brandHashtag}` : ''}
${params.contentType ? `Content type: ${params.contentType}` : ''}

Format your response as:
STANDARD: [2-3 essential hashtags that should always be used]
OPTIONAL: [3-5 additional hashtags to rotate]

Include # symbol with each hashtag.`;

  const response = await callOpenRouter(MODELS['blog-content'], systemPrompt, userPrompt);
  
  // Parse the response
  const standardMatch = response.match(/STANDARD:\s*(.+?)(?:\n|OPTIONAL:)/s);
  const optionalMatch = response.match(/OPTIONAL:\s*(.+)/s);
  
  const parseHashtags = (text: string | undefined): string[] => {
    if (!text) return [];
    return text.match(/#\w+/g) || [];
  };

  return {
    standard: parseHashtags(standardMatch?.[1]),
    optional: parseHashtags(optionalMatch?.[1])
  };
}

// Get live trends using Perplexity
async function getTrends(params: ContentForgeRequest): Promise<{ trends: string[]; suggestions: string[] }> {
  const systemPrompt = `You are a local marketing trend analyst. Find current, actionable trends and events that small businesses can use for content.`;

  const userPrompt = `Find current trends and events for:
Business type: ${params.businessType || 'local business'}
${params.location ? `Location: ${params.location}` : 'general local trends'}

Format your response as:
TRENDS: [List 3-5 current trends or events, one per line]
SUGGESTIONS: [List 2-3 content ideas based on these trends, one per line]`;

  const response = await callOpenRouter(MODELS['web-search'], systemPrompt, userPrompt);
  
  // Parse the response
  const trendsMatch = response.match(/TRENDS:\s*(.+?)(?:\n\n|SUGGESTIONS:)/s);
  const suggestionsMatch = response.match(/SUGGESTIONS:\s*(.+)/s);
  
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
      'smart-thinking': 'GPT-4o (for captions, keywords, descriptions)',
      'blog-content': 'Claude Sonnet (for blogs, hashtags)',
      'web-search': 'Perplexity (for live trends)'
    }
  });
}
