import { NextRequest, NextResponse } from 'next/server';

/**
 * Generate Mockup API - Context-Aware
 * Uses KIE.ai Nano Banana Pro for high-quality mockup generation
 * 
 * The mockup is generated based on:
 * 1. The AI analysis of the original image (what type of page it is)
 * 2. User-specified generation mode (recreate, redesign, or landing page)
 * 3. Optional ingredients (brand colors, style preferences, etc.)
 * 
 * Pricing (as of Jan 2026):
 * - 1K/2K Resolution: 18 credits (~$0.09 per image)
 * - 4K Resolution: 24 credits (~$0.12 per image)
 */

interface MockupRequest {
  designSpec?: any;
  analysisText: string;
  mode?: 'recreate' | 'redesign' | 'landing_page' | 'custom';
  pageType?: string; // e.g., 'calendar', 'dashboard', 'settings', 'landing', etc.
  aspectRatio?: string;
  resolution?: '1K' | '2K' | '4K';
  // Ingredients for customization
  ingredients?: {
    brandColors?: string[];
    logo?: string;
    heroText?: string;
    sections?: string[];
    targetAudience?: string;
    style?: string;
  };
  customPrompt?: string;
}

const KIE_API_KEY = process.env.KIE_API_KEY || '1f1d2d3eed99f294339cb1f17b5bc743';
const KIE_CREATE_TASK_URL = 'https://api.kie.ai/api/v1/jobs/createTask';
const KIE_QUERY_STATUS_URL = 'https://api.kie.ai/api/v1/jobs/recordInfo';

interface KieCreateTaskResponse {
  code: number;
  msg: string;
  data: {
    taskId: string;
  };
}

interface KieQueryStatusResponse {
  code: number;
  msg: string;
  data: {
    taskId: string;
    state: 'waiting' | 'success' | 'fail';
    resultJson: string | null;
    failMsg: string | null;
    costTime: number | null;
  };
}

async function pollForResult(taskId: string, maxAttempts = 60): Promise<{ imageUrl: string; costTime?: number } | null> {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const statusResponse = await fetch(`${KIE_QUERY_STATUS_URL}?taskId=${taskId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${KIE_API_KEY}`,
      },
    });

    if (!statusResponse.ok) continue;

    const statusData: KieQueryStatusResponse = await statusResponse.json();
    
    if (statusData.data?.state === 'success' && statusData.data?.resultJson) {
      try {
        const result = JSON.parse(statusData.data.resultJson);
        const imageUrl = result.resultUrls?.[0];
        if (imageUrl) {
          return { imageUrl, costTime: statusData.data.costTime || undefined };
        }
      } catch {
        // Continue polling
      }
    } else if (statusData.data?.state === 'fail') {
      throw new Error(statusData.data.failMsg || 'Mockup generation failed');
    }
  }
  
  throw new Error('Mockup generation timed out');
}

/**
 * Detect the type of page from the analysis text
 */
function detectPageType(analysisText: string): string {
  const text = analysisText.toLowerCase();
  
  // Check for specific page types
  if (text.includes('calendar') || text.includes('schedule') || text.includes('event')) {
    return 'calendar';
  }
  if (text.includes('dashboard') || text.includes('analytics') || text.includes('metrics') || text.includes('chart')) {
    return 'dashboard';
  }
  if (text.includes('settings') || text.includes('preferences') || text.includes('configuration')) {
    return 'settings';
  }
  if (text.includes('profile') || text.includes('account') || text.includes('user info')) {
    return 'profile';
  }
  if (text.includes('checkout') || text.includes('payment') || text.includes('cart')) {
    return 'checkout';
  }
  if (text.includes('login') || text.includes('sign in') || text.includes('authentication')) {
    return 'login';
  }
  if (text.includes('blog') || text.includes('article') || text.includes('post')) {
    return 'blog';
  }
  if (text.includes('pricing') || text.includes('plan') || text.includes('subscription')) {
    return 'pricing';
  }
  if (text.includes('contact') || text.includes('form') || text.includes('inquiry')) {
    return 'contact';
  }
  if (text.includes('gallery') || text.includes('portfolio') || text.includes('showcase')) {
    return 'gallery';
  }
  if (text.includes('about') || text.includes('team') || text.includes('company')) {
    return 'about';
  }
  if (text.includes('landing') || text.includes('hero') || text.includes('cta') || text.includes('conversion')) {
    return 'landing';
  }
  
  // Default to the detected content
  return 'page';
}

/**
 * Generate a context-aware prompt based on the page type and mode
 */
function generatePrompt(
  pageType: string,
  mode: string,
  analysisText: string,
  ingredients?: MockupRequest['ingredients'],
  aspectRatio?: string
): string {
  const styleNotes = ingredients?.style || 'modern, clean, professional';
  const colorNotes = ingredients?.brandColors?.length 
    ? `Brand colors: ${ingredients.brandColors.join(', ')}` 
    : 'Professional color scheme';
  const audienceNotes = ingredients?.targetAudience || 'modern business users';

  // Base prompt structure
  let prompt = '';

  if (mode === 'recreate') {
    // Recreate the exact page type with improved design
    prompt = `Professional ${pageType} page mockup. Recreate and improve upon this design:

${analysisText.slice(0, 500)}

Requirements:
- Maintain the same page type: ${pageType}
- Keep the core functionality and layout structure
- Apply modern design improvements
- ${colorNotes}
- Style: ${styleNotes}
- Target audience: ${audienceNotes}
- ${aspectRatio ? `Aspect ratio: ${aspectRatio}` : 'Desktop view'}
- High-quality photorealistic UI render
- Clean typography with proper hierarchy`;

  } else if (mode === 'redesign') {
    // Redesign with more creative freedom but same page type
    prompt = `Completely redesigned ${pageType} page mockup. Transform this design:

Key insights from original:
${analysisText.slice(0, 400)}

Requirements:
- Same page type (${pageType}) but fresh, innovative design
- Modern 2025 design trends
- ${colorNotes}
- Style: ${styleNotes}
- Target audience: ${audienceNotes}
- ${aspectRatio ? `Aspect ratio: ${aspectRatio}` : 'Desktop view'}
- High-quality photorealistic UI render
- Bold, creative approach while maintaining usability`;

  } else if (mode === 'landing_page') {
    // Convert to landing page (the original behavior)
    prompt = `Professional website landing page mockup for a modern business.

Inspired by analysis:
${analysisText.slice(0, 300)}

Requirements:
- Bold headline text prominently displayed
- Clear value proposition subheadline
- Prominent call-to-action button
- ${colorNotes}
- Modern gradient or solid background
- ${aspectRatio ? `Aspect ratio: ${aspectRatio}` : 'Desktop view, 16:9'}
- High-quality photorealistic render
- Style: ${styleNotes}
- Conversion-optimized layout`;

  } else {
    // Custom or default - intelligent recreation
    prompt = `Professional ${pageType} UI mockup based on this analysis:

${analysisText.slice(0, 500)}

Requirements:
- Accurately represent a ${pageType} interface
- Modern, polished design
- ${colorNotes}
- Style: ${styleNotes}
- ${aspectRatio ? `Aspect ratio: ${aspectRatio}` : 'Desktop view'}
- High-quality photorealistic UI render
- Clean, professional appearance`;
  }

  // Add sections if specified
  if (ingredients?.sections?.length) {
    prompt += `\n\nInclude these sections: ${ingredients.sections.join(', ')}`;
  }

  // Add hero text if specified
  if (ingredients?.heroText) {
    prompt += `\n\nMain headline: "${ingredients.heroText}"`;
  }

  return prompt;
}

export async function POST(request: NextRequest) {
  try {
    const body: MockupRequest = await request.json();
    const { 
      analysisText, 
      mode = 'recreate',  // Default to recreate (context-aware)
      pageType: userPageType,
      aspectRatio = '16:9', 
      resolution = '2K',
      ingredients,
      customPrompt
    } = body;

    if (!analysisText && !customPrompt) {
      return NextResponse.json({ error: 'Analysis text or custom prompt required' }, { status: 400 });
    }

    if (!KIE_API_KEY) {
      return NextResponse.json({ error: 'KIE API key not configured' }, { status: 500 });
    }

    // Detect page type from analysis if not specified
    const pageType = userPageType || detectPageType(analysisText || '');
    
    // Generate the appropriate prompt
    const imagePrompt = customPrompt || generatePrompt(
      pageType,
      mode,
      analysisText,
      ingredients,
      aspectRatio
    );

    console.log(`[Generate Mockup] Mode: ${mode}, Page Type: ${pageType}`);
    console.log('[Generate Mockup] Prompt:', imagePrompt.slice(0, 200) + '...');

    // Create task with KIE.ai Nano Banana Pro
    const createTaskResponse = await fetch(KIE_CREATE_TASK_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${KIE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'nano-banana-pro',
        input: {
          prompt: imagePrompt,
          image_input: [],
          aspect_ratio: aspectRatio,
          resolution: resolution,
          output_format: 'png',
        },
      }),
    });

    if (!createTaskResponse.ok) {
      const errorText = await createTaskResponse.text();
      console.error('[Generate Mockup] Task creation failed:', errorText);
      
      if (createTaskResponse.status === 401) {
        return NextResponse.json({ success: false, error: 'KIE.ai authentication failed' }, { status: 500 });
      }
      if (createTaskResponse.status === 402) {
        return NextResponse.json({ success: false, error: 'KIE.ai insufficient balance' }, { status: 500 });
      }
      
      return NextResponse.json(
        { success: false, error: 'Failed to create mockup generation task' },
        { status: 500 }
      );
    }

    const taskData: KieCreateTaskResponse = await createTaskResponse.json();
    
    if (taskData.code !== 200) {
      console.error('[Generate Mockup] Task creation error:', taskData.msg);
      return NextResponse.json(
        { success: false, error: taskData.msg || 'Task creation failed' },
        { status: 500 }
      );
    }

    const taskId = taskData.data?.taskId;
    if (!taskId) {
      return NextResponse.json(
        { success: false, error: 'No task ID received' },
        { status: 500 }
      );
    }

    console.log('[Generate Mockup] Task created:', taskId);

    // Poll for result
    const result = await pollForResult(taskId);

    if (!result?.imageUrl) {
      return NextResponse.json(
        { success: false, error: 'No image URL in response' },
        { status: 500 }
      );
    }

    console.log('[Generate Mockup] Mockup generated successfully');

    // Calculate estimated cost
    const estimatedCost = resolution === '4K' ? 0.12 : 0.09;

    return NextResponse.json({
      success: true,
      mockupImageUrl: result.imageUrl,
      costTime: result.costTime,
      estimatedCost,
      resolution,
      pageType,
      mode,
      promptUsed: imagePrompt.slice(0, 200) + '...',
    });

  } catch (error: any) {
    console.error('[Generate Mockup] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Mockup generation failed' },
      { status: 500 }
    );
  }
}
