/**
 * Email Engine — Intelligence / Research
 * POST /api/email-engine/research
 *
 * Accepts { topic, tenantContext }
 * Calls Perplexity via OpenRouter (perplexity/sonar-pro)
 * Fallback: GPT-4o with web search
 * 3 retry attempts before fallback
 * Returns research findings
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { callWithFallback } from '@/app/admin-v2/email-engine/lib/openrouter-client';

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const { topic, tenantContext } = await request.json();

    if (!topic) {
      return NextResponse.json({ error: 'topic is required' }, { status: 400 });
    }

    const contextSummary = tenantContext
      ? `Tenant: ${tenantContext.name} (${tenantContext.email}). Company: ${tenantContext.company || 'N/A'}. Notes: ${tenantContext.items?.find((i: any) => i.id === 'notes')?.value || 'None'}.`
      : '';

    const result = await callWithFallback({
      task: 'research',
      messages: [
        {
          role: 'system',
          content: `You are a research assistant for GreenLine365, a Florida business directory and property management platform. Provide concise, actionable research findings. Format your response as:

SUMMARY: (2-3 sentence overview)

KEY POINTS:
- (bullet point 1)
- (bullet point 2)
- (etc.)

SOURCES:
- (source 1)
- (source 2)`,
        },
        {
          role: 'user',
          content: `Research the following topic for an email we're composing:\n\nTopic: ${topic}\n\n${contextSummary ? `Context: ${contextSummary}` : ''}\n\nProvide relevant findings that can help craft a compelling, personalized email.`,
        },
      ],
      temperature: 0.5,
      maxTokens: 1500,
    });

    // Parse structured response
    const lines = result.content.split('\n');
    let summary = '';
    const keyPoints: string[] = [];
    const sources: string[] = [];
    let section = '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('SUMMARY:')) {
        section = 'summary';
        summary = trimmed.replace('SUMMARY:', '').trim();
      } else if (trimmed.startsWith('KEY POINTS:')) {
        section = 'points';
      } else if (trimmed.startsWith('SOURCES:')) {
        section = 'sources';
      } else if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
        const val = trimmed.replace(/^[-•]\s*/, '');
        if (section === 'points') keyPoints.push(val);
        if (section === 'sources') sources.push(val);
      } else if (section === 'summary' && trimmed) {
        summary += ' ' + trimmed;
      }
    }

    return NextResponse.json({
      summary: summary || result.content.slice(0, 300),
      keyPoints: keyPoints.length > 0 ? keyPoints : [result.content],
      sources,
      rawResponse: result.content,
      model: result.model,
      wasFallback: result.wasFallback,
    });
  } catch (error: any) {
    console.error('[Email Engine Research] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
