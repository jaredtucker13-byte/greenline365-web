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
  moodHint?: string; // Optional mood variation hint for regeneration
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
  const { title, content, category, moodHint } = body;

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
      model: 'openai/gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: `Return a JSON object for styling a blog titled "${title}". ${moodHint ? `Make it feel ${moodHint}.` : ''}

Required fields:
- themeName: creative name (string)
- description: brief description under 40 chars (string)  
- colors: object with primary, secondary, accent, background, text, headings, links (all hex strings like "#FFFFFF")
- texture: object with type ("none"|"grain"|"dots"), opacity (0-1 number)
- typography: object with headingStyle ("bold"|"light"), headingSize ("large"|"medium"|"small")
- layout: object with contentWidth ("narrow"|"medium"|"wide"), spacing ("compact"|"balanced"|"airy")
- mood: emotional description under 30 chars (string)

Return ONLY the raw JSON object, no markdown, no code blocks, no explanation.`
        }
      ],
      temperature: 0.7,
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('[Blog Style] OpenRouter error:', error);
    return NextResponse.json({ error: 'Style analysis failed' }, { status: 500 });
  }

  const data = await response.json();
  const aiResponse = data.choices?.[0]?.message?.content || '{}';

  // Helper function to attempt JSON parsing
  const tryParseJson = (jsonStr: string): any | null => {
    try {
      return JSON.parse(jsonStr);
    } catch {
      return null;
    }
  };

  // Clean common AI response issues
  const cleanJson = (str: string): string => {
    return str
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/,(\s*[}\]])/g, '$1');
  };

  // Try to find and parse JSON from response
  let jsonContent = aiResponse;
  
  // Remove markdown code block if present
  const codeBlockMatch = aiResponse.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    jsonContent = codeBlockMatch[1];
  }
  
  // Find JSON object
  const jsonMatch = jsonContent.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    const cleaned = cleanJson(jsonMatch[0]);
    const parsed = tryParseJson(cleaned);
    if (parsed) {
      return NextResponse.json({ 
        success: true,
        styleGuide: parsed,
        raw: aiResponse,
      });
    }
  }

  // If direct parse failed, try to repair truncated JSON
  console.log('[Blog Style] Attempting to repair truncated JSON...');
  const partialMatch = jsonContent.match(/\{[\s\S]*/);
  if (partialMatch) {
    let fixedJson = cleanJson(partialMatch[0])
      .replace(/[\r\n]+/g, ' ')
      .replace(/\s+/g, ' ');
    
    // Count brackets to fix truncation
    const openBraces = (fixedJson.match(/\{/g) || []).length;
    const closeBraces = (fixedJson.match(/\}/g) || []).length;
    const openBrackets = (fixedJson.match(/\[/g) || []).length;
    const closeBrackets = (fixedJson.match(/\]/g) || []).length;
    
    // Check if we're in the middle of a string
    const quoteCount = (fixedJson.match(/"/g) || []).length;
    if (quoteCount % 2 !== 0) {
      fixedJson += '"';
    }
    
    // Handle truncated number/null values
    if (fixedJson.match(/:\s*\d*$/)) {
      fixedJson += '0';
    }
    if (fixedJson.match(/:\s*nul$/)) {
      fixedJson += 'l';
    }
    if (fixedJson.match(/:\s*nu$/)) {
      fixedJson += 'll';
    }
    if (fixedJson.match(/:\s*n$/)) {
      fixedJson += 'ull';
    }
    
    // Handle truncated in the middle of a key-value
    if (fixedJson.match(/,\s*"[^"]*"?\s*$/)) {
      // Remove incomplete key-value pair
      fixedJson = fixedJson.replace(/,\s*"[^"]*"?\s*$/, '');
    }
    if (fixedJson.match(/,\s*$/)) {
      fixedJson = fixedJson.slice(0, -1).trimEnd();
      if (fixedJson.endsWith(',')) {
        fixedJson = fixedJson.slice(0, -1);
      }
    }
    
    // Add missing closing brackets/braces
    for (let i = 0; i < openBrackets - closeBrackets; i++) {
      fixedJson += ']';
    }
    for (let i = 0; i < openBraces - closeBraces; i++) {
      fixedJson += '}';
    }
    
    // Final cleanup of trailing commas
    fixedJson = fixedJson.replace(/,(\s*[}\]])/g, '$1');
    
    const parsed = tryParseJson(fixedJson);
    if (parsed) {
      console.log('[Blog Style] Successfully repaired truncated JSON');
      return NextResponse.json({ 
        success: true,
        styleGuide: parsed,
        raw: aiResponse,
      });
    } else {
      console.error('[Blog Style] JSON repair failed. Fixed JSON:', fixedJson.slice(0, 500));
    }
  }

  console.error('[Blog Style] All parse attempts failed');
  return NextResponse.json({ 
    success: false,
    error: 'Could not parse style suggestions',
    raw: aiResponse,
  });
}
