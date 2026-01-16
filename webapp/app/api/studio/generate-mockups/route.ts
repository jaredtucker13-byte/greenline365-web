import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { spawn } from 'child_process';
import { writeFileSync, readFileSync, unlinkSync, existsSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';

/**
 * Mockup Generation API
 * 
 * Uses Nano Banana Pro (Gemini image generation via Emergent) to create cinematic product mockups
 * 
 * POST /api/studio/generate-mockups
 */

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
    const apiKey = process.env.EMERGENT_LLM_KEY;
    if (!apiKey) {
      console.warn('[Mockup Gen] No EMERGENT_LLM_KEY, returning placeholders');
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

    // Generate mockups for each scene
    const mockupPromises = scenes.slice(0, 6).map(async (sceneSlug) => {
      const scenePrompt = prompts[sceneSlug] || SCENE_PROMPTS['minimalist-studio'];
      
      try {
        const imageUrl = await generateSingleMockup(
          apiKey,
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

// Generate single mockup using Python + Emergent integrations
async function generateSingleMockup(
  apiKey: string,
  productImageUrl: string,
  productDescription: string,
  scenePrompt: string,
  sceneName: string
): Promise<string> {
  
  const sessionId = randomUUID();
  const outputPath = `/tmp/mockup_${sessionId}.png`;
  
  // Create Python script
  const pythonScript = `
import asyncio
import os
import base64
import urllib.request
import sys

# Set API key directly
os.environ["EMERGENT_LLM_KEY"] = "${apiKey}"

from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent

async def generate():
    try:
        # Download reference image
        product_url = "${productImageUrl}"
        req = urllib.request.Request(product_url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=30) as response:
            image_bytes = response.read()
            image_base64 = base64.b64encode(image_bytes).decode('utf-8')
        
        # Initialize chat
        chat = LlmChat(
            api_key="${apiKey}",
            session_id="${sessionId}",
            system_message="You are a professional product photographer and creative director specializing in high-end commercial imagery."
        ).with_model("gemini", "gemini-3-pro-image-preview").with_params(modalities=["image", "text"])
        
        # Generate prompt
        prompt = """Create a stunning, hyper-realistic product mockup image.

PRODUCT: ${productDescription.replace(/"/g, '\\"').replace(/\n/g, ' ')}

SCENE STYLE: ${scenePrompt.replace(/"/g, '\\"')}

REQUIREMENTS:
- The product from the reference image must be the clear focal point
- Seamlessly integrate the product into the scene with natural lighting and shadows
- Cinematic composition with professional color grading
- High-end luxury aesthetic suitable for premium marketing
- Photorealistic quality, indistinguishable from a real photograph
- Resolution suitable for print and digital marketing

Generate one beautiful product mockup image."""

        msg = UserMessage(
            text=prompt,
            file_contents=[ImageContent(image_base64)]
        )
        
        text, images = await chat.send_message_multimodal_response(msg)
        
        if images and len(images) > 0:
            # Save image to file
            image_data = base64.b64decode(images[0]['data'])
            with open("${outputPath}", "wb") as f:
                f.write(image_data)
            print("SUCCESS")
        else:
            print("NO_IMAGE")
            
    except Exception as e:
        print(f"ERROR: {str(e)}", file=sys.stderr)
        sys.exit(1)

asyncio.run(generate())
`;

  const scriptPath = `/tmp/gen_${sessionId}.py`;
  
  return new Promise((resolve, reject) => {
    try {
      writeFileSync(scriptPath, pythonScript);
      
      const python = spawn('python3', [scriptPath], {
        timeout: 120000,
        env: { ...process.env, EMERGENT_LLM_KEY: apiKey },
      });
      
      let stdout = '';
      let stderr = '';
      
      python.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      python.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      python.on('close', (code) => {
        // Cleanup script
        try { unlinkSync(scriptPath); } catch {}
        
        if (code === 0 && stdout.includes('SUCCESS') && existsSync(outputPath)) {
          // Read image and convert to base64 data URL
          const imageBuffer = readFileSync(outputPath);
          const base64 = imageBuffer.toString('base64');
          
          // Cleanup output file
          try { unlinkSync(outputPath); } catch {}
          
          resolve(`data:image/png;base64,${base64}`);
        } else {
          console.error(`[Mockup Gen] Python error for ${sceneName}:`, stderr || stdout);
          reject(new Error(stderr || 'Generation failed'));
        }
      });
      
      python.on('error', (err) => {
        try { unlinkSync(scriptPath); } catch {}
        reject(err);
      });
      
    } catch (err) {
      try { unlinkSync(scriptPath); } catch {}
      reject(err);
    }
  });
}
