import { NextRequest, NextResponse } from 'next/server';
import { chromium } from 'playwright';

interface CaptureRequest {
  url: string;
}

export async function POST(request: NextRequest) {
  let browser = null;
  
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

    // Launch browser and capture screenshot
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage({
      viewport: { width: 1920, height: 1080 }
    });
    
    await page.goto(url, { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // Take screenshot as buffer
    const screenshotBuffer = await page.screenshot({
      fullPage: true,
      type: 'png'
    });
    
    await browser.close();
    browser = null;
    
    // Convert to base64
    const screenshotBase64 = screenshotBuffer.toString('base64');
    
    return NextResponse.json({
      success: true,
      screenshot: screenshotBase64
    });

  } catch (error: any) {
    console.error('[Capture Screenshot] Error:', error);
    
    if (browser) {
      try {
        await browser.close();
      } catch (e) {
        // Ignore close errors
      }
    }
    
    return NextResponse.json(
      { success: false, error: error.message || 'Screenshot capture failed' },
      { status: 500 }
    );
  }
}
