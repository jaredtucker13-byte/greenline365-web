import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

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

    const emergentKey = process.env.EMERGENT_LLM_KEY || 'sk-emergent-c87DeA8638fD64f7d3';

    const codePrompt = `Generate React/Tailwind hero component. Responsive, modern, with CTA buttons.`;

    const pythonCode = `
import asyncio, json, sys, re
async def main():
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    chat = LlmChat(api_key='${emergentKey}', session_id='codegen-${Date.now()}', system_message='Senior React developer. Output ONLY code.')
    chat.with_model('anthropic', 'claude-opus-4-5-20251101')
    message = UserMessage(text='''${codePrompt.replace(/'/g, "\\'")}''')
    result = await chat.send_message(message)
    code = result.strip()
    if code.startswith('\`\`\`'):
        code = re.sub(r'^\`\`\`(?:tsx|typescript|jsx|javascript)?\\n', '', code)
        code = re.sub(r'\\n\`\`\`$', '', code)
    print(json.dumps({'success': True, 'code': code}))
try:
    asyncio.run(main())
except Exception as e:
    print(json.dumps({'success': False, 'error': str(e)}), file=sys.stderr)
    sys.exit(1)
`;

    const { stdout, stderr } = await execAsync(
      `cd /app/webapp && /root/.venv/bin/python3 -c ${JSON.stringify(pythonCode)}`,
      {
        timeout: 90000,
        maxBuffer: 10 * 1024 * 1024,
      }
    );

    if (stderr && !stdout) {
      return NextResponse.json({ success: false, error: stderr }, { status: 500 });
    }

    const result = JSON.parse(stdout);
    return NextResponse.json(result);

  } catch (error: any) {
    console.error('[Generate Code] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Code generation failed' },
      { status: 500 }
    );
  }
}
