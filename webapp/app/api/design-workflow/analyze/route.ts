import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

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

const EMERGENT_KEY = process.env.EMERGENT_LLM_KEY || 'sk-emergent-c87DeA8638fD64f7d3';

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

async function analyzeWithGemini(imageBase64: string, prompt: string, modelId: string): Promise<string> {
  const genAI = new GoogleGenAI({ apiKey: EMERGENT_KEY });
  
  const model = genAI.models.get(modelId);
  
  const response = await model.generateContent({
    contents: [
      {
        role: 'user',
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: 'image/png',
              data: imageBase64,
            },
          },
        ],
      },
    ],
    config: {
      systemInstruction: 'You are an expert UI/UX designer and web development consultant. Analyze websites thoroughly and provide actionable insights.',
    },
  });

  return response.text || 'No analysis generated';
}

async function generateDesignWithGemini(prompt: string): Promise<string> {
  const genAI = new GoogleGenAI({ apiKey: EMERGENT_KEY });
  
  const model = genAI.models.get('gemini-2.5-pro');
  
  const response = await model.generateContent({
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }],
      },
    ],
    config: {
      systemInstruction: 'You are a world-class web designer who creates stunning, conversion-optimized websites.',
    },
  });

  return response.text || 'No design generated';
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

      // Map UI model names to actual Gemini model IDs
      const modelMap: Record<string, string> = {
        'gemini-3-pro': 'gemini-2.5-pro',
        'gemini-2.0-pro': 'gemini-2.5-pro',
        'gpt-4o': 'gemini-2.5-pro', // Fallback to Gemini for now
      };

      const modelId = modelMap[visionModel] || 'gemini-2.5-pro';
      const prompt = ANALYSIS_PROMPTS[analysisType] || ANALYSIS_PROMPTS.full;

      const analysisText = await analyzeWithGemini(imageBase64, prompt, modelId);

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

      const analysisText = await generateDesignWithGemini(designPrompt);

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
