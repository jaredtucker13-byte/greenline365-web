import { NextRequest, NextResponse } from 'next/server';

/**
 * Blog Image Suggestion & Generation API
 * 
 * Actions:
 * - analyze: Analyze content and suggest image placements with enriched artistic prompts
 * - generate: Generate images using Nano Banana Pro (cinematic) or GPT-5.2 (charts)
 * - generate-custom: Generate custom image from user prompt
 * 
 * Features:
 * - Enriched artistic prompts with cinematic details (user sees clean version, API gets full details)
 * - Chart/infographic detection → routes to GPT-5.2
 * - Retry logic: if one image fails, discard all and retry (up to 3 attempts)
 * - Multiple aspect ratios: landscape (16:9), portrait (9:16), square (1:1), cinematic (21:9)
 * - 4K resolution output
 */

interface ImageSuggestion {
  id: string;
  placement: 'header' | 'inline' | 'section-break' | 'right-float' | 'left-float' | 'full-width';
  context: string;
  prompt: string; // User-friendly short prompt
  enrichedPrompt?: string; // Full artistic prompt for API (hidden from user)
  position: number;
  sectionTitle?: string;
  isChart?: boolean; // If true, route to GPT-5.2
  suggestedRatio?: '16:9' | '9:16' | '1:1' | '21:9';
}

interface AnalyzeRequest {
  action: 'analyze';
  title: string;
  content: string;
}

interface GenerateRequest {
  action: 'generate';
  prompt: string;
  enrichedPrompt?: string; // Full artistic prompt
  style?: 'professional' | 'illustration' | 'minimalist' | 'creative' | 'cinematic';
  count?: number;
  aspectRatio?: '16:9' | '9:16' | '1:1' | '21:9';
  isChart?: boolean;
}

interface GenerateCustomRequest {
  action: 'generate-custom';
  userPrompt: string;
  aspectRatio?: '16:9' | '9:16' | '1:1' | '21:9';
}

interface StyleAnalyzeRequest {
  action: 'analyze-style';
  title: string;
  content: string;
  category?: string;
  moodHint?: string;
}

// Cinematic enhancement templates
const CINEMATIC_ENHANCEMENTS = {
  lighting: [
    'golden hour lighting with warm amber tones',
    'dramatic chiaroscuro lighting with deep shadows',
    'soft diffused natural light',
    'cinematic rim lighting highlighting edges',
    'moody atmospheric lighting with volumetric rays',
  ],
  composition: [
    'shot with shallow depth of field, bokeh background',
    'wide establishing shot with rule of thirds composition',
    'intimate close-up with sharp focus on subject',
    'dynamic diagonal composition creating visual tension',
    'symmetrical centered composition for balance',
  ],
  technical: [
    'shot on ARRI Alexa with anamorphic lens',
    'captured with 35mm film grain texture',
    'photographed with Hasselblad medium format',
    'rendered in photorealistic 8K detail',
    'cinematic color grading with teal and orange tones',
  ],
  atmosphere: [
    'atmospheric haze adding depth',
    'crisp clear air with high contrast',
    'dreamy ethereal quality',
    'gritty realistic texture',
    'polished commercial finish',
  ],
};

function enrichPromptWithCinematicDetails(basePrompt: string, style: string = 'professional'): string {
  // Select random enhancements for variety
  const lighting = CINEMATIC_ENHANCEMENTS.lighting[Math.floor(Math.random() * CINEMATIC_ENHANCEMENTS.lighting.length)];
  const composition = CINEMATIC_ENHANCEMENTS.composition[Math.floor(Math.random() * CINEMATIC_ENHANCEMENTS.composition.length)];
  const technical = CINEMATIC_ENHANCEMENTS.technical[Math.floor(Math.random() * CINEMATIC_ENHANCEMENTS.technical.length)];
  const atmosphere = CINEMATIC_ENHANCEMENTS.atmosphere[Math.floor(Math.random() * CINEMATIC_ENHANCEMENTS.atmosphere.length)];

  const styleEnhancements: Record<string, string> = {
    professional: 'Clean, sophisticated corporate aesthetic. Premium brand quality.',
    illustration: 'Vivid digital art style, rich saturated colors, artistic interpretation.',
    minimalist: 'Elegant simplicity, negative space, refined color palette.',
    creative: 'Bold artistic vision, unique perspective, visually striking.',
    cinematic: 'Movie-quality production value, dramatic storytelling through imagery.',
  };

  return `${basePrompt}. 

VISUAL DIRECTION:
- Lighting: ${lighting}
- Composition: ${composition}  
- Technical: ${technical}
- Atmosphere: ${atmosphere}
- Style: ${styleEnhancements[style] || styleEnhancements.professional}

OUTPUT SPECS: Ultra high resolution 4K (3840x2160), professionally color graded, publication-ready quality. No text, watermarks, or logos.`;
}

function getAspectRatioSize(ratio: string): string {
  // Return size format for Kie.ai API
  const ratioMap: Record<string, string> = {
    '16:9': '16:9',    // Landscape - standard
    '9:16': '9:16',    // Portrait - vertical
    '1:1': '1:1',      // Square
    '21:9': '21:9',    // Cinematic ultrawide
  };
  return ratioMap[ratio] || '16:9';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'analyze') {
      return analyzeContent(body as AnalyzeRequest);
    } else if (action === 'generate') {
      return generateImages(body as GenerateRequest);
    } else if (action === 'generate-custom') {
      return generateCustomImage(body as GenerateCustomRequest);
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

  // Use OpenRouter to analyze content with enhanced artistic direction
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
          content: `You are a visionary visual director and cinematographer analyzing content for powerful imagery. Think like a master photographer and film director combined.

For each image suggestion, you MUST provide TWO prompts:
1. "prompt": A clean, user-friendly 1-2 sentence description
2. "enrichedPrompt": A detailed artistic direction with specific visual elements

For enrichedPrompt, think cinematically and include:
- Camera angle (low angle hero shot, bird's eye view, intimate close-up, wide establishing)
- Lighting direction (golden hour warmth, dramatic side lighting, soft diffused, high contrast)
- Mood and atmosphere (energetic, contemplative, powerful, serene)
- Color palette (specific colors that evoke emotion)
- Composition details (rule of thirds, leading lines, negative space)
- Texture and detail (sharp focus areas, bokeh, grain)
- Reference style (like a Wes Anderson frame, Christopher Nolan's scale, nature documentary quality)

IMPORTANT DETECTION:
- If content mentions statistics, data, comparisons, percentages, or trends → mark isChart: true
- Charts/infographics will be routed to a different AI model

Return JSON array (max 5 suggestions):
[
  {
    "id": "unique-id",
    "placement": "header|inline|section-break|right-float|left-float|full-width",
    "context": "Brief context for user",
    "prompt": "Clean 1-2 sentence description",
    "enrichedPrompt": "Full cinematic direction with all visual details...",
    "position": 0,
    "sectionTitle": "optional",
    "isChart": false,
    "suggestedRatio": "16:9|9:16|1:1|21:9"
  }
]

Placement guide:
- header: Hero image at top (16:9 or 21:9)
- inline: Within paragraph flow (16:9)
- section-break: Between major sections (21:9 cinematic)
- right-float: Floated right with text wrap (1:1 or 9:16)
- left-float: Floated left with text wrap (1:1 or 9:16)
- full-width: Edge to edge impact (21:9)`
        },
        {
          role: 'user',
          content: `Analyze this blog post and suggest up to 5 optimal image placements with full cinematic direction:

Title: ${title}

Content:
${content}`
        }
      ],
      temperature: 0.7,
      max_tokens: 2500,
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
  const { 
    prompt, 
    enrichedPrompt,
    style = 'cinematic', 
    count = 2, 
    aspectRatio = '16:9',
    isChart = false 
  } = body;

  if (!prompt) {
    return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
  }

  // Route charts to GPT-5.2 via OpenRouter
  if (isChart) {
    return generateChartWithGPT(prompt, aspectRatio);
  }

  // Use enriched prompt for Nano Banana, or create one
  const finalPrompt = enrichedPrompt || enrichPromptWithCinematicDetails(prompt, style);
  const apiKey = process.env.KIE_API_KEY || '1f1d2d3eed99f294339cb1f17b5bc743';
  const generateCount = Math.min(count, 2); // Always generate 2 images
  const imageSize = getAspectRatioSize(aspectRatio);

  console.log('[Blog Images] Generating', generateCount, 'images using Nano Banana Pro...');
  console.log('[Blog Images] Aspect ratio:', aspectRatio, '→', imageSize);

  // RETRY LOGIC: Both images must succeed, up to 3 attempts
  const MAX_ATTEMPTS = 3;
  
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    console.log(`[Blog Images] Attempt ${attempt}/${MAX_ATTEMPTS}...`);
    
    const results = await generateImageBatch(finalPrompt, generateCount, imageSize, apiKey, attempt);
    
    // Check if ALL images succeeded
    const successfulImages = results.filter(r => r !== null) as { id: string; url: string }[];
    
    if (successfulImages.length === generateCount) {
      // All images succeeded!
      return NextResponse.json({
        success: true,
        images: successfulImages.map(img => ({
          id: img.id,
          url: img.url,
          data: img.url,
          mime_type: 'image/png',
          aspectRatio,
        })),
        message: `Generated ${successfulImages.length} image(s) with Nano Banana Pro`,
        attempt,
      });
    }
    
    // If we're here, at least one image failed - discard all and retry
    console.log(`[Blog Images] Attempt ${attempt} failed (${successfulImages.length}/${generateCount} succeeded). Discarding and retrying...`);
    
    if (attempt === MAX_ATTEMPTS) {
      return NextResponse.json({
        success: false,
        message: `Image generation failed after ${MAX_ATTEMPTS} attempts. Please try again.`,
        images: [],
        attemptsUsed: MAX_ATTEMPTS,
      });
    }
    
    // Small delay before retry
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return NextResponse.json({
    success: false,
    message: 'Image generation failed. Please try again.',
    images: [],
  });
}

async function generateImageBatch(
  prompt: string, 
  count: number, 
  imageSize: string, 
  apiKey: string,
  attemptNum: number
): Promise<({ id: string; url: string } | null)[]> {
  
  const generateSingleImage = async (variationPrompt: string, index: number): Promise<{ id: string; url: string } | null> => {
    try {
      // Submit generation request to Kie.ai
      const response = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/nano-banana',
          input: {
            prompt: variationPrompt,
            image_size: imageSize,
            output_format: 'png',
          },
        }),
      });

      const data = await response.json();
      console.log(`[Blog Images] Kie.ai createTask response (attempt ${attemptNum}, image ${index + 1}):`, JSON.stringify(data).slice(0, 300));

      if (!response.ok || data.code !== 200) {
        console.error(`[Blog Images] Kie.ai error for image ${index + 1}:`, data.msg || data);
        return null;
      }

      const taskId = data.data?.taskId;
      if (!taskId) {
        console.error(`[Blog Images] No taskId in response`);
        return null;
      }

      // Poll for result (max 90 seconds)
      console.log(`[Blog Images] Polling for task ${taskId}...`);
      for (let pollAttempt = 0; pollAttempt < 45; pollAttempt++) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const statusResponse = await fetch(`https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${taskId}`, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
          },
        });

        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          const taskState = statusData.data?.state;
          
          if (taskState === 'success') {
            try {
              const resultJson = JSON.parse(statusData.data?.resultJson || '{}');
              const imageUrl = resultJson.resultUrls?.[0] || resultJson.images?.[0];
              
              if (imageUrl) {
                console.log(`[Blog Images] Generated image ${index + 1} successfully`);
                return {
                  id: `img-${Date.now()}-${attemptNum}-${index}`,
                  url: imageUrl,
                };
              }
            } catch (e) {
              console.error(`[Blog Images] Failed to parse resultJson:`, e);
            }
          }
          
          if (taskState === 'fail') {
            console.error(`[Blog Images] Task ${taskId} failed:`, statusData.data?.failMsg || statusData);
            return null;
          }
        }
      }
      
      console.log(`[Blog Images] Timeout waiting for task ${taskId}`);
      return null;

    } catch (error) {
      console.error(`[Blog Images] Error generating image ${index + 1}:`, error);
      return null;
    }
  };

  // Generate all images in parallel for this batch
  const promises: Promise<{ id: string; url: string } | null>[] = [];
  
  for (let i = 0; i < count; i++) {
    const variationPrompt = i === 0 
      ? prompt 
      : `${prompt} Alternative artistic interpretation, variation ${i + 1}.`;
    promises.push(generateSingleImage(variationPrompt, i));
  }

  return Promise.all(promises);
}

async function generateChartWithGPT(prompt: string, aspectRatio: string) {
  console.log('[Blog Images] Generating chart/infographic with GPT-5.2...');
  
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://greenline365.com',
      'X-Title': 'GreenLine365 Chart Generation',
    },
    body: JSON.stringify({
      model: 'openai/gpt-5.2',
      messages: [
        {
          role: 'system',
          content: `You are an expert data visualization designer. Create beautiful, clear charts and infographics.
          
When asked to create a chart or infographic:
1. Design a clean, professional visualization
2. Use a modern color palette suitable for business
3. Ensure data is clearly readable
4. Include proper labels and legends
5. Make it visually appealing for a blog post

Output the visualization as an SVG or describe it in detail for rendering.`
        },
        {
          role: 'user',
          content: `Create a professional chart/infographic for: ${prompt}
          
Aspect ratio: ${aspectRatio}
Style: Clean, modern, professional for a business blog`
        }
      ],
      temperature: 0.5,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('[Blog Images] GPT-5.2 chart error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Chart generation failed',
      message: 'Could not generate chart. Try a different description.',
    }, { status: 500 });
  }

  const data = await response.json();
  const chartContent = data.choices?.[0]?.message?.content || '';

  // For now, return the chart description/SVG
  // In production, this would be rendered to an actual image
  return NextResponse.json({
    success: true,
    isChart: true,
    chartContent,
    message: 'Chart generated with GPT-5.2',
    images: [{
      id: `chart-${Date.now()}`,
      type: 'chart',
      content: chartContent,
      aspectRatio,
    }],
  });
}

async function generateCustomImage(body: GenerateCustomRequest) {
  const { userPrompt, aspectRatio = '16:9' } = body;

  if (!userPrompt) {
    return NextResponse.json({ error: 'User prompt is required' }, { status: 400 });
  }

  // Detect if user is asking for a chart
  const chartKeywords = ['chart', 'graph', 'infographic', 'data', 'statistics', 'pie chart', 'bar chart', 'line graph', 'comparison'];
  const isChart = chartKeywords.some(keyword => userPrompt.toLowerCase().includes(keyword));

  if (isChart) {
    return generateChartWithGPT(userPrompt, aspectRatio);
  }

  // Enrich the user prompt with cinematic details
  const enrichedPrompt = enrichPromptWithCinematicDetails(userPrompt, 'cinematic');
  
  const apiKey = process.env.KIE_API_KEY || '1f1d2d3eed99f294339cb1f17b5bc743';
  const imageSize = getAspectRatioSize(aspectRatio);

  console.log('[Blog Images] Generating custom image from user prompt...');
  console.log('[Blog Images] User prompt:', userPrompt.slice(0, 100));
  console.log('[Blog Images] Aspect ratio:', aspectRatio);

  // Generate single custom image with retry logic
  const MAX_ATTEMPTS = 3;
  
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const response = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/nano-banana',
          input: {
            prompt: enrichedPrompt,
            image_size: imageSize,
            output_format: 'png',
          },
        }),
      });

      const data = await response.json();

      if (!response.ok || data.code !== 200) {
        console.error(`[Blog Images] Custom image attempt ${attempt} failed:`, data.msg || data);
        if (attempt === MAX_ATTEMPTS) {
          return NextResponse.json({
            success: false,
            message: `Image generation failed after ${MAX_ATTEMPTS} attempts.`,
          });
        }
        continue;
      }

      const taskId = data.data?.taskId;
      if (!taskId) {
        continue;
      }

      // Poll for result
      for (let poll = 0; poll < 45; poll++) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const statusResponse = await fetch(`https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${taskId}`, {
          headers: { 'Authorization': `Bearer ${apiKey}` },
        });

        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          const taskState = statusData.data?.state;
          
          if (taskState === 'success') {
            const resultJson = JSON.parse(statusData.data?.resultJson || '{}');
            const imageUrl = resultJson.resultUrls?.[0] || resultJson.images?.[0];
            
            if (imageUrl) {
              return NextResponse.json({
                success: true,
                images: [{
                  id: `custom-${Date.now()}`,
                  url: imageUrl,
                  data: imageUrl,
                  mime_type: 'image/png',
                  aspectRatio,
                  isCustom: true,
                }],
                message: 'Custom image generated successfully',
                userPrompt,
              });
            }
          }
          
          if (taskState === 'fail') {
            break; // Try next attempt
          }
        }
      }
    } catch (error) {
      console.error(`[Blog Images] Custom image attempt ${attempt} error:`, error);
    }
  }

  return NextResponse.json({
    success: false,
    message: 'Custom image generation failed. Please try again.',
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
      'X-Title': 'GreenLine365 Style Analysis',
    },
    body: JSON.stringify({
      model: 'openai/gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an expert web designer and brand strategist. Analyze content and suggest cohesive visual styling.

Consider:
- Content tone (professional, casual, inspiring, technical)
- Target audience
- Brand personality
- Visual hierarchy needs
${moodHint ? `User mood hint: ${moodHint}` : ''}

Return JSON with styling suggestions:
{
  "primaryColor": "#hex",
  "secondaryColor": "#hex",
  "accentColor": "#hex",
  "fontStyle": "modern|classic|playful|professional",
  "mood": "energetic|calm|serious|inspiring|friendly",
  "layoutStyle": "minimal|rich|balanced|bold",
  "imageStyle": "photography|illustration|abstract|mixed",
  "heroType": "full-bleed|contained|split|minimal",
  "reasoning": "Brief explanation"
}`
        },
        {
          role: 'user',
          content: `Analyze and suggest visual styling for:

Title: ${title}
Category: ${category || 'General'}

Content Preview:
${content.slice(0, 1500)}`
        }
      ],
      temperature: 0.6,
      max_tokens: 800,
    }),
  });

  if (!response.ok) {
    return NextResponse.json({ error: 'Style analysis failed' }, { status: 500 });
  }

  const data = await response.json();
  const aiResponse = data.choices?.[0]?.message?.content || '{}';

  try {
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const styleGuide = JSON.parse(jsonMatch[0]);
      return NextResponse.json({ styleGuide });
    }
  } catch (e) {
    console.error('[Blog Images] Style JSON parse error:', e);
  }

  return NextResponse.json({
    error: 'Could not parse style suggestions',
    raw: aiResponse,
  });
}
