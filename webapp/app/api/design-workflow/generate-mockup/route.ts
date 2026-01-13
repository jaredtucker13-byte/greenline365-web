import { NextRequest, NextResponse } from 'next/server';

/**
 * Generate Mockup API
 * Uses KIE.ai Nano Banana Pro for high-quality website mockup generation
 * 
 * Pricing (as of Jan 2026):
 * - 1K/2K Resolution: 18 credits (~$0.09 per image)
 * - 4K Resolution: 24 credits (~$0.12 per image)
 */

interface MockupRequest {
  designSpec: any;
  analysisText: string;
  aspectRatio?: string;
  resolution?: '1K' | '2K' | '4K';
}

const KIE_API_KEY = process.env.KIE_API_KEY;
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
    
    // Use GET method with taskId as query parameter
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

export async function POST(request: NextRequest) {
  try {
    const body: MockupRequest = await request.json();
    const { analysisText, aspectRatio = '16:9', resolution = '2K' } = body;

    if (!analysisText) {
      return NextResponse.json({ error: 'Analysis text required' }, { status: 400 });
    }

    if (!KIE_API_KEY) {
      return NextResponse.json({ error: 'KIE API key not configured' }, { status: 500 });
    }

    // Create a detailed prompt for mockup generation
    const imagePrompt = `Professional website hero section mockup for a modern business landing page. 
Clean minimal design with:
- Bold headline text prominently displayed
- Clear subheadline explaining the value proposition
- Prominent call-to-action button with contrasting color
- Professional color scheme (dark theme preferred)
- Modern gradient or solid background
- Desktop view, ${aspectRatio} aspect ratio
- High-quality photorealistic render
- Clean typography with good hierarchy
Style: Modern SaaS landing page, professional, conversion-optimized`;

    console.log('[Generate Mockup] Creating task with KIE.ai Nano Banana Pro');

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
    });

  } catch (error: any) {
    console.error('[Generate Mockup] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Mockup generation failed' },
      { status: 500 }
    );
  }
}
