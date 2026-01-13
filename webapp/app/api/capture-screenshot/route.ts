import { NextRequest, NextResponse } from 'next/server';

interface CaptureRequest {
  url: string;
}

// Use a free screenshot API service since Playwright doesn't work in Vercel serverless
const SCREENSHOT_API = 'https://api.screenshotone.com/take';

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

    // Method 1: Try using a public screenshot service
    // We'll use a free tier approach - fetch the page and create a simple capture
    
    // For production, you'd use services like:
    // - ScreenshotOne API
    // - Microlink API  
    // - ScrapingBee
    // - Puppeteer deployed on a separate serverless function with browser support
    
    // Free alternative: Use microlink.io which has a free tier
    const screenshotUrl = `https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true&meta=false&embed=screenshot.url`;
    
    const response = await fetch(screenshotUrl, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Screenshot service returned ${response.status}`);
    }

    const data = await response.json();
    
    if (data.status !== 'success' || !data.data?.screenshot?.url) {
      throw new Error('Screenshot service failed to capture the page');
    }

    // Fetch the actual screenshot image
    const imageUrl = data.data.screenshot.url;
    const imageResponse = await fetch(imageUrl);
    
    if (!imageResponse.ok) {
      throw new Error('Failed to fetch screenshot image');
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const screenshotBase64 = Buffer.from(imageBuffer).toString('base64');

    return NextResponse.json({
      success: true,
      screenshot: screenshotBase64,
    });

  } catch (error: any) {
    console.error('[Capture Screenshot] Error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Screenshot capture failed. Try uploading a screenshot manually instead.' 
      },
      { status: 500 }
    );
  }
}
