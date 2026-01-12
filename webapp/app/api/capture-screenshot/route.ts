import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

const execAsync = promisify(exec);

interface CaptureRequest {
  url: string;
}

export async function POST(request: NextRequest) {
  const tempFiles: string[] = [];
  
  try {
    const body: CaptureRequest = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    // Create temp Python script for screenshot
    const scriptPath = join(tmpdir(), `screenshot_${Date.now()}.py`);
    tempFiles.push(scriptPath);
    
    const outputPath = join(tmpdir(), `screenshot_${Date.now()}.png`);
    tempFiles.push(outputPath);

    const pythonCode = `
import asyncio
import json
import sys
import base64

async def capture():
    from playwright.async_api import async_playwright
    
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={'width': 1920, 'height': 1080})
        
        try:
            await page.goto('${url.replace(/'/g, "\\'")}', wait_until='networkidle', timeout=30000)
            await page.screenshot(path='${outputPath}', full_page=True, quality=30)
            
            # Read and encode
            with open('${outputPath}', 'rb') as f:
                screenshot_bytes = f.read()
                screenshot_base64 = base64.b64encode(screenshot_bytes).decode('utf-8')
            
            print(json.dumps({'success': True, 'screenshot': screenshot_base64}))
        except Exception as e:
            print(json.dumps({'success': False, 'error': str(e)}), file=sys.stderr)
            sys.exit(1)
        finally:
            await browser.close()

try:
    asyncio.run(capture())
except Exception as e:
    print(json.dumps({'success': False, 'error': str(e)}), file=sys.stderr)
    sys.exit(1)
`;

    await writeFile(scriptPath, pythonCode);

    const { stdout, stderr } = await execAsync(`/root/.venv/bin/python3 ${scriptPath}`, {
      timeout: 60000,
      maxBuffer: 50 * 1024 * 1024,
    });

    // Cleanup
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
    
    console.error('[Capture Screenshot] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Screenshot capture failed' },
      { status: 500 }
    );
  }
}
