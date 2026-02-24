import { NextRequest, NextResponse } from 'next/server';
import { getSkillContext, getCoreMarketingContext } from '@/lib/marketing-skills-loader';
import { HTML_FORMAT_DIRECTIVE } from '@/lib/format-standards';
import { callOpenRouter } from '@/lib/openrouter';

interface AnalyzeRequest {
  mode: 'analyze' | 'scratch';
  imageBase64?: string;
  visionModel?: 'gemini-3-pro' | 'gemini-2.0-pro' | 'gpt-4o';
  analysisType?: 'full' | 'hero' | 'conversion' | 'visual';
  description?: string;
  brandColors?: string;
  stylePreference?: string;
  targetAudience?: string;
}

// Analysis prompts for different types
const ANALYSIS_PROMPTS: Record<string, string> = {
  full: `Analyze this website landing page comprehensively. Provide:
1. HERO SECTION - headline effectiveness (score 1-10), value proposition clarity, CTA effectiveness
2. VISUAL DESIGN - color scheme with exact HEX codes, typography choices, spacing and layout
3. TOP 5 IMPROVEMENTS - specific actionable changes with HEX color codes where applicable
4. OVERALL SCORE X/100 with reasoning`,
  hero: 'Focus on hero section only: headline, CTA, colors (HEX codes), background treatment.',
  conversion: 'Analyze conversion elements: CTAs, forms, trust indicators, friction points.',
  visual: 'Analyze visual design: colors (HEX codes), typography, spacing, layout balance.',
};

// OpenRouter model mapping - Using the BEST models
const MODEL_MAP: Record<string, string> = {
  'gemini-3-pro': 'google/gemini-2.5-pro-preview', // Gemini 3 Pro (best vision)
  'gemini-2.0-pro': 'google/gemini-2.5-pro-preview',
  'gpt-4o': 'openai/gpt-4o', // GPT-4o with vision
};

async function analyzeWithVision(
  imageBase64: string,
  prompt: string,
  modelId: string
): Promise<string> {
  const result = await callOpenRouter({
    model: modelId,
    messages: [
      {
        role: 'system',
        content: 'You are an expert UI/UX designer and web development consultant. Analyze websites thoroughly and provide actionable insights.',
      },
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          {
            type: 'image_url',
            image_url: {
              url: `data:image/png;base64,${imageBase64}`,
            },
          },
        ],
      },
    ],
    max_tokens: 4096,
    caller: 'GL365 Design Analyzer',
  });

  return result.content || 'No analysis generated';
}

async function generateDesign(prompt: string): Promise<string> {
  const result = await callOpenRouter({
    model: 'anthropic/claude-sonnet-4.6',
    messages: [
      {
        role: 'system',
        content: `You are a world-class web designer who creates stunning, conversion-optimized websites.${HTML_FORMAT_DIRECTIVE}${getSkillContext('page-cro')}${getCoreMarketingContext()}`,
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    max_tokens: 4096,
    caller: 'GL365 Design Generator',
  });

  return result.content || 'No design generated';
}

export async function POST(request: NextRequest) {
  try {
    const body: AnalyzeRequest = await request.json();
    const { mode } = body;

    if (!mode) {
      return NextResponse.json({ error: 'Mode is required' }, { status: 400 });
    }

    if (mode === 'analyze') {
      const { imageBase64, visionModel = 'gemini-3-pro', analysisType = 'full' } = body;

      if (!imageBase64) {
        return NextResponse.json({ error: 'Screenshot required' }, { status: 400 });
      }

      const modelId = MODEL_MAP[visionModel] || MODEL_MAP['gemini-3-pro'];
      const prompt = ANALYSIS_PROMPTS[analysisType] || ANALYSIS_PROMPTS.full;

      const analysisText = await analyzeWithVision(imageBase64, prompt, modelId);

      return NextResponse.json({
        success: true,
        analysisText,
        designSpec: { visionModel, analysisType },
      });

    } else {
      // Scratch mode - text only design generation
      const { description, brandColors, stylePreference, targetAudience } = body;

      if (!description) {
        return NextResponse.json({ error: 'Description required' }, { status: 400 });
      }

      const designPrompt = `Create a detailed design specification for this website:

DESCRIPTION: ${description}
${brandColors ? `BRAND COLORS: ${brandColors}` : ''}
${stylePreference ? `STYLE PREFERENCE: ${stylePreference}` : ''}
${targetAudience ? `TARGET AUDIENCE: ${targetAudience}` : ''}

Please provide:
1. HERO SECTION - headline, subheadline, CTA text and styling
2. COLOR PALETTE - primary, secondary, accent colors with HEX codes
3. TYPOGRAPHY - recommended Google Fonts for headings and body
4. LAYOUT STRUCTURE - sections and their order
5. KEY SECTIONS - what to include and why
6. CONVERSION ELEMENTS - CTAs, forms, trust indicators`;

      const analysisText = await generateDesign(designPrompt);

      return NextResponse.json({
        success: true,
        analysisText,
        designSpec: { mode: 'scratch' },
      });
    }

  } catch (error: any) {
    console.error('[Analyze] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Analysis failed' },
      { status: 500 }
    );
  }
}
