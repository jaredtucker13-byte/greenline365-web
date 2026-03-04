import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';

/**
 * URL Screenshot Capture API
 * Uses multiple fallback services for reliability
 */

interface CaptureRequest {
  url: string;
  fullPage?: boolean;
  width?: number;
  height?: number;
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const body: CaptureRequest = await request.json();
    const { url, fullPage = false, width = 1920, height = 1080 } = body;

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Validate and normalize URL
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = 'https://' + normalizedUrl;
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(normalizedUrl);
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    // SSRF protection: only allow http/https and block internal networks
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return NextResponse.json({ error: 'Only HTTP/HTTPS URLs are allowed' }, { status: 400 });
    }
    const hostname = parsedUrl.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1' || hostname.startsWith('10.') || hostname.startsWith('192.168.') || hostname.startsWith('172.') || hostname.endsWith('.internal')) {
      return NextResponse.json({ error: 'Internal URLs are not allowed' }, { status: 400 });
    }


    // Try multiple screenshot services in order of reliability
    let screenshotBase64: string | null = null;
    let lastError: string = '';

    // Service 1: Microlink API (free tier)
    try {
      const microlinkUrl = `https://api.microlink.io/?url=${encodeURIComponent(normalizedUrl)}&screenshot=true&meta=false&embed=screenshot.url&viewport.width=${width}&viewport.height=${height}${fullPage ? '&screenshot.fullPage=true' : ''}`;
      
      const response = await fetch(microlinkUrl, {
        headers: { 'Accept': 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.status === 'success' && data.data?.screenshot?.url) {
          const imageResponse = await fetch(data.data.screenshot.url);
          if (imageResponse.ok) {
            const imageBuffer = await imageResponse.arrayBuffer();
            screenshotBase64 = Buffer.from(imageBuffer).toString('base64');
          }
        }
      }
    } catch (e: any) {
      lastError = e.message;
    }

    // Service 2: Screenshot Machine (free tier)
    if (!screenshotBase64) {
      try {
        // Using a public screenshot service
        const screenshotMachineUrl = `https://api.screenshotmachine.com?key=guest&url=${encodeURIComponent(normalizedUrl)}&dimension=${width}x${height}&format=png`;
        
        const response = await fetch(screenshotMachineUrl);
        if (response.ok && response.headers.get('content-type')?.includes('image')) {
          const imageBuffer = await response.arrayBuffer();
          screenshotBase64 = Buffer.from(imageBuffer).toString('base64');
        }
      } catch (e: any) {
        lastError = e.message;
      }
    }

    // Service 3: thum.io (free tier)
    if (!screenshotBase64) {
      try {
        const thumUrl = `https://image.thum.io/get/width/${width}/crop/${height}/noanimate/${normalizedUrl}`;
        
        const response = await fetch(thumUrl);
        if (response.ok && response.headers.get('content-type')?.includes('image')) {
          const imageBuffer = await response.arrayBuffer();
          screenshotBase64 = Buffer.from(imageBuffer).toString('base64');
        }
      } catch (e: any) {
        lastError = e.message;
      }
    }

    // Service 4: Urlbox-style URL (public endpoint)
    if (!screenshotBase64) {
      try {
        const apiflashUrl = `https://api.apiflash.com/v1/urltoimage?access_key=demo&url=${encodeURIComponent(normalizedUrl)}&width=${width}&height=${height}&format=png`;
        
        const response = await fetch(apiflashUrl);
        if (response.ok && response.headers.get('content-type')?.includes('image')) {
          const imageBuffer = await response.arrayBuffer();
          screenshotBase64 = Buffer.from(imageBuffer).toString('base64');
        }
      } catch (e: any) {
        lastError = e.message;
      }
    }

    if (!screenshotBase64) {
      return NextResponse.json({
        success: false,
        error: 'Free screenshot services are currently unavailable.',
        suggestion: '📸 Please take a screenshot manually:\n• Mac: Cmd+Shift+4\n• Windows: Win+Shift+S\n• Then upload the image directly',
        manualRequired: true,
      }, { status: 503 });
    }

    return NextResponse.json({
      success: true,
      screenshot: screenshotBase64,
      url: normalizedUrl,
    });

  } catch (error: any) {
    console.error('[Screenshot] Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Screenshot capture failed',
      suggestion: 'Please take a screenshot manually and upload it instead.',
    }, { status: 500 });
  }
}
