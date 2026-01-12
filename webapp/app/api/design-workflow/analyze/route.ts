import { NextRequest, NextResponse } from 'next/server';

/**
 * Design Workflow - Step 1: Analysis
 * Analyzes existing screenshot OR generates design spec from scratch
 * Uses Gemini 3 Pro Vision, Gemini 2.0 Pro Vision, or GPT-4o for screenshots
 * Uses Claude Opus 4.5 for scratch builds
 */

interface AnalyzeRequest {
  mode: 'analyze' | 'scratch';
  // Analyze mode
  imageBase64?: string;
  visionModel?: 'gemini-3-pro' | 'gemini-2.0-pro' | 'gpt-4o';
  analysisType?: 'full' | 'hero' | 'conversion' | 'visual';
  // Scratch mode
  description?: string;
  brandColors?: string;
  stylePreference?: string;
  targetAudience?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: AnalyzeRequest = await request.json();
    const { mode } = body;

    if (!mode) {
      return NextResponse.json(
        { error: 'Mode is required' },
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

    let analysisText = '';
    let designSpec = {};

    if (mode === 'analyze') {
      // Analyze existing website from screenshot
      const { imageBase64, visionModel = 'gemini-3-pro', analysisType = 'full' } = body;

      if (!imageBase64) {
        return NextResponse.json(
          { error: 'Screenshot required for analyze mode' },
          { status: 400 }
        );
      }

      // Map vision models
      const visionModelMap: Record<string, string> = {
        'gemini-3-pro': 'gemini-3-pro-image-preview',
        'gemini-2.0-pro': 'gemini-2.0-pro-vision',
        'gpt-4o': 'gpt-4o',
      };

      const modelId = visionModelMap[visionModel] || 'gemini-3-pro-image-preview';

      const analysisPrompts: Record<string, string> = {
        full: `Analyze this website landing page screenshot and provide a comprehensive redesign assessment.

**HERO SECTION:**
- Headline clarity and emotional impact (1-10 score)
- Value proposition strength
- CTA button effectiveness and visibility
- Visual hierarchy assessment

**VISUAL DESIGN:**
- Color scheme harmony and accessibility (provide HEX codes)
- Typography choices and readability (specify fonts if identifiable)
- Spacing, alignment, and whitespace usage
- Dark/light theme execution quality

**TRUST & CREDIBILITY:**
- Social proof elements present/missing
- Statistics and data presentation
- Professional appearance score (1-10)

**CONVERSION OPTIMIZATION:**
- CTA placement and design
- Friction points identified
- Mobile responsiveness concerns
- Form/input field assessment

**TOP 5 IMMEDIATE IMPROVEMENTS:**
Prioritized list with specific, actionable changes including:
1. Specific headline text improvements
2. Exact color changes (HEX codes)
3. Layout modifications
4. CTA button text and style changes
5. Additional elements to add

**OVERALL SCORE:** X/100

Be brutally honest and extremely specific with colors, spacing, and recommendations.`,

        hero: `Focus ONLY on the hero/above-the-fold section:
1. Headline effectiveness (1-10) + specific improvement text
2. Subheadline clarity
3. CTA button analysis (exact color HEX, text, placement suggestions)
4. Background treatment (colors, gradients)
5. Specific improvement recommendations with HEX codes`,

        conversion: `Analyze ONLY conversion elements:
1. All CTA buttons (primary/secondary) with color analysis
2. Form fields and friction
3. Trust indicators
4. Urgency/scarcity elements
5. Specific A/B test recommendations`,

        visual: `Analyze ONLY visual design:
1. Color palette assessment (extract HEX codes)
2. Typography hierarchy (font families, sizes)
3. Imagery usage
4. Spacing and layout (specific pixel values)
5. Specific design improvements with exact values`,
      };

      // Use Python subprocess to call emergentintegrations
      const { spawn } = await import('child_process');
      const { promisify } = await import('util');
      const execFile = promisify((await import('child_process')).execFile);
      
      const pythonScript = `
import asyncio
import json
import sys
from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent

async def analyze():
    chat = LlmChat(
        api_key="${emergentKey}",
        session_id="vision-${Date.now()}",
        system_message="You are an expert UI/UX designer and CRO specialist. Analyze websites with brutal honesty. Be specific with colors (HEX), spacing (px), and fonts."
    )
    
    ${visionModel.startsWith('gemini') 
      ? `chat.with_model("gemini", "${modelId}")` 
      : `chat.with_model("openai", "gpt-4o")`
    }
    
    message = UserMessage(
        text='''${(analysisPrompts[analysisType] || analysisPrompts.full).replace(/'/g, "\\'")}''',
        file_contents=[ImageContent(image_base64="${imageBase64}")]
    )
    
    result = await chat.send_message(message)
    print(json.dumps({"analysis": result}))

asyncio.run(analyze())
`;

      const { stdout } = await execFile('python3', ['-c', pythonScript]);
      const result = JSON.parse(stdout);
      analysisText = result.analysis;

      // Extract design spec from analysis
      designSpec = {
        analysisType,
        visionModel,
        recommendations: analysisText,
      };

    } else {
      // Build from scratch mode
      const { description, brandColors, stylePreference, targetAudience } = body;

      if (!description) {
        return NextResponse.json(
          { error: 'Description required for scratch mode' },
          { status: 400 }
        );
      }

      // Use Claude Opus 4.5 for design specification
      const { LlmChat, UserMessage } = await import('emergentintegrations/llm/chat');
      
      const chat = LlmChat({
        apiKey: emergentKey,
        sessionId: `scratch-${Date.now()}`,
        systemMessage: 'You are a world-class web designer specializing in conversion-focused landing pages. Create detailed design specifications.',
      });

      chat.with_model('anthropic', 'claude-opus-4-5-20251101');

      const designPrompt = `Create a comprehensive design specification for a new website with these requirements:

**Description:** ${description}
${brandColors ? `**Brand Colors:** ${brandColors}` : ''}
${stylePreference ? `**Style:** ${stylePreference}` : ''}
${targetAudience ? `**Target Audience:** ${targetAudience}` : ''}

Provide a detailed design specification including:

**1. HERO SECTION:**
- Headline text (exact copy)
- Subheadline text
- CTA button text and style
- Background treatment

**2. COLOR PALETTE:**
- Primary color (HEX)
- Secondary color (HEX)
- Accent color (HEX)
- Background colors (HEX)
- Text colors (HEX)

**3. TYPOGRAPHY:**
- Heading font (Google Font name)
- Body font (Google Font name)
- Font sizes (h1, h2, body in px)

**4. LAYOUT STRUCTURE:**
- Hero section layout
- Feature sections
- Social proof section
- CTA sections
- Footer

**5. KEY SECTIONS TO INCLUDE:**
List 5-7 key sections with brief content guidance.

**6. CONVERSION ELEMENTS:**
- Primary CTAs (text and placement)
- Trust indicators
- Social proof elements

Be extremely specific so a developer can build this from your spec.`;

      const message = UserMessage({ text: designPrompt });
      analysisText = await chat.send_message(message);

      // Parse design spec
      designSpec = {
        mode: 'scratch',
        description,
        brandColors,
        stylePreference,
        targetAudience,
        specification: analysisText,
      };
    }

    return NextResponse.json({
      success: true,
      analysisText,
      designSpec,
    });

  } catch (error: any) {
    console.error('[Design Workflow - Analyze] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Analysis failed' },
      { status: 500 }
    );
  }
}
