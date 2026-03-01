/**
 * Email Engine — Vision Analysis
 * POST /api/email-engine/vision
 *
 * Accepts { imageUrls[], context }
 * Calls Gemini 2.0 Flash via OpenRouter (google/gemini-2.0-flash-001)
 * Fallback: GPT-4o vision
 * Returns structured visual analysis report
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { callWithFallback } from '@/app/admin-v2/email-engine/lib/openrouter-client';

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const { imageUrls, context } = await request.json();

    if (!imageUrls || imageUrls.length === 0) {
      return NextResponse.json({ error: 'At least one imageUrl is required' }, { status: 400 });
    }

    if (imageUrls.length > 10) {
      return NextResponse.json({ error: 'Maximum 10 images allowed' }, { status: 400 });
    }

    // Build multimodal content array
    const contentParts: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
      {
        type: 'text',
        text: `Analyze these images in the context of composing a professional email. ${context || ''}\n\nProvide your analysis in this format:\n\nANALYSIS: (overall description of what you see)\n\nFINDINGS:\n- (finding 1)\n- (finding 2)\n\nRECOMMENDATIONS:\n- (recommendation for how to reference these in the email)`,
      },
    ];

    for (const url of imageUrls) {
      contentParts.push({ type: 'image_url', image_url: { url } });
    }

    const result = await callWithFallback({
      task: 'vision',
      messages: [
        {
          role: 'system',
          content: 'You are a visual analysis assistant for GreenLine365. Analyze images and provide actionable insights for email composition. Be concise and professional.',
        },
        {
          role: 'user',
          content: contentParts,
        },
      ],
      temperature: 0.4,
      maxTokens: 1500,
    });

    // Parse structured response
    const lines = result.content.split('\n');
    let analysis = '';
    const findings: string[] = [];
    const recommendations: string[] = [];
    let section = '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('ANALYSIS:')) {
        section = 'analysis';
        analysis = trimmed.replace('ANALYSIS:', '').trim();
      } else if (trimmed.startsWith('FINDINGS:')) {
        section = 'findings';
      } else if (trimmed.startsWith('RECOMMENDATIONS:')) {
        section = 'recommendations';
      } else if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
        const val = trimmed.replace(/^[-•]\s*/, '');
        if (section === 'findings') findings.push(val);
        if (section === 'recommendations') recommendations.push(val);
      } else if (section === 'analysis' && trimmed) {
        analysis += ' ' + trimmed;
      }
    }

    return NextResponse.json({
      analysis: analysis || result.content.slice(0, 500),
      findings: findings.length > 0 ? findings : [],
      recommendations: recommendations.length > 0 ? recommendations : [],
      model: result.model,
      wasFallback: result.wasFallback,
    });
  } catch (error: any) {
    console.error('[Email Engine Vision] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
