import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface CaptureRequest {
  url: string;
}

export async function POST(request: NextRequest) {
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

    // Use Python inline script to capture screenshot
    const pythonScript = `
import asyncio
import json
import sys
import base64
from playwright.async_api import async_playwright

async def capture():
    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch()
            page = await browser.new_page(viewport={'width': 1920, 'height': 1080})
            await page.goto('${url.replace(/'/g, "\\'")}', wait_until='networkidle', timeout=30000)
            screenshot_bytes = await page.screenshot(full_page=True, quality=30)
            await browser.close()
            
            screenshot_base64 = base64.b64encode(screenshot_bytes).decode('utf-8')
            print(json.dumps({'success': True, 'screenshot': screenshot_base64}))
    except Exception as e:
        print(json.dumps({'success': False, 'error': str(e)}), file=sys.stderr)
        sys.exit(1)

asyncio.run(capture())
`;

    const { stdout, stderr } = await execAsync(
      `/root/.venv/bin/python3 -c ${JSON.stringify(pythonScript)}`,
      {
        timeout: 60000,
        maxBuffer: 50 * 1024 * 1024,
      }
    );

    if (stderr && !stdout) {
      return NextResponse.json({ success: false, error: stderr }, { status: 500 });
    }

    const result = JSON.parse(stdout);
    return NextResponse.json(result);

  } catch (error: any) {
    console.error('[Capture Screenshot] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Screenshot capture failed' },
      { status: 500 }
    );
  }
}
