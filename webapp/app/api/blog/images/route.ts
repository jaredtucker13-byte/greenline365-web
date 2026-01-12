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

  // Generate images using the Python Nano Banana service
  const images: { id: string; data: string; mime_type: string }[] = [];
  const apiKey = process.env.EMERGENT_LLM_KEY || 'sk-emergent-c87DeA8638fD64f7d3';
  const generateCount = Math.min(count, 4);
  
  console.log('[Blog Images] Generating', generateCount, 'images...');
  
  for (let i = 0; i < generateCount; i++) {
    const variationPrompt = i === 0 
      ? enhancedPrompt 
      : `${enhancedPrompt} Alternative composition ${i + 1}.`;
    
    try {
      // Call the Python Nano Banana service directly
      const response = await fetch('http://localhost:8002/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: variationPrompt,
          api_key: apiKey,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.image) {
          images.push({
            id: `img-${Date.now()}-${i}`,
            data: data.image,
            mime_type: data.mime_type || 'image/png',
          });
          console.log(`[Blog Images] Generated image ${i + 1}/${generateCount}`);
        }
      }
    } catch (e) {
      console.log(`[Blog Images] Failed to generate image ${i + 1}:`, e);
    }
  }

  if (images.length > 0) {
    return NextResponse.json({
      success: true,
      images,
      message: `Generated ${images.length} images`,
    });
  }

  // Return message if no images generated
  return NextResponse.json({
    success: false,
    message: 'Image generation failed. Please try again.',
    images: [],
  });
}
