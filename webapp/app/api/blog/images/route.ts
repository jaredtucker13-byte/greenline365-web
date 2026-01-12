import { NextRequest, NextResponse } from 'next/server';

/**
 * Blog Image Suggestion & Generation API
 * 
 * Actions:
 * - analyze: Analyze content and suggest image placements
 * - generate: Generate images using Nano Banana
 */

interface ImageSuggestion {
  id: string;
  placement: 'header' | 'inline' | 'section-break';
  context: string;
  prompt: string;
  position: number; // Character position in content
  sectionTitle?: string;
}

interface AnalyzeRequest {
  action: 'analyze';
  title: string;
  content: string;
}

interface GenerateRequest {
  action: 'generate';
  prompt: string;
  style?: 'professional' | 'illustration' | 'minimalist' | 'creative';
  count?: number; // How many variations (1-5)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'analyze') {
      return analyzeContent(body as AnalyzeRequest);
    } else if (action === 'generate') {
      return generateImages(body as GenerateRequest);
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('[Blog Images] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

async function analyzeContent(body: AnalyzeRequest) {
  const { title, content } = body;

  if (!title || !content) {
    return NextResponse.json(
      { error: 'Title and content are required' },
      { status: 400 }
    );
  }

  // Use OpenRouter to analyze content and suggest image placements
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://greenline365.com',
      'X-Title': 'GreenLine365 Blog Images',
    },
    body: JSON.stringify({
      model: 'openai/gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an expert visual content strategist. Analyze blog content and suggest optimal image placements.

For each suggestion, provide:
1. Type: header (hero image), inline (within content), or section-break (between sections)
2. Context: What the image should convey
3. Prompt: A detailed prompt for AI image generation (be specific about style, composition, colors)
4. Position: Approximate character position in the content

Consider:
- Data/statistics need charts or infographics
- Stories/examples need relevant illustrations
- Technical concepts need diagrams or visual explanations
- Emotional content needs evocative imagery

Return JSON array of suggestions (max 5):
[
  {
    "id": "unique-id",
    "placement": "header|inline|section-break",
    "context": "What this image represents",
    "prompt": "Detailed image generation prompt",
    "position": 0,
    "sectionTitle": "optional section name"
  }
]`
        },
        {
          role: 'user',
          content: `Analyze this blog post and suggest up to 5 optimal image placements:

Title: ${title}

Content:
${content}`
        }
      ],
      temperature: 0.5,
      max_tokens: 1500,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('[Blog Images] OpenRouter error:', error);
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
  }

  const data = await response.json();
  const aiResponse = data.choices?.[0]?.message?.content || '[]';

  // Parse JSON response
  try {
    const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const suggestions = JSON.parse(jsonMatch[0]);
      return NextResponse.json({ suggestions });
    }
  } catch (e) {
    console.error('[Blog Images] JSON parse error:', e);
  }

  return NextResponse.json({ suggestions: [], raw: aiResponse });
}

async function generateImages(body: GenerateRequest) {
  const { prompt, style = 'professional', count = 3 } = body;

  if (!prompt) {
    return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
  }

  // Build style-enhanced prompt
  const styleGuides: Record<string, string> = {
    professional: 'Professional, clean, corporate style. High quality, modern design aesthetic. Suitable for business blog.',
    illustration: 'Digital illustration style, vibrant colors, artistic interpretation. Stylized and visually engaging.',
    minimalist: 'Minimalist design, clean lines, limited color palette. Simple and elegant composition.',
    creative: 'Creative and unique, abstract elements allowed. Artistic and eye-catching.',
  };

  const enhancedPrompt = `${prompt}. Style: ${styleGuides[style]}. High resolution, suitable for web blog post.`;

  // Call Python backend for Nano Banana generation
  // For now, we'll use a simulated response until Python service is set up
  // In production, this would call our Python service
  
  try {
    // Try to call the Python image generation service
    const pythonResponse = await fetch('http://localhost:8001/api/generate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: enhancedPrompt,
        count: Math.min(count, 5),
      }),
    });

    if (pythonResponse.ok) {
      const result = await pythonResponse.json();
      return NextResponse.json(result);
    }
  } catch (e) {
    console.log('[Blog Images] Python service not available, using placeholder');
  }

  // Fallback: Return placeholder data structure
  // This will be replaced with actual Nano Banana generation
  return NextResponse.json({
    message: 'Image generation service initializing...',
    prompt: enhancedPrompt,
    style,
    count,
    images: [], // Will contain base64 images when service is ready
    status: 'pending',
  });
}
