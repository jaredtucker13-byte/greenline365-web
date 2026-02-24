import { NextRequest, NextResponse } from 'next/server';
import { getSkillContext, getCoreMarketingContext } from '@/lib/marketing-skills-loader';
import { HTML_FORMAT_DIRECTIVE } from '@/lib/format-standards';
import { callOpenRouter } from '@/lib/openrouter';

// Website Analyzer API - Premium Feature
// Uses Gemini for vision analysis and Claude Opus 4.6 for suggestions

interface AnalysisRequest {
  url?: string;
  imageBase64?: string;
  analysisType?: 'full' | 'hero' | 'conversion' | 'visual';
}

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

    let imageData = imageBase64;
    if (url && !imageBase64) {
      return NextResponse.json(
        { error: 'Please provide a screenshot. URL-based capture coming soon.' },
        { status: 400 }
      );
    }

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

    // Step 1: Vision analysis with Gemini
    const { content: geminiAnalysis } = await callOpenRouter({
      model: 'google/gemini-2.5-pro-preview',
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
      caller: 'GL365 Website Analyzer (Vision)',
    });

    // Step 2: Creative suggestions with Claude Opus 4.6
    let claudeSuggestions = '';
    try {
      const { content } = await callOpenRouter({
        model: 'anthropic/claude-opus-4.6',
        messages: [
          {
            role: 'system',
            content: `You are a creative marketing strategist. Generate fresh, innovative ideas. Apply proven CRO frameworks and marketing psychology.${HTML_FORMAT_DIRECTIVE}${getSkillContext('page-cro')}${getSkillContext('marketing-psychology')}${getCoreMarketingContext()}`
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
        caller: 'GL365 Website Analyzer (Creative)',
      });
      claudeSuggestions = content;
    } catch (e) {
      console.warn('[Website Analyzer] Creative suggestions failed:', e);
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
