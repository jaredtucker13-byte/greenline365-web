import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';

interface MockupRequest {
  designSpec: any;
  analysisText: string;
}

async function runPythonScript(scriptContent: string): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn('/root/.venv/bin/python3', ['-c', scriptContent], {
      cwd: '/app/webapp',
      env: { ...globalThis.process.env },
    });

    let stdout = '';
    let stderr = '';

    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code === 0 || stdout) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(stderr || `Process exited with code ${code}`));
      }
    });

    pythonProcess.on('error', (err) => {
      reject(err);
    });

    // Timeout after 90 seconds for image generation
    setTimeout(() => {
      pythonProcess.kill();
      reject(new Error('Script timeout'));
    }, 90000);
  });
}

export async function POST(request: NextRequest) {
  try {
    const body: MockupRequest = await request.json();
    const { analysisText } = body;

    if (!analysisText) {
      return NextResponse.json({ error: 'Analysis text required' }, { status: 400 });
    }

    const emergentKey = process.env.EMERGENT_LLM_KEY || 'sk-emergent-c87DeA8638fD64f7d3';

    // Create a concise prompt for image generation
    const imagePrompt = `Professional website hero section mockup for a modern business landing page. 
Clean minimal design with:
- Bold headline text
- Subheadline
- Call-to-action button
- Professional color scheme
Desktop view, 16:9 aspect ratio, photorealistic render.`;

    const pythonScript = `
import asyncio
import json
import sys

async def main():
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    
    chat = LlmChat(
        api_key='${emergentKey}',
        session_id='mockup-gen',
        system_message='You are a professional web design mockup generator.'
    )
    chat.with_model('gemini', 'gemini-2.5-flash-image-preview')
    chat.with_params(modalities=['image', 'text'])
    
    message = UserMessage(text='''${imagePrompt.replace(/'/g, "\\'")}''')
    
    try:
        text, images = await chat.send_message_multimodal_response(message)
        
        if images and len(images) > 0:
            img = images[0]
            img_url = f"data:{img['mime_type']};base64,{img['data']}"
            print(json.dumps({'success': True, 'mockupImageUrl': img_url}))
        else:
            print(json.dumps({'success': False, 'error': 'No image generated'}))
    except Exception as e:
        print(json.dumps({'success': False, 'error': str(e)}))
        sys.exit(1)

try:
    asyncio.run(main())
except Exception as e:
    print(json.dumps({'success': False, 'error': str(e)}))
    sys.exit(1)
`;

    const { stdout, stderr } = await runPythonScript(pythonScript);

    if (!stdout) {
      return NextResponse.json({ success: false, error: stderr || 'No response from mockup generation' }, { status: 500 });
    }

    const result = JSON.parse(stdout);
    return NextResponse.json(result);

  } catch (error: any) {
    console.error('[Generate Mockup] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Mockup generation failed' },
      { status: 500 }
    );
  }
}
