import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

const execAsync = promisify(exec);

interface MockupRequest {
  designSpec: any;
  analysisText: string;
}

export async function POST(request: NextRequest) {
  const tempFiles: string[] = [];
  
  try {
    const body: MockupRequest = await request.json();
    const { analysisText } = body;

    if (!analysisText) {
      return NextResponse.json({ error: 'Analysis text required' }, { status: 400 });
    }

    const emergentKey = process.env.EMERGENT_LLM_KEY || 'sk-emergent-c87DeA8638fD64f7d3';

    const imagePrompt = `Create professional website hero mockup. Modern clean design with headline, subheadline, CTA button. Desktop view.`;

    const scriptPath = join(tmpdir(), `mockup_${Date.now()}.py`);
    tempFiles.push(scriptPath);

    const pythonCode = `
import asyncio
import json
import sys

async def main():
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    
    chat = LlmChat(
        api_key='${emergentKey}',
        session_id='mockup-${Date.now()}',
        system_message='Professional web design mockup generator.'
    )
    
    chat.with_model('gemini', 'gemini-3-pro-image-preview').with_params(modalities=['image', 'text'])
    
    message = UserMessage(text='''${imagePrompt}''')
    text, images = await chat.send_message_multimodal_response(message)
    
    if images and len(images) > 0:
        img = images[0]
        img_url = f"data:{img['mime_type']};base64,{img['data']}"
        print(json.dumps({'success': True, 'mockupImageUrl': img_url}))
    else:
        print(json.dumps({'success': False, 'error': 'No image generated'}))

try:
    asyncio.run(main())
except Exception as e:
    print(json.dumps({'success': False, 'error': str(e)}), file=sys.stderr)
    sys.exit(1)
`;

    await writeFile(scriptPath, pythonCode);

    const { stdout, stderr } = await execAsync(`cd /app/webapp && python3 ${scriptPath}`, {
      timeout: 90000,
      maxBuffer: 50 * 1024 * 1024,
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
    
    console.error('[Generate Mockup] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Mockup generation failed' },
      { status: 500 }
    );
  }
}
