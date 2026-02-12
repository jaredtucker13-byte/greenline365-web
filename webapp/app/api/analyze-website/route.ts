import { NextRequest, NextResponse } from 'next/server';
import { getSkillContext } from '@/lib/marketing-skills-loader';

// Website Analyzer API - Premium Feature
// Uses Gemini 3 Pro for vision analysis and Claude Opus 4.6 for suggestions

interface AnalysisRequest {
  url?: string;
  imageBase64?: string;
  analysisType?: 'full' | 'hero' | 'conversion' | 'visual';
}

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const body: AnalysisRequest = await request.json();
    const { url, imageBase64, analysisType = 'full' } = body;

    if (!imageBase64 && !url) {
      return NextResponse.json(
        { error: 'Either imageBase64 or url is required' },
        { status: 400 }
      );
    }

    if (!OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: 'OpenRouter API key not configured' },
        { status: 500 }
      );
    }

    // Prepare the image for analysis
    let imageData = imageBase64;
    
    // If URL provided, we'd need to screenshot it (handled client-side for now)
    if (url && !imageBase64) {
      return NextResponse.json(
        { error: 'Please provide a screenshot. URL-based capture coming soon.' },
        { status: 400 }
      );
    }

    // Analysis prompts for different types
    const analysisPrompts: Record<string, string> = {
      full: `Analyze this website landing page screenshot and provide a comprehensive redesign assessment.

**HERO SECTION:**
- Headline clarity and emotional impact (1-10 score)
- Value proposition strength
- CTA button effectiveness and visibility
- Visual hierarchy assessment

**VISUAL DESIGN:**
- Color scheme harmony and accessibility
- Typography choices and readability
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
Prioritized list with specific, actionable changes.

**OVERALL SCORE:** X/100

Be brutally honest - this is for internal optimization only.`,

      hero: `Focus ONLY on the hero/above-the-fold section:
1. Headline effectiveness (1-10)
2. Subheadline clarity
3. CTA button analysis (color, text, placement)
4. Background treatment
5. Specific improvement recommendations`,

      conversion: `Analyze ONLY conversion elements:
1. All CTA buttons (primary/secondary)
2. Form fields and friction
3. Trust indicators
4. Urgency/scarcity elements
5. Specific A/B test recommendations`,

      visual: `Analyze ONLY visual design:
1. Color palette assessment
2. Typography hierarchy
3. Imagery usage
4. Spacing and layout
5. Specific design improvements`,
    };

    // Call Gemini 3 Pro via OpenRouter (best vision model)
    const visionResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://greenline365.com',
        'X-Title': 'GreenLine365 Website Analyzer',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro-preview', // Gemini 3 Pro - best vision
        messages: [
          {
            role: 'system',
            content: 'You are an expert UI/UX designer and CRO specialist. Analyze websites with brutal honesty for internal optimization. Be specific and actionable.'
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: analysisPrompts[analysisType] || analysisPrompts.full },
              { 
                type: 'image_url', 
                image_url: { 
                  url: `data:image/jpeg;base64,${imageData}`,
                  detail: 'high'
                } 
              }
            ]
          }
        ],
        max_tokens: 4096,
        temperature: 0.3,
      }),
    });

    if (!visionResponse.ok) {
      const error = await visionResponse.text();
      console.error('[Website Analyzer] Vision API error:', error);
      return NextResponse.json(
        { error: 'Vision analysis failed', details: error },
        { status: visionResponse.status }
      );
    }

    const visionData = await visionResponse.json();
    const geminiAnalysis = visionData.choices?.[0]?.message?.content || '';

    // Get additional creative suggestions from Claude 4.5 Sonnet
    const claudeResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://greenline365.com',
        'X-Title': 'GreenLine365 Website Analyzer',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-opus-4.6', // Claude Opus 4.6 - best for complex website analysis
        messages: [
          {
            role: 'system',
            content: `You are a creative marketing strategist. Generate fresh, innovative ideas. Apply proven CRO frameworks and marketing psychology.${getSkillContext('page-cro')}${getSkillContext('marketing-psychology')}`
          },
          {
            role: 'user',
            content: `Based on this website analysis, suggest 5 CREATIVE and UNCONVENTIONAL improvements that could dramatically increase conversions:

${geminiAnalysis}

Focus on:
- Unexpected design elements that grab attention
- Psychology-based persuasion techniques
- Modern trends in SaaS landing pages
- Micro-interactions and animations
- Copy improvements with specific text suggestions

Be creative and specific!`
          }
        ],
        max_tokens: 2048,
        temperature: 0.7,
      }),
    });

    let claudeSuggestions = '';
    if (claudeResponse.ok) {
      const claudeData = await claudeResponse.json();
      claudeSuggestions = claudeData.choices?.[0]?.message?.content || '';
    }

    return NextResponse.json({
      success: true,
      analysis: {
        gemini3ProAnalysis: geminiAnalysis,
        claudeCreativeSuggestions: claudeSuggestions,
        analysisType,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error: any) {
    console.error('[Website Analyzer] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Analysis failed' },
      { status: 500 }
    );
  }
}
