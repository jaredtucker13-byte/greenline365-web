import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Mockup Generation API
 * 
 * Uses kie.ai (GPT-4o Image API) to create cinematic product mockups
 * 
 * POST /api/studio/generate-mockups
 */

const KIE_API_KEY = process.env.KIE_API_KEY;
const KIE_API_URL = 'https://api.kie.ai/api/v1/gpt4o-image/generate';

interface GenerateMockupsRequest {
  productImageUrl: string;
  productDescription: string;
  productType: string;
  scenes: string[];  // Scene slugs to generate
  signatureModelId?: string;
}

// Scene prompts by slug
const SCENE_PROMPTS: Record<string, string> = {
  'minimalist-studio': 'Product photography on clean white seamless background, soft diffused lighting, subtle shadow, professional studio setup, 8K quality, commercial catalog aesthetic',
  'lifestyle-living': 'Product elegantly placed in modern minimalist living room, natural window light, cozy aesthetic, lifestyle photography, high-end interior',
  'golden-hour': 'Product in golden hour sunlight, warm tones, bokeh background, cinematic outdoor photography, magic hour lighting, professional quality',
  'urban-street': 'Product in urban street setting, concrete and brick textures, street style photography, authentic city vibe, editorial aesthetic',
  'flat-lay': 'Flat lay product photography, styled arrangement with complementary props, top-down angle, editorial magazine style, clean background',
  'nature-macro': 'Macro product shot with natural elements, leaves, flowers, water droplets, organic textures, nature-inspired, close-up detail',
};

// Wall art specific prompts
const WALL_ART_PROMPTS: Record<string, string> = {
  'minimalist-studio': 'Art print displayed in modern gallery setting, white walls, professional museum lighting, clean minimal presentation',
  'lifestyle-living': 'Art piece mounted on wall above contemporary sofa in modern living room, natural light from large windows, high-end interior design',
  'golden-hour': 'Art print in sunlit room with golden hour light casting warm glow, sophisticated home setting, lifestyle editorial',
  'urban-street': 'Art displayed in trendy loft space with exposed brick, industrial-chic interior, urban aesthetic',
  'flat-lay': 'Art print laid flat with frame elements, craft supplies, styled mockup presentation, top-down view',
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

// Generate single mockup using kie.ai GPT-4o Image API
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

  // Start generation task
  const response = await fetch(KIE_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${KIE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      imageUrls: [productImageUrl],  // Reference image
      size: '1:1',  // Square aspect ratio
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[kie.ai] API error for ${sceneName}:`, errorText);
    throw new Error(`kie.ai API error: ${response.status}`);
  }

  const result = await response.json();
  
  // kie.ai returns a task ID, we need to poll for the result
  const taskId = result.data?.taskId || result.taskId;
  
  if (!taskId) {
    // If direct URL is returned
    if (result.data?.imageUrl || result.imageUrl) {
      return result.data?.imageUrl || result.imageUrl;
    }
    throw new Error('No task ID or image URL returned');
  }

  // Poll for result (max 60 seconds)
  const imageUrl = await pollForResult(taskId);
  return imageUrl;
}

// Poll kie.ai for generation result
async function pollForResult(taskId: string, maxAttempts = 30): Promise<string> {
  const pollUrl = `https://api.kie.ai/api/v1/gpt4o-image/record-info?taskId=${taskId}`;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds between polls
    
    const response = await fetch(pollUrl, {
      headers: {
        'Authorization': `Bearer ${KIE_API_KEY}`,
      },
    });

    if (!response.ok) {
      console.error(`[kie.ai] Poll error: ${response.status}`);
      continue;
    }

    const result = await response.json();
    const status = result.data?.status || result.status;
    
    if (status === 'completed' || status === 'success') {
      const imageUrl = result.data?.response?.imageUrl || 
                       result.data?.imageUrl || 
                       result.response?.imageUrl ||
                       result.imageUrl;
      
      if (imageUrl) {
        return imageUrl;
      }
    } else if (status === 'failed' || status === 'error') {
      throw new Error(`Generation failed: ${result.data?.error || 'Unknown error'}`);
    }
    
    // Status is still 'processing' or 'pending', continue polling
  }
  
  throw new Error('Generation timed out');
}
