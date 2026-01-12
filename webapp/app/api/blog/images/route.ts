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
  count?: number; // How many variations (1-3)
}

interface StyleAnalyzeRequest {
  action: 'analyze-style';
  title: string;
  content: string;
  category?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'analyze') {
      return analyzeContent(body as AnalyzeRequest);
    } else if (action === 'generate') {
      return generateImages(body as GenerateRequest);
    } else if (action === 'analyze-style') {
      return analyzePageStyle(body as StyleAnalyzeRequest);
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
  const { prompt, style = 'professional', count = 2 } = body; // Default to 2 images for speed

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
  const apiKey = process.env.EMERGENT_LLM_KEY || 'sk-emergent-c87DeA8638fD64f7d3';
  const generateCount = Math.min(count, 3); // Max 3 images
  
  console.log('[Blog Images] Generating', generateCount, 'images in parallel...');
  
  // PARALLEL generation for speed
  const generatePromises = Array.from({ length: generateCount }, (_, i) => {
    const variationPrompt = i === 0 
      ? enhancedPrompt 
      : `${enhancedPrompt} Alternative style ${i + 1}.`;
    
    return fetch('http://localhost:8002/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        prompt: variationPrompt,
        api_key: apiKey,
      }),
    })
    .then(async (response) => {
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.image) {
          console.log(`[Blog Images] Generated image ${i + 1}/${generateCount}`);
          return {
            id: `img-${Date.now()}-${i}`,
            data: data.image,
            mime_type: data.mime_type || 'image/png',
          };
        }
      }
      return null;
    })
    .catch((e) => {
      console.log(`[Blog Images] Failed image ${i + 1}:`, e);
      return null;
    });
  });

  // Wait for all images in parallel
  const results = await Promise.all(generatePromises);
  const images = results.filter((img): img is { id: string; data: string; mime_type: string } => img !== null);

  if (images.length > 0) {
    return NextResponse.json({
      success: true,
      images,
      message: `Generated ${images.length} images`,
    });
  }

  return NextResponse.json({
    success: false,
    message: 'Image generation failed. Please try again.',
    images: [],
  });
}

async function analyzePageStyle(body: StyleAnalyzeRequest) {
  const { title, content, category } = body;

  if (!title || !content) {
    return NextResponse.json(
      { error: 'Title and content are required' },
      { status: 400 }
    );
  }

  // Use AI to analyze content and suggest page styling
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://greenline365.com',
      'X-Title': 'GreenLine365 Blog Styling',
    },
    body: JSON.stringify({
      model: 'openai/gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an expert web designer and brand strategist. Analyze blog content and suggest a complete page styling theme that enhances the content's message and emotional impact.

Consider:
- Content tone (professional, casual, urgent, educational, inspiring)
- Target audience
- Industry/topic context
- Emotional impact desired
- Readability and accessibility

Return a comprehensive styling suggestion as JSON:
{
  "themeName": "Descriptive name for this style",
  "description": "Brief explanation of why this style fits the content",
  "colors": {
    "primary": "#hex - main accent color",
    "secondary": "#hex - supporting color",
    "accent": "#hex - highlight/CTA color",
    "background": "#hex - page background",
    "backgroundGradient": "CSS gradient string or null",
    "text": "#hex - main text color",
    "textMuted": "#hex - secondary text",
    "headings": "#hex - heading color",
    "links": "#hex - link color"
  },
  "texture": {
    "type": "none|grain|dots|lines|geometric|organic",
    "opacity": 0.0-1.0,
    "description": "What texture adds to the design"
  },
  "typography": {
    "headingStyle": "bold|light|italic|uppercase",
    "headingSize": "large|medium|compact",
    "bodyLineHeight": "relaxed|normal|tight",
    "emphasis": "How to style key points"
  },
  "layout": {
    "contentWidth": "narrow|medium|wide",
    "imageStyle": "rounded|sharp|polaroid|shadow",
    "spacing": "airy|balanced|compact",
    "headerStyle": "minimal|bold|gradient|image"
  },
  "mood": "The overall feeling this design creates"
}`
        },
        {
          role: 'user',
          content: `Analyze this blog post and suggest the perfect page styling:

Title: ${title}
Category: ${category || 'General'}

Content:
${content.slice(0, 2000)}${content.length > 2000 ? '...' : ''}`
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('[Blog Style] OpenRouter error:', error);
    return NextResponse.json({ error: 'Style analysis failed' }, { status: 500 });
  }

  const data = await response.json();
  const aiResponse = data.choices?.[0]?.message?.content || '{}';

  // Parse JSON response with robust cleaning
  try {
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      // Clean the JSON string - fix common AI response issues
      let cleanedJson = jsonMatch[0]
        // Replace smart quotes with regular quotes
        .replace(/[\u2018\u2019]/g, "'")
        .replace(/[\u201C\u201D]/g, '"')
        // Remove any trailing commas before closing braces/brackets
        .replace(/,(\s*[}\]])/g, '$1')
        // Handle line breaks in string values
        .replace(/\n/g, '\\n')
        // Fix unescaped quotes in string values (basic)
        .replace(/"([^"]*)":\s*"([^"]*)"/g, (match, key, value) => {
          const cleanValue = value.replace(/(?<!\\)"/g, '\\"');
          return `"${key}": "${cleanValue}"`;
        });
      
      const styleGuide = JSON.parse(cleanedJson);
      return NextResponse.json({ 
        success: true,
        styleGuide,
        raw: aiResponse,
      });
    }
  } catch (e: any) {
    console.error('[Blog Style] JSON parse error:', e.message);
    console.error('[Blog Style] Raw response:', aiResponse.slice(0, 500));
    
    // Try a more aggressive cleanup approach
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        // Remove all line breaks and extra spaces
        const aggressive = jsonMatch[0]
          .replace(/[\r\n]+/g, ' ')
          .replace(/\s+/g, ' ')
          .replace(/,\s*}/g, '}')
          .replace(/,\s*]/g, ']');
        const styleGuide = JSON.parse(aggressive);
        return NextResponse.json({ 
          success: true,
          styleGuide,
          raw: aiResponse,
        });
      }
    } catch (e2) {
      console.error('[Blog Style] Aggressive parse also failed');
    }
  }

  return NextResponse.json({ 
    success: false,
    error: 'Could not parse style suggestions',
    raw: aiResponse,
  });
}
