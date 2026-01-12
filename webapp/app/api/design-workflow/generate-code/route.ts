import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

const execAsync = promisify(exec);

interface CodeGenRequest {
  designSpec: any;
  analysisText: string;
}

export async function POST(request: NextRequest) {
  const tempFiles: string[] = [];
  
  try {
    const body: CodeGenRequest = await request.json();
    const { analysisText } = body;

    if (!analysisText) {
      return NextResponse.json({ error: 'Design specification required' }, { status: 400 });
    }

    const emergentKey = process.env.EMERGENT_LLM_KEY || 'sk-emergent-c87DeA8638fD64f7d3';

    const codePrompt = `Generate React/Tailwind hero component. Responsive, modern, with CTA buttons.`;

    const scriptPath = join(tmpdir(), `codegen_${Date.now()}.py`);
    tempFiles.push(scriptPath);

    const pythonCode = `
import asyncio
import json
import sys
import re

async def main():
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    
    chat = LlmChat(
        api_key='${emergentKey}',
        session_id='codegen-${Date.now()}',
        system_message='Senior React developer. Output ONLY code.'
    )
    
    chat.with_model('anthropic', 'claude-opus-4-5-20251101')
    
    message = UserMessage(text='''${codePrompt}''')
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

    await writeFile(scriptPath, pythonCode);

    const { stdout, stderr } = await execAsync(`cd /app/webapp && python3 ${scriptPath}`, {
      timeout: 90000,
      maxBuffer: 10 * 1024 * 1024,
    });

    for (const file of tempFiles) {
      try { await unlink(file); } catch {}
    }

    if (stderr && !stdout) {
      return NextResponse.json({ success: false, error: stderr }, { status: 500 });
    }

    const result = JSON.parse(stdout);
    return NextResponse.json(result);

  } catch (error: any) {
    for (const file of tempFiles) {
      try { await unlink(file); } catch {}
    }
    
    console.error('[Generate Code] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Code generation failed' },
      { status: 500 }
    );
  }
}
