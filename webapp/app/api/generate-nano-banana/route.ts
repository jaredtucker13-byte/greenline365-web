import { NextRequest, NextResponse } from 'next/server';

/**
 * Nano Banana Image Generation API
 * Uses Emergent Integrations library with Gemini's image generation
 */

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const apiKey = process.env.EMERGENT_LLM_KEY;
    if (!apiKey) {
      console.error('[Nano Banana] EMERGENT_LLM_KEY not configured');
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    console.log('[Nano Banana] Generating image with prompt:', prompt.slice(0, 100) + '...');

    // Call the Python service for image generation
    // The emergentintegrations library requires Python runtime
    const response = await fetch('http://localhost:8002/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        prompt,
        api_key: apiKey,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.image) {
        return NextResponse.json({ 
          success: true,
          image: data.image,
          mime_type: data.mime_type || 'image/png',
        });
      }
    }

    // If Python service not available, return error
    return NextResponse.json({ 
      error: 'Image generation service not available',
      details: 'The Nano Banana service is being initialized. Please try again in a moment.',
    }, { status: 503 });

  } catch (error: any) {
    console.error('[Nano Banana] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Generation failed' },
      { status: 500 }
    );
  }
}
