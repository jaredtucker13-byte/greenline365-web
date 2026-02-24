import { NextRequest, NextResponse } from 'next/server';
import { callOpenRouter } from '@/lib/openrouter';
import { requireAuth } from '@/lib/auth/middleware';

/**
 * Blog Voice Transcription API (requires authentication)
 * Uses OpenRouter GPT-4o Audio for speech-to-text
 */

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;

  try {
    const body = await request.json();
    const { audio } = body;

    if (!audio) {
      return NextResponse.json({ error: 'Audio data is required' }, { status: 400 });
    }

    console.log('[Transcribe] Starting transcription with GPT-4o Audio...');

    // Use GPT-4o Audio Preview via OpenRouter for transcription
    const { content: transcribedText } = await callOpenRouter({
      model: 'openai/gpt-4o-audio-preview',
      messages: [
        {
          role: 'system',
          content: 'You are a transcription assistant. Transcribe the audio accurately. Return ONLY the transcribed text, nothing else. Do not add any commentary or formatting.',
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Please transcribe this audio recording accurately:',
            },
            {
              type: 'input_audio',
              input_audio: {
                data: audio,
                format: 'webm',
              },
            },
          ],
        },
      ],
      temperature: 0.2,
      max_tokens: 2000,
      caller: 'blog-transcribe',
    });

    if (!transcribedText) {
      return NextResponse.json(
        { error: 'No transcription generated' },
        { status: 500 }
      );
    }

    console.log('[Transcribe] Success, text length:', transcribedText.length);

    return NextResponse.json({
      success: true,
      text: transcribedText.trim(),
    });

  } catch (error: any) {
    console.error('[Transcribe] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Transcription failed' },
      { status: 500 }
    );
  }
}
