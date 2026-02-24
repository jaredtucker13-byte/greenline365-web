import { NextRequest, NextResponse } from 'next/server';
import { callOpenRouter } from '@/lib/openrouter';

interface CodeGenRequest {
  designSpec: any;
  analysisText: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: CodeGenRequest = await request.json();
    const { analysisText } = body;

    if (!analysisText) {
      return NextResponse.json({ error: 'Design specification required' }, { status: 400 });
    }

    const codePrompt = `Based on the following design analysis, generate a complete, production-ready React component using Tailwind CSS.

DESIGN ANALYSIS:
${analysisText}

Requirements:
- Create a modern, responsive hero section component
- Use Tailwind CSS for all styling
- Include proper TypeScript types
- Add smooth hover animations
- Include a primary CTA button and secondary action
- Make it mobile-responsive
- Use semantic HTML
- Include accessibility attributes (aria-labels, etc.)

Output ONLY the code, no explanations. Start with the import statements.`;

    const result = await callOpenRouter({
      model: 'anthropic/claude-opus-4.6',
      messages: [
        {
          role: 'system',
          content: 'You are a senior React developer specializing in modern web development. Output ONLY clean, production-ready code without any explanations or markdown code blocks.',
        },
        {
          role: 'user',
          content: codePrompt,
        },
      ],
      max_tokens: 8192,
      temperature: 0.2,
      caller: 'GL365 Code Generator',
    });

    let code = result.content || '';

    // Clean up code if wrapped in markdown code blocks
    code = code.trim();
    if (code.startsWith('```')) {
      code = code.replace(/^```(?:tsx|typescript|jsx|javascript)?\n/, '');
      code = code.replace(/\n```$/, '');
    }

    return NextResponse.json({
      success: true,
      code,
    });

  } catch (error: any) {
    console.error('[Generate Code] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Code generation failed' },
      { status: 500 }
    );
  }
}
