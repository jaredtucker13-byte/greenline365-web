import { NextRequest, NextResponse } from 'next/server';

/**
 * Nano Banana Pro Image Generation API
 * Uses KIE.ai API for high-quality image generation
 */

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

async function pollForResult(taskId: string, maxAttempts = 30): Promise<string | null> {
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
      // Return the image URL
      const imageUrl = statusData.data.output?.imageUrl || statusData.data.output?.images?.[0];
      if (imageUrl) return imageUrl;
    } else if (statusData.data?.status === 'failed') {
      throw new Error('Image generation failed');
    }
    // Continue polling if still processing
  }
  
  throw new Error('Image generation timed out');
}

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    if (!KIE_API_KEY) {
      console.error('[Nano Banana] KIE_API_KEY not configured');
      return NextResponse.json({ error: 'KIE API key not configured' }, { status: 500 });
    }

    console.log('[Nano Banana] Generating image with prompt:', prompt.slice(0, 100) + '...');

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
          prompt,
        },
      }),
    });

    if (!createTaskResponse.ok) {
      const errorText = await createTaskResponse.text();
      console.error('[Nano Banana] Task creation failed:', errorText);
      return NextResponse.json(
        { error: 'Failed to create image generation task', details: errorText },
        { status: 500 }
      );
    }

    const taskData: KieTaskResponse = await createTaskResponse.json();
    
    if (taskData.code !== 0 && taskData.code !== 200) {
      console.error('[Nano Banana] Task creation error:', taskData.msg);
      return NextResponse.json(
        { error: taskData.msg || 'Task creation failed' },
        { status: 500 }
      );
    }

    const taskId = taskData.data?.taskId;
    if (!taskId) {
      return NextResponse.json(
        { error: 'No task ID received from KIE.ai' },
        { status: 500 }
      );
    }

    console.log('[Nano Banana] Task created:', taskId);

    // Poll for result
    const imageUrl = await pollForResult(taskId);

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'No image URL in response' },
        { status: 500 }
      );
    }

    // Fetch the image and convert to base64
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      // Return the URL directly if we can't fetch it
      return NextResponse.json({
        success: true,
        imageUrl,
        mime_type: 'image/png',
      });
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');

    return NextResponse.json({
      success: true,
      image: base64Image,
      imageUrl,
      mime_type: 'image/png',
    });

  } catch (error: any) {
    console.error('[Nano Banana] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Generation failed' },
      { status: 500 }
    );
  }
}
