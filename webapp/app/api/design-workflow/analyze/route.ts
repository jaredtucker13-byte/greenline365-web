import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

const execAsync = promisify(exec);

interface AnalyzeRequest {
  mode: 'analyze' | 'scratch';
  imageBase64?: string;
  visionModel?: 'gemini-3-pro' | 'gemini-2.0-pro' | 'gpt-4o';
  analysisType?: 'full' | 'hero' | 'conversion' | 'visual';
  description?: string;
  brandColors?: string;
  stylePreference?: string;
  targetAudience?: string;
}

export async function POST(request: NextRequest) {
  const tempFiles: string[] = [];
  
  try {
    const body: AnalyzeRequest = await request.json();
    const { mode } = body;

    if (!mode) {
      return NextResponse.json({ error: 'Mode is required' }, { status: 400 });
    }

    const emergentKey = process.env.EMERGENT_LLM_KEY || 'sk-emergent-c87DeA8638fD64f7d3';
    
    const scriptPath = join(tmpdir(), `analyze_${Date.now()}.py`);
    tempFiles.push(scriptPath);

    let pythonCode = '';

    if (mode === 'analyze') {
      const { imageBase64, visionModel = 'gemini-3-pro', analysisType = 'full' } = body;

      if (!imageBase64) {
        return NextResponse.json({ error: 'Screenshot required' }, { status: 400 });
      }

      const modelMap: Record<string, [string, string]> = {
        'gemini-3-pro': ['gemini', 'gemini-3-pro-image-preview'],
        'gemini-2.0-pro': ['gemini', 'gemini-2.5-pro'],
        'gpt-4o': ['openai', 'gpt-4o'],
      };

      const [provider, modelId] = modelMap[visionModel] || modelMap['gemini-3-pro'];

      const prompts: Record<string, string> = {
        full: `Analyze this website landing page and provide comprehensive redesign assessment.\n\n**HERO SECTION:**\nHeadline clarity (1-10), value prop, CTA effectiveness\n\n**VISUAL DESIGN:**\nColor scheme (HEX codes), typography, spacing\n\n**TOP 5 IMPROVEMENTS:**\nSpecific, actionable changes.\n\n**SCORE:** X/100`,
        hero: `Focus on hero: headline, CTA, colors (HEX), background.`,
        conversion: `Analyze conversion: CTAs, forms, trust indicators.`,
        visual: `Analyze design: colors (HEX), typography, spacing.`,
      };

      pythonCode = `
import asyncio
import json
import sys

async def main():
    from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent
    
    chat = LlmChat(
        api_key='${emergentKey}',
        session_id='vision-${Date.now()}',
        system_message='You are an expert UI/UX designer.'
    )
    
    chat.with_model('${provider}', '${modelId}')
    
    message = UserMessage(
        text='''${(prompts[analysisType] || prompts.full)}''',
        file_contents=[ImageContent(image_base64='${imageBase64}')]
    )
    
    result = await chat.send_message(message)
    print(json.dumps({'success': True, 'analysisText': result, 'designSpec': {'visionModel': '${visionModel}'}}))

try:
    asyncio.run(main())
except Exception as e:
    print(json.dumps({'success': False, 'error': str(e)}), file=sys.stderr)
    sys.exit(1)
`;
    } else {
      const { description, brandColors, stylePreference, targetAudience } = body;

      if (!description) {
        return NextResponse.json({ error: 'Description required' }, { status: 400 });
      }

      const designPrompt = `Create design specification: ${description} ${brandColors || ''} ${stylePreference || ''}`;

      pythonCode = `
import asyncio
import json
import sys

async def main():
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    
    chat = LlmChat(
        api_key='${emergentKey}',
        session_id='scratch-${Date.now()}',
        system_message='You are a world-class web designer.'
    )
    
    chat.with_model('anthropic', 'claude-opus-4-5-20251101')
    
    message = UserMessage(text='''${designPrompt}''')
    result = await chat.send_message(message)
    
    print(json.dumps({'success': True, 'analysisText': result, 'designSpec': {'mode': 'scratch'}}))

try:
    asyncio.run(main())
except Exception as e:
    print(json.dumps({'success': False, 'error': str(e)}), file=sys.stderr)
    sys.exit(1)
`;
    }

    await writeFile(scriptPath, pythonCode);

    const { stdout, stderr } = await execAsync(`cd /app/webapp && python3 ${scriptPath}`, {
      timeout: 120000,
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
    
    console.error('[Analyze] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Analysis failed' },
      { status: 500 }
    );
  }
}
