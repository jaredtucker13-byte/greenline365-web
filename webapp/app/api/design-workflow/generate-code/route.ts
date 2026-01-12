import { NextRequest, NextResponse } from 'next/server';

/**
 * Design Workflow - Step 3: Generate Code
 * Uses Claude Opus 4.5 to generate production-ready React/Tailwind code
 * Based on the approved design spec
 */

interface CodeGenRequest {
  designSpec: any;
  analysisText: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: CodeGenRequest = await request.json();
    const { designSpec, analysisText } = body;

    if (!analysisText) {
      return NextResponse.json(
        { error: 'Design specification required' },
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

    // Create code generation prompt
    const codePrompt = `You are a senior React developer. Generate production-ready code based on this design specification:

${analysisText}

Generate a complete React component using:
- TypeScript (if complex) or JavaScript
- Tailwind CSS for all styling
- Modern Next.js 14+ conventions
- Framer Motion for animations (optional but nice)
- Responsive design (mobile-first)

REQUIREMENTS:
1. Create ONE complete, copy-paste-ready component
2. Include the full hero section
3. Use the exact colors specified (HEX codes)
4. Match the typography recommendations
5. Include CTA buttons with hover effects
6. Make it responsive
7. Add subtle animations
8. Use semantic HTML

OUTPUT FORMAT:
Provide ONLY the code, no explanations. Start with the component definition.

Example structure:
\`\`\`tsx
'use client';

import { motion } from 'framer-motion';

export default function HeroSection() {
  return (
    <section className="...">
      {/* Code here */}
    </section>
  );
}
\`\`\`

Generate the code now:`;

    // Use Emergent Integrations with Claude Opus 4.5
    const { LlmChat, UserMessage } = await import('emergentintegrations/llm/chat');
    
    const chat = LlmChat({
      apiKey: emergentKey,
      sessionId: `codegen-${Date.now()}`,
      systemMessage: 'You are a senior React developer who writes clean, production-ready code. Output ONLY code, no explanations.',
    });

    // Use Claude Opus 4.5 (best for code generation)
    chat.with_model('anthropic', 'claude-opus-4-5-20251101');

    const message = UserMessage({ text: codePrompt });
    const generatedCode = await chat.send_message(message);

    // Clean up code (remove markdown formatting if present)
    let cleanCode = generatedCode.trim();
    
    // Remove markdown code fences if present
    if (cleanCode.startsWith('```')) {
      cleanCode = cleanCode.replace(/^```(?:tsx|typescript|jsx|javascript)?\\n/, '');
      cleanCode = cleanCode.replace(/\\n```$/, '');
    }

    return NextResponse.json({
      success: true,
      code: cleanCode,
    });

  } catch (error: any) {
    console.error('[Design Workflow - Generate Code] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Code generation failed' },
      { status: 500 }
    );
  }
}
