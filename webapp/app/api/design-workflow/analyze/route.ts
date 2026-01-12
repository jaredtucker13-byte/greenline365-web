import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

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

    // Timeout after 2 minutes
    setTimeout(() => {
      pythonProcess.kill();
      reject(new Error('Script timeout'));
    }, 120000);
  });
}

export async function POST(request: NextRequest) {
  let tempImagePath: string | null = null;

  try {
    const body: AnalyzeRequest = await request.json();
    const { mode } = body;

    if (!mode) {
      return NextResponse.json({ error: 'Mode is required' }, { status: 400 });
    }

    const emergentKey = process.env.EMERGENT_LLM_KEY || 'sk-emergent-c87DeA8638fD64f7d3';
    
    if (mode === 'analyze') {
      const { imageBase64, visionModel = 'gemini-3-pro', analysisType = 'full' } = body;

      if (!imageBase64) {
        return NextResponse.json({ error: 'Screenshot required' }, { status: 400 });
      }

      // Write the base64 image to a temp file to avoid E2BIG error
      const tempDir = '/tmp/website-analyzer';
      await mkdir(tempDir, { recursive: true });
      tempImagePath = join(tempDir, `${randomUUID()}.txt`);
      await writeFile(tempImagePath, imageBase64, 'utf-8');

      const modelMap: Record<string, [string, string]> = {
        'gemini-3-pro': ['gemini', 'gemini-2.5-pro'],
        'gemini-2.0-pro': ['gemini', 'gemini-2.5-pro'],
        'gpt-4o': ['openai', 'gpt-4o'],
      };

      const [provider, modelId] = modelMap[visionModel] || modelMap['gemini-3-pro'];

      const prompts: Record<string, string> = {
        full: `Analyze this website landing page comprehensively. Provide:
1. HERO SECTION - headline effectiveness (score 1-10), value proposition clarity, CTA effectiveness
2. VISUAL DESIGN - color scheme with exact HEX codes, typography choices, spacing and layout
3. TOP 5 IMPROVEMENTS - specific actionable changes with HEX color codes where applicable
4. OVERALL SCORE X/100 with reasoning`,
        hero: 'Focus on hero section only: headline, CTA, colors (HEX codes), background treatment.',
        conversion: 'Analyze conversion elements: CTAs, forms, trust indicators, friction points.',
        visual: 'Analyze visual design: colors (HEX codes), typography, spacing, layout balance.',
      };

      const prompt = prompts[analysisType] || prompts.full;

      const pythonScript = `
import asyncio
import json
import sys

async def main():
    from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent
    
    # Read image from temp file
    with open('${tempImagePath}', 'r') as f:
        image_base64 = f.read()
    
    chat = LlmChat(
        api_key='${emergentKey}',
        session_id='vision-analysis',
        system_message='You are an expert UI/UX designer and web development consultant. Analyze websites thoroughly and provide actionable insights.'
    )
    chat.with_model('${provider}', '${modelId}')
    
    message = UserMessage(
        text='''${prompt.replace(/'/g, "\\'")}''',
        file_contents=[ImageContent(image_base64=image_base64)]
    )
    
    result = await chat.send_message(message)
    print(json.dumps({
        'success': True,
        'analysisText': result,
        'designSpec': {'visionModel': '${visionModel}', 'analysisType': '${analysisType}'}
    }))

try:
    asyncio.run(main())
except Exception as e:
    print(json.dumps({'success': False, 'error': str(e)}))
    sys.exit(1)
`;

      const { stdout, stderr } = await runPythonScript(pythonScript);
      
      // Clean up temp file
      if (tempImagePath) {
        try {
          await unlink(tempImagePath);
        } catch (e) {
          // Ignore cleanup errors
        }
      }

      if (!stdout) {
        return NextResponse.json({ success: false, error: stderr || 'No response from analysis' }, { status: 500 });
      }

      const result = JSON.parse(stdout);
      return NextResponse.json(result);

    } else {
      // Scratch mode - text only
      const { description, brandColors, stylePreference, targetAudience } = body;

      if (!description) {
        return NextResponse.json({ error: 'Description required' }, { status: 400 });
      }

      const designPrompt = `Create a detailed design specification for this website:

DESCRIPTION: ${description}
${brandColors ? `BRAND COLORS: ${brandColors}` : ''}
${stylePreference ? `STYLE PREFERENCE: ${stylePreference}` : ''}
${targetAudience ? `TARGET AUDIENCE: ${targetAudience}` : ''}

Please provide:
1. HERO SECTION - headline, subheadline, CTA text and styling
2. COLOR PALETTE - primary, secondary, accent colors with HEX codes
3. TYPOGRAPHY - recommended Google Fonts for headings and body
4. LAYOUT STRUCTURE - sections and their order
5. KEY SECTIONS - what to include and why
6. CONVERSION ELEMENTS - CTAs, forms, trust indicators`;

      const pythonScript = `
import asyncio
import json
import sys

async def main():
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    
    chat = LlmChat(
        api_key='${emergentKey}',
        session_id='scratch-design',
        system_message='You are a world-class web designer who creates stunning, conversion-optimized websites.'
    )
    chat.with_model('anthropic', 'claude-sonnet-4-5-20250929')
    
    message = UserMessage(text='''${designPrompt.replace(/'/g, "\\'")}''')
    result = await chat.send_message(message)
    
    print(json.dumps({
        'success': True,
        'analysisText': result,
        'designSpec': {'mode': 'scratch'}
    }))

try:
    asyncio.run(main())
except Exception as e:
    print(json.dumps({'success': False, 'error': str(e)}))
    sys.exit(1)
`;

      const { stdout, stderr } = await runPythonScript(pythonScript);

      if (!stdout) {
        return NextResponse.json({ success: false, error: stderr || 'No response from design generation' }, { status: 500 });
      }

      const result = JSON.parse(stdout);
      return NextResponse.json(result);
    }

  } catch (error: any) {
    console.error('[Analyze] Error:', error);
    
    // Clean up temp file on error
    if (tempImagePath) {
      try {
        await unlink(tempImagePath);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
    
    return NextResponse.json(
      { success: false, error: error.message || 'Analysis failed' },
      { status: 500 }
    );
  }
}
