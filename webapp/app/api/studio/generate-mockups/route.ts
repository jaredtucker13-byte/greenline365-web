import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Mockup Generation API
 * 
 * Uses kie.ai 4.5 Text-to-Image API (seedream) for cost-effective mockup generation
 * 
 * POST /api/studio/generate-mockups
 */

const KIE_API_KEY = process.env.KIE_API_KEY;
const KIE_CREATE_TASK_URL = 'https://api.kie.ai/api/v1/jobs/createTask';
const KIE_QUERY_TASK_URL = 'https://api.kie.ai/api/v1/jobs/recordInfo';

interface GenerateMockupsRequest {
  productImageUrl: string;
  productDescription: string;
  productType: string;
  scenes: string[];  // Scene slugs to generate
  signatureModelId?: string;
}

// Scene prompts by slug (supports both underscore and hyphen formats)
const SCENE_PROMPTS: Record<string, string> = {
  'minimalist_studio': 'Product photography on clean white seamless background, soft diffused lighting, subtle shadow, professional studio setup, 8K quality, commercial catalog aesthetic',
  'minimalist-studio': 'Product photography on clean white seamless background, soft diffused lighting, subtle shadow, professional studio setup, 8K quality, commercial catalog aesthetic',
  'lifestyle_living': 'Product elegantly placed in modern minimalist living room, natural window light, cozy aesthetic, lifestyle photography, high-end interior',
  'lifestyle-living': 'Product elegantly placed in modern minimalist living room, natural window light, cozy aesthetic, lifestyle photography, high-end interior',
  'golden_hour': 'Product in golden hour sunlight, warm tones, bokeh background, cinematic outdoor photography, magic hour lighting, professional quality',
  'golden-hour': 'Product in golden hour sunlight, warm tones, bokeh background, cinematic outdoor photography, magic hour lighting, professional quality',
  'urban_street': 'Product in urban street setting, concrete and brick textures, street style photography, authentic city vibe, editorial aesthetic',
  'urban-street': 'Product in urban street setting, concrete and brick textures, street style photography, authentic city vibe, editorial aesthetic',
  'flat_lay': 'Flat lay product photography, styled arrangement with complementary props, top-down angle, editorial magazine style, clean background',
  'flat-lay': 'Flat lay product photography, styled arrangement with complementary props, top-down angle, editorial magazine style, clean background',
  'nature_macro': 'Macro product shot with natural elements, leaves, flowers, water droplets, organic textures, nature-inspired, close-up detail',
  'nature-macro': 'Macro product shot with natural elements, leaves, flowers, water droplets, organic textures, nature-inspired, close-up detail',
};

// Wall art specific prompts (supports both underscore and hyphen formats)
const WALL_ART_PROMPTS: Record<string, string> = {
  'minimalist_studio': 'Art print displayed in modern gallery setting, white walls, professional museum lighting, clean minimal presentation',
  'minimalist-studio': 'Art print displayed in modern gallery setting, white walls, professional museum lighting, clean minimal presentation',
  'lifestyle_living': 'Art piece mounted on wall above contemporary sofa in modern living room, natural light from large windows, high-end interior design',
  'lifestyle-living': 'Art piece mounted on wall above contemporary sofa in modern living room, natural light from large windows, high-end interior design',
  'golden_hour': 'Art print in sunlit room with golden hour light casting warm glow, sophisticated home setting, lifestyle editorial',
  'golden-hour': 'Art print in sunlit room with golden hour light casting warm glow, sophisticated home setting, lifestyle editorial',
  'urban_street': 'Art displayed in trendy loft space with exposed brick, industrial-chic interior, urban aesthetic',
  'urban-street': 'Art displayed in trendy loft space with exposed brick, industrial-chic interior, urban aesthetic',
  'flat_lay': 'Art print laid flat with frame elements, craft supplies, styled mockup presentation, top-down view',
  'flat-lay': 'Art print laid flat with frame elements, craft supplies, styled mockup presentation, top-down view',
  'nature_macro': 'Art piece in nature-inspired setting, plants and organic elements, biophilic design interior',
  'nature-macro': 'Art piece in nature-inspired setting, plants and organic elements, biophilic design interior',
};

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: GenerateMockupsRequest = await request.json();
    const { productImageUrl, productDescription, productType, scenes, signatureModelId } = body;

    if (!productImageUrl || !productDescription || !scenes || scenes.length === 0) {
      return NextResponse.json(
        { error: 'Product image URL, description, and scenes are required' },
        { status: 400 }
      );
    }

    // Check for API key
    if (!KIE_API_KEY) {
      console.warn('[Mockup Gen] No KIE_API_KEY configured, returning placeholders');
      return NextResponse.json({
        success: true,
        mockups: scenes.map(scene => ({
          scene,
          imageUrl: `https://placehold.co/1024x1024/1a1a2e/8b5cf6?text=${encodeURIComponent(scene)}`,
        })),
        warning: 'Image generation not configured - showing placeholders',
      });
    }

    // Select prompt set based on product type
    const prompts = productType === 'wall_art' ? WALL_ART_PROMPTS : SCENE_PROMPTS;

    // Generate mockups for each scene (limit to 6)
    const mockupPromises = scenes.slice(0, 6).map(async (sceneSlug) => {
      const scenePrompt = prompts[sceneSlug] || SCENE_PROMPTS['minimalist-studio'];
      
      try {
        const imageUrl = await generateWithKieAI(
          productImageUrl,
          productDescription,
          scenePrompt,
          sceneSlug
        );
        
        return {
          scene: sceneSlug,
          imageUrl,
        };
      } catch (error) {
        console.error(`[Mockup Gen] Scene ${sceneSlug} failed:`, error);
        return {
          scene: sceneSlug,
          imageUrl: `https://placehold.co/1024x1024/1a1a2e/ff3b3b?text=Error`,
          error: true,
        };
      }
    });

    const mockups = await Promise.all(mockupPromises);

    return NextResponse.json({
      success: true,
      mockups: mockups.filter(m => m.imageUrl && !m.error),
    });

  } catch (error: any) {
    console.error('[Generate Mockups] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Generate single mockup using kie.ai 4.5 Text-to-Image API (cost-effective)
async function generateWithKieAI(
  productImageUrl: string,
  productDescription: string,
  scenePrompt: string,
  sceneName: string
): Promise<string> {
  
  const prompt = `Create a stunning, hyper-realistic product mockup image.

PRODUCT: ${productDescription}

SCENE STYLE: ${scenePrompt}

REQUIREMENTS:
- The product must be the clear focal point
- Seamlessly integrate the product into the scene with natural lighting and shadows
- Cinematic composition with professional color grading
- High-end luxury aesthetic suitable for premium marketing
- Photorealistic quality, indistinguishable from a real photograph`;

  // Step 1: Create generation task
  const createResponse = await fetch(KIE_CREATE_TASK_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${KIE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'seedream/4.5-text-to-image',
      input: {
        prompt,
        aspect_ratio: '1:1',  // Square for product mockups
        quality: 'basic',     // Use basic for cost efficiency (2K)
      },
    }),
  });

  if (!createResponse.ok) {
    const errorText = await createResponse.text();
    console.error(`[kie.ai] Create task error for ${sceneName}:`, errorText);
    throw new Error(`kie.ai API error: ${createResponse.status}`);
  }

  const createResult = await createResponse.json();
  
  if (createResult.code !== 200 || !createResult.data?.taskId) {
    console.error(`[kie.ai] Create task failed:`, createResult);
    throw new Error(createResult.msg || 'Failed to create generation task');
  }

  const taskId = createResult.data.taskId;
  console.log(`[kie.ai] Task created for ${sceneName}: ${taskId}`);

  // Step 2: Poll for result
  const imageUrl = await pollForResult(taskId, sceneName);
  return imageUrl;
}

// Poll kie.ai for generation result
async function pollForResult(taskId: string, sceneName: string, maxAttempts = 60): Promise<string> {
  const pollUrl = `${KIE_QUERY_TASK_URL}?taskId=${taskId}`;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds between polls
    
    const response = await fetch(pollUrl, {
      headers: {
        'Authorization': `Bearer ${KIE_API_KEY}`,
      },
    });

    if (!response.ok) {
      console.error(`[kie.ai] Poll error for ${sceneName}: ${response.status}`);
      continue;
    }

    const result = await response.json();
    
    if (result.code !== 200) {
      console.error(`[kie.ai] Poll response error:`, result);
      continue;
    }
    
    const state = result.data?.state;
    
    if (state === 'success') {
      // Parse resultJson to get the image URL
      try {
        const resultJson = JSON.parse(result.data.resultJson || '{}');
        const imageUrl = resultJson.resultUrls?.[0];
        
        if (imageUrl) {
          console.log(`[kie.ai] Generation complete for ${sceneName}: ${imageUrl}`);
          return imageUrl;
        }
      } catch (parseError) {
        console.error(`[kie.ai] Error parsing resultJson:`, parseError);
      }
      throw new Error('No image URL in result');
    } else if (state === 'fail') {
      const failMsg = result.data?.failMsg || 'Unknown error';
      console.error(`[kie.ai] Generation failed for ${sceneName}: ${failMsg}`);
      throw new Error(`Generation failed: ${failMsg}`);
    }
    
    // State is still 'waiting', continue polling
    if (attempt % 10 === 0) {
      console.log(`[kie.ai] Still waiting for ${sceneName}... (attempt ${attempt + 1})`);
    }
  }
  
  throw new Error('Generation timed out after 2 minutes');
}
