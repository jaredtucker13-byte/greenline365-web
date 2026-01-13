import { NextRequest, NextResponse } from 'next/server';

/**
 * Nano Banana Pro Image Generation API
 * Uses KIE.ai API for high-quality image generation
 * 
 * Pricing (as of Jan 2026):
 * - 1K/2K Resolution: 18 credits (~$0.09 per image)
 * - 4K Resolution: 24 credits (~$0.12 per image)
 */

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
    model: string;
    state: 'waiting' | 'success' | 'fail';
    param: string;
    resultJson: string | null;
    failCode: string | null;
    failMsg: string | null;
    costTime: number | null;
    completeTime: number | null;
    createTime: number;
  };
}

interface ResultJson {
  resultUrls?: string[];
}

async function pollForResult(taskId: string, maxAttempts = 60): Promise<{ imageUrl: string; costTime?: number } | null> {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds between polls
    
    // Use GET method with taskId as query parameter
    const statusResponse = await fetch(`${KIE_QUERY_STATUS_URL}?taskId=${taskId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${KIE_API_KEY}`,
      },
    });

    if (!statusResponse.ok) {
      console.error('[Nano Banana] Status check failed:', statusResponse.status);
      continue;
    }

    const statusData: KieQueryStatusResponse = await statusResponse.json();
    console.log(`[Nano Banana] Poll ${i + 1}/${maxAttempts} - State: ${statusData.data?.state}`);
    
    if (statusData.data?.state === 'success' && statusData.data?.resultJson) {
      try {
        const result: ResultJson = JSON.parse(statusData.data.resultJson);
        const imageUrl = result.resultUrls?.[0];
        if (imageUrl) {
          return { 
            imageUrl, 
            costTime: statusData.data.costTime || undefined 
          };
        }
      } catch (parseError) {
        console.error('[Nano Banana] Failed to parse resultJson:', parseError);
      }
    } else if (statusData.data?.state === 'fail') {
      console.error('[Nano Banana] Task failed:', statusData.data.failMsg);
      throw new Error(statusData.data.failMsg || 'Image generation failed');
    }
    // Continue polling if still 'waiting'
  }
  
  throw new Error('Image generation timed out after 2 minutes');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      prompt, 
      aspectRatio = '1:1',
      resolution = '1K',
      outputFormat = 'png',
      imageInput = []
    } = body;

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    if (!KIE_API_KEY) {
      console.error('[Nano Banana] KIE_API_KEY not configured');
      return NextResponse.json({ error: 'KIE API key not configured' }, { status: 500 });
    }

    console.log('[Nano Banana] Creating task with prompt:', prompt.slice(0, 100) + '...');
    console.log('[Nano Banana] Settings:', { aspectRatio, resolution, outputFormat });

    // Create task with KIE.ai Nano Banana Pro
    // Following exact API structure from documentation
    const createTaskResponse = await fetch(KIE_CREATE_TASK_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${KIE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'nano-banana-pro',
        input: {
          prompt,
          image_input: imageInput,
          aspect_ratio: aspectRatio,
          resolution: resolution,
          output_format: outputFormat,
        },
      }),
    });

    if (!createTaskResponse.ok) {
      const errorText = await createTaskResponse.text();
      console.error('[Nano Banana] Task creation failed:', createTaskResponse.status, errorText);
      
      // Handle specific error codes
      if (createTaskResponse.status === 401) {
        return NextResponse.json({ error: 'KIE.ai authentication failed - check API key' }, { status: 500 });
      }
      if (createTaskResponse.status === 402) {
        return NextResponse.json({ error: 'KIE.ai account balance insufficient' }, { status: 500 });
      }
      
      return NextResponse.json(
        { error: 'Failed to create image generation task', details: errorText },
        { status: 500 }
      );
    }

    const taskData: KieCreateTaskResponse = await createTaskResponse.json();
    
    if (taskData.code !== 200) {
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
    const result = await pollForResult(taskId);

    if (!result?.imageUrl) {
      return NextResponse.json(
        { error: 'No image URL in response' },
        { status: 500 }
      );
    }

    console.log('[Nano Banana] Image generated successfully');

    // Calculate estimated cost based on resolution
    const estimatedCost = resolution === '4K' ? 0.12 : 0.09;

    // Fetch the image and convert to base64
    const imageResponse = await fetch(result.imageUrl);
    if (!imageResponse.ok) {
      // Return the URL directly if we can't fetch it
      return NextResponse.json({
        success: true,
        imageUrl: result.imageUrl,
        mime_type: `image/${outputFormat}`,
        costTime: result.costTime,
        estimatedCost,
        resolution,
      });
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');

    return NextResponse.json({
      success: true,
      image: base64Image,
      imageUrl: result.imageUrl,
      mime_type: `image/${outputFormat}`,
      costTime: result.costTime,
      estimatedCost,
      resolution,
    });

  } catch (error: any) {
    console.error('[Nano Banana] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Generation failed' },
      { status: 500 }
    );
  }
}
