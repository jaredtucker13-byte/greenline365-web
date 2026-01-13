import { NextRequest, NextResponse } from 'next/server';

interface CodeGenRequest {
  designSpec: any;
  analysisText: string;
}

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const body: CodeGenRequest = await request.json();
    const { analysisText } = body;

    if (!analysisText) {
      return NextResponse.json({ error: 'Design specification required' }, { status: 400 });
    }

    if (!OPENROUTER_API_KEY) {
      return NextResponse.json({ error: 'OpenRouter API key not configured' }, { status: 500 });
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

    // Using Claude 4.5 Sonnet for code generation via OpenRouter
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://greenline365.com',
        'X-Title': 'GreenLine365 Code Generator',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-sonnet-4', // Claude 4.5 Sonnet - best for code
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
        temperature: 0.2, // Lower temperature for more consistent code
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[Generate Code] OpenRouter error:', errorData);
      return NextResponse.json(
        { success: false, error: errorData.error?.message || 'Code generation failed' },
        { status: 500 }
      );
    }

    const data = await response.json();
    let code = data.choices?.[0]?.message?.content || '';

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
