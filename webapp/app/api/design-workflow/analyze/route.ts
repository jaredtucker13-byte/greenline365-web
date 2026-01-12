import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

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
  try {
    const body: AnalyzeRequest = await request.json();
    const { mode } = body;

    if (!mode) {
      return NextResponse.json({ error: 'Mode is required' }, { status: 400 });
    }

    const emergentKey = process.env.EMERGENT_LLM_KEY || 'sk-emergent-c87DeA8638fD64f7d3';
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
        full: 'Analyze this website landing page. Provide: HERO SECTION (headline score 1-10, value prop, CTA effectiveness), VISUAL DESIGN (color scheme with HEX codes, typography, spacing), TOP 5 IMPROVEMENTS (specific actionable changes with HEX codes), OVERALL SCORE X/100',
        hero: 'Focus on hero section: headline, CTA, colors (HEX), background.',
        conversion: 'Analyze conversion: CTAs, forms, trust indicators.',
        visual: 'Analyze design: colors (HEX), typography, spacing.',
      };

      pythonCode = `
import asyncio, json, sys
async def main():
    from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent
    chat = LlmChat(api_key='${emergentKey}', session_id='vision-${Date.now()}', system_message='Expert UI/UX designer.')
    chat.with_model('${provider}', '${modelId}')
    message = UserMessage(text='''${(prompts[analysisType] || prompts.full).replace(/'/g, "\\'")}''', file_contents=[ImageContent(image_base64='${imageBase64}')])
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

      const designPrompt = `Create design specification: ${description} ${brandColors || ''} ${stylePreference || ''}. Include: HERO SECTION (headline, subheadline, CTA), COLOR PALETTE (HEX codes), TYPOGRAPHY (Google Fonts), LAYOUT, KEY SECTIONS, CONVERSION ELEMENTS.`;

      pythonCode = `
import asyncio, json, sys
async def main():
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    chat = LlmChat(api_key='${emergentKey}', session_id='scratch-${Date.now()}', system_message='World-class web designer.')
    chat.with_model('anthropic', 'claude-opus-4-5-20251101')
    message = UserMessage(text='''${designPrompt.replace(/'/g, "\\'")}''')
    result = await chat.send_message(message)
    print(json.dumps({'success': True, 'analysisText': result, 'designSpec': {'mode': 'scratch'}}))
try:
    asyncio.run(main())
except Exception as e:
    print(json.dumps({'success': False, 'error': str(e)}), file=sys.stderr)
    sys.exit(1)
`;
    }

    const { stdout, stderr } = await execAsync(
      `/root/.venv/bin/python3 -c ${JSON.stringify(pythonCode)}`,
      {
        timeout: 120000,
        maxBuffer: 10 * 1024 * 1024,
      }
    );

    if (stderr && !stdout) {
      return NextResponse.json({ success: false, error: stderr }, { status: 500 });
    }

    const result = JSON.parse(stdout);
    return NextResponse.json(result);

  } catch (error: any) {
    console.error('[Analyze] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Analysis failed' },
      { status: 500 }
    );
  }
}
