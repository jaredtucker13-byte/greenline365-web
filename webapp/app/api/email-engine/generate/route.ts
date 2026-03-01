/**
 * Email Engine — Writer's Room / Draft Generator
 * POST /api/email-engine/generate
 *
 * Accepts { context, research, visionReport, description, contentSnippets, blogContent }
 * Calls Claude Sonnet 4 via OpenRouter (primary)
 * Fallback: GPT-4o via OpenAI direct
 * Includes review pass with a second prompt for tone/grammar
 * Returns { originalDraft, enhancedDraft, subjectLine }
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { callWithFallback } from '@/app/admin-v2/email-engine/lib/openrouter-client';

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const { context, research, visionReport, description, contentSnippets, blogContent } = await request.json();

    if (!description && !context) {
      return NextResponse.json({ error: 'At least description or context is required' }, { status: 400 });
    }

    // Build comprehensive prompt
    let prompt = `Write a professional email for GreenLine365 (Florida's Gold Standard Business Directory).\n\n`;

    if (description) {
      prompt += `OPERATOR'S DESCRIPTION:\n${description}\n\n`;
    }

    if (context) {
      prompt += `RECIPIENT CONTEXT:\n`;
      prompt += `Name: ${context.name || 'N/A'}\n`;
      prompt += `Email: ${context.email || 'N/A'}\n`;
      prompt += `Company: ${context.company || 'N/A'}\n`;
      if (context.items?.length) {
        for (const item of context.items) {
          if (item.value && item.id !== 'email' && item.id !== 'name') {
            prompt += `${item.label}: ${item.value}\n`;
          }
        }
      }
      prompt += '\n';
    }

    if (research) {
      prompt += `RESEARCH FINDINGS:\n${research.summary || ''}\n`;
      if (research.keyPoints?.length) {
        prompt += research.keyPoints.map((p: string) => `- ${p}`).join('\n') + '\n';
      }
      prompt += '\n';
    }

    if (visionReport) {
      prompt += `VISUAL ANALYSIS:\n${visionReport.analysis || ''}\n`;
      if (visionReport.findings?.length) {
        prompt += visionReport.findings.map((f: string) => `- ${f}`).join('\n') + '\n';
      }
      prompt += '\n';
    }

    if (contentSnippets?.length) {
      prompt += `CONTENT SNIPPETS TO INCORPORATE:\n`;
      for (const snippet of contentSnippets) {
        prompt += `- [${snippet.source}]: ${snippet.content}\n`;
      }
      prompt += '\n';
    }

    if (blogContent) {
      prompt += `BLOG REFERENCE:\nURL: ${blogContent.url}\nTitle: ${blogContent.title || 'N/A'}\nSummary: ${blogContent.summary || 'N/A'}\n\n`;
    }

    prompt += `Generate the email body (no HTML, just plain text for the body content) and a compelling subject line.\n\nFormat your response as:\nSUBJECT: (subject line)\n\nBODY:\n(email body text)`;

    // PASS 1: Generate draft
    const draftResult = await callWithFallback({
      task: 'generate',
      messages: [
        {
          role: 'system',
          content: 'You are an expert email copywriter for GreenLine365, a premium Florida business directory. Write warm, professional, concise emails. Use a conversational yet authoritative tone. Keep emails under 200 words. Do not use excessive exclamation marks or sales-y language.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      maxTokens: 1500,
    });

    // Parse draft
    let subjectLine = '';
    let originalDraft = '';
    const draftLines = draftResult.content.split('\n');
    let inBody = false;

    for (const line of draftLines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('SUBJECT:')) {
        subjectLine = trimmed.replace('SUBJECT:', '').trim();
      } else if (trimmed.startsWith('BODY:')) {
        inBody = true;
      } else if (inBody) {
        originalDraft += line + '\n';
      }
    }

    originalDraft = originalDraft.trim();
    if (!originalDraft) originalDraft = draftResult.content;
    if (!subjectLine) subjectLine = 'GreenLine365 Update';

    // PASS 2: Review & enhance for tone/grammar
    const reviewResult = await callWithFallback({
      task: 'review',
      messages: [
        {
          role: 'system',
          content: 'You are an editorial reviewer. Review the email for tone, grammar, clarity, and professionalism. Fix any issues and return the improved version. Keep the same structure and intent. Format your response as:\n\nENHANCED:\n(improved email text)\n\nNOTES:\n- (review note 1)\n- (review note 2)',
        },
        {
          role: 'user',
          content: `Review and enhance this email draft:\n\nSubject: ${subjectLine}\n\n${originalDraft}`,
        },
      ],
      temperature: 0.3,
      maxTokens: 1500,
    });

    // Parse review
    let enhancedDraft = '';
    const reviewNotes: string[] = [];
    let reviewSection = '';

    for (const line of reviewResult.content.split('\n')) {
      const trimmed = line.trim();
      if (trimmed.startsWith('ENHANCED:')) {
        reviewSection = 'enhanced';
      } else if (trimmed.startsWith('NOTES:')) {
        reviewSection = 'notes';
      } else if (trimmed.startsWith('- ') && reviewSection === 'notes') {
        reviewNotes.push(trimmed.replace(/^-\s*/, ''));
      } else if (reviewSection === 'enhanced') {
        enhancedDraft += line + '\n';
      }
    }

    enhancedDraft = enhancedDraft.trim();
    if (!enhancedDraft) enhancedDraft = originalDraft;

    return NextResponse.json({
      originalDraft,
      enhancedDraft,
      subjectLine,
      model: draftResult.model,
      wasFallback: draftResult.wasFallback,
      reviewNotes,
    });
  } catch (error: any) {
    console.error('[Email Engine Generate] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
