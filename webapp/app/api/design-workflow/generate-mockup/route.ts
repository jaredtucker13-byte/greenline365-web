import { NextRequest, NextResponse } from 'next/server';

/**
 * Generate Mockup API
 * Uses KIE.ai Nano Banana Pro for high-quality website mockup generation
 */

interface MockupRequest {
  designSpec: any;
  analysisText: string;
}

const KIE_API_KEY = process.env.KIE_API_KEY;
const KIE_API_URL = 'https://api.kie.ai/api/v1/jobs/createTask';
const KIE_TASK_STATUS_URL = 'https://api.kie.ai/api/v1/jobs/getTaskInfo';

interface KieTaskResponse {
  code: number;
  msg: string;
  data: {
    taskId: string;
  };
}

interface KieTaskStatusResponse {
  code: number;
  msg: string;
  data: {
    status: string;
    output?: {
      imageUrl?: string;
      images?: string[];
    };
  };
}

async function pollForResult(taskId: string, maxAttempts = 45): Promise<string | null> {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds between polls
    
    const statusResponse = await fetch(KIE_TASK_STATUS_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${KIE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ taskId }),
    });

    if (!statusResponse.ok) continue;

    const statusData: KieTaskStatusResponse = await statusResponse.json();
    
    if (statusData.data?.status === 'completed' || statusData.data?.status === 'success') {
      const imageUrl = statusData.data.output?.imageUrl || statusData.data.output?.images?.[0];
      if (imageUrl) return imageUrl;
    } else if (statusData.data?.status === 'failed') {
      throw new Error('Mockup generation failed');
    }
  }
  
  throw new Error('Mockup generation timed out');
}

export async function POST(request: NextRequest) {
  try {
    const body: MockupRequest = await request.json();
    const { analysisText } = body;

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
- Desktop view, 16:9 aspect ratio
- High-quality photorealistic render
- Clean typography with good hierarchy
Style: Modern SaaS landing page, professional, conversion-optimized`;

    console.log('[Generate Mockup] Creating task with KIE.ai Nano Banana Pro');

    // Create task with KIE.ai Nano Banana Pro
    const createTaskResponse = await fetch(KIE_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${KIE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'nano-banana-pro',
        input: {
          prompt: imagePrompt,
        },
      }),
    });

    if (!createTaskResponse.ok) {
      const errorText = await createTaskResponse.text();
      console.error('[Generate Mockup] Task creation failed:', errorText);
      return NextResponse.json(
        { success: false, error: 'Failed to create mockup generation task' },
        { status: 500 }
      );
    }

    const taskData: KieTaskResponse = await createTaskResponse.json();
    
    if (taskData.code !== 0 && taskData.code !== 200) {
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
    const imageUrl = await pollForResult(taskId);

    if (!imageUrl) {
      return NextResponse.json(
        { success: false, error: 'No image URL in response' },
        { status: 500 }
      );
    }

    console.log('[Generate Mockup] Mockup generated successfully');

    return NextResponse.json({
      success: true,
      mockupImageUrl: imageUrl,
    });

  } catch (error: any) {
    console.error('[Generate Mockup] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Mockup generation failed' },
      { status: 500 }
    );
  }
}
