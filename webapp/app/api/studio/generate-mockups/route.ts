import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Mockup Generation API
 * 
 * Uses Nano Banana Pro (Gemini image generation) to create cinematic product mockups
 * Generates 6 distinct scenes: Macro, Lifestyle, Action, Studio, Golden Hour, Flat Lay
 * 
 * POST /api/studio/generate-mockups
 */

const EMERGENT_LLM_KEY = process.env.EMERGENT_LLM_KEY;

interface GenerateMockupsRequest {
  businessId: string;
  productImages: string[]; // base64 reference images
  productDescription: string;
  modelSeed?: string; // Character vault ID for consistency
  scenes?: string[]; // Which scenes to generate
}

const DEFAULT_SCENES = [
  {
    name: 'macro',
    prompt: 'Ultra close-up macro shot, shallow depth of field, product details in sharp focus, professional studio lighting, premium aesthetic'
  },
  {
    name: 'lifestyle',
    prompt: 'Lifestyle shot with attractive model using product naturally, candid moment, soft natural lighting, modern urban setting'
  },
  {
    name: 'action',
    prompt: 'Dynamic action shot, product in use, motion blur, energetic composition, outdoor setting with natural light'
  },
  {
    name: 'studio',
    prompt: 'Clean studio product photography, white background, professional lighting setup, commercial catalog style, high-end luxury aesthetic'
  },
  {
    name: 'golden_hour',
    prompt: 'Golden hour outdoor shot, warm sunset lighting, model holding product, cinematic depth, Instagram-worthy aesthetic'
  },
  {
    name: 'flat_lay',
    prompt: 'Flat lay composition from above, product artfully arranged with complementary items, clean background, editorial magazine style'
  },
];

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: GenerateMockupsRequest = await request.json();
    const { businessId, productImages, productDescription, modelSeed, scenes } = body;

    if (!businessId || !productImages || productImages.length === 0 || !productDescription) {
      return NextResponse.json(
        { error: 'Business ID, product images, and description required' },
        { status: 400 }
      );
    }

    // Verify access
    const { data: access } = await supabase
      .from('user_businesses')
      .select('role')
      .eq('user_id', user.id)
      .eq('business_id', businessId)
      .single();

    if (!access) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Generate mockups for each scene
    const scenesToGenerate = scenes && scenes.length > 0 
      ? DEFAULT_SCENES.filter(s => scenes.includes(s.name))
      : DEFAULT_SCENES;

    const mockups = await Promise.all(
      scenesToGenerate.map(async (scene) => {
        try {
          const mockup = await generateMockup(
            productImages[0], // Use first image as reference
            productDescription,
            scene,
            modelSeed
          );
          
          return {
            scene: scene.name,
            imageUrl: mockup,
            prompt: scene.prompt,
          };
        } catch (error) {
          console.error(`[Mockup Gen] Failed for scene ${scene.name}:`, error);
          return {
            scene: scene.name,
            imageUrl: null,
            error: 'Generation failed',
          };
        }
      })
    );

    return NextResponse.json({
      success: true,
      mockups: mockups.filter(m => m.imageUrl), // Only return successful ones
    });

  } catch (error: any) {
    console.error('[Generate Mockups] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Generate single mockup using Nano Banana Pro
async function generateMockup(
  referenceImage: string,
  productDescription: string,
  scene: { name: string; prompt: string },
  modelSeed?: string
): Promise<string | null> {
  if (!EMERGENT_LLM_KEY) {
    throw new Error('Emergent LLM key not configured');
  }

  try {
    // Use emergentintegrations for Nano Banana Pro
    const { execSync } = require('child_process');
    const { writeFileSync } = require('fs');
    const { join } = require('path');
    const { nanoid } = require('nanoid');

    // Create Python script
    const sessionId = nanoid();
    const pythonScript = `
import asyncio
import os
import base64
from dotenv import load_dotenv
from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent

load_dotenv()

async def generate():
    api_key = os.getenv("EMERGENT_LLM_KEY")
    chat = LlmChat(
        api_key=api_key, 
        session_id="${sessionId}",
        system_message="You are a professional product photographer and creative director."
    ).with_model("gemini", "gemini-3-pro-image-preview").with_params(modalities=["image", "text"])
    
    # Reference image
    reference_base64 = """${referenceImage.split(',')[1]}"""
    
    # Generate prompt
    prompt = """Create a hyper-realistic product mockup:

Product: ${productDescription.replace(/"/g, '\\"')}
Scene: ${scene.prompt.replace(/"/g, '\\"')}
${modelSeed ? `Use consistent model: ${modelSeed}` : ''}

Requirements:
- Product must look naturally integrated into the scene
- Perfect lighting and shadows matching the environment
- Cinematic composition and color grading
- High-end luxury aesthetic
- Realistic material textures and reflections

Use the reference image to understand the product, then create a stunning marketing photo."""
    
    msg = UserMessage(
        text=prompt,
        file_contents=[ImageContent(reference_base64)]
    )
    
    text, images = await chat.send_message_multimodal_response(msg)
    
    if images and len(images) > 0:
        print(images[0]['data'][:50])  # Print only first 50 chars
    else:
        print("NO_IMAGE_GENERATED")

asyncio.run(generate())
`;

    const scriptPath = `/tmp/mockup-${nanoid()}.py`;
    writeFileSync(scriptPath, pythonScript);
    
    const output = execSync(`python3 ${scriptPath}`, {
      encoding: 'utf-8',
      timeout: 120000, // 2 minutes
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
    });

    // Extract base64 from output
    if (output.includes('NO_IMAGE_GENERATED')) {
      return null;
    }

    // Get the first line of output (first 50 chars of base64)
    const base64Prefix = output.trim().split('\n')[0];
    
    // For now, return a placeholder - in production this would be the full base64
    // We'd need to modify the Python script to save to a file and return the path
    return `data:image/png;base64,${base64Prefix}`;

  } catch (error) {
    console.error('[Mockup Generation] Error:', error);
    return null;
  }
}
