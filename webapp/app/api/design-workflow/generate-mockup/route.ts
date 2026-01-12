import { NextRequest, NextResponse } from 'next/server';

/**
 * Design Workflow - Step 2: Generate Mockup
 * Uses Nano Banana Pro (Gemini 3 Pro Image) to create visual mockup
 * Based on the analysis/design spec from Step 1
 */

interface MockupRequest {
  designSpec: any;
  analysisText: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: MockupRequest = await request.json();
    const { designSpec, analysisText } = body;

    if (!analysisText) {
      return NextResponse.json(
        { error: 'Analysis text required' },
        { status: 400 }
      );
    }

    const emergentKey = process.env.EMERGENT_LLM_KEY;
    if (!emergentKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    // Generate image prompt from analysis
    const imagePrompt = `Create a professional website hero section mockup based on this design specification:

${analysisText}

REQUIREMENTS:
- Modern, clean website hero section design
- Show headline, subheadline, CTA button clearly
- Use the specified color palette if mentioned
- Professional, high-fidelity mockup style
- Desktop/laptop view
- Include navbar at top
- Hero section should feel premium and conversion-focused
${designSpec.brandColors ? `- Incorporate these brand colors: ${designSpec.brandColors}` : ''}

Style: Professional website mockup, clean UI, modern design`;

    // Use Emergent Integrations for Nano Banana Pro
    const { LlmChat, UserMessage } = await import('emergentintegrations/llm/chat');
    
    const chat = LlmChat({
      apiKey: emergentKey,
      sessionId: `mockup-${Date.now()}`,
      systemMessage: 'You are a professional web design mockup generator.',
    });

    // Configure Nano Banana Pro (Gemini 3 Pro Image)
    chat.with_model('gemini', 'gemini-3-pro-image-preview').with_params({
      modalities: ['image', 'text'],
    });

    const message = UserMessage({ text: imagePrompt });

    // Get both text and images
    const [text, images] = await chat.send_message_multimodal_response(message);

    if (!images || images.length === 0) {
      return NextResponse.json(
        { error: 'No image generated' },
        { status: 500 }
      );
    }

    // Convert base64 image to data URL
    const mockupImage = images[0];
    const mockupImageUrl = `data:${mockupImage.mime_type};base64,${mockupImage.data}`;

    return NextResponse.json({
      success: true,
      mockupImageUrl,
      imagePromptUsed: imagePrompt,
    });

  } catch (error: any) {
    console.error('[Design Workflow - Generate Mockup] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Mockup generation failed' },
      { status: 500 }
    );
  }
}
