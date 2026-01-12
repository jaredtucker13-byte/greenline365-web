import { NextRequest, NextResponse } from 'next/server';

/**
 * Blog Voice Transcription API
 * Uses OpenRouter GPT-4o Audio for speech-to-text
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { audio } = body;

    if (!audio) {
      return NextResponse.json({ error: 'Audio data is required' }, { status: 400 });
    }

    console.log('[Transcribe] Starting transcription with GPT-4o Audio...');

    // Use GPT-4o Audio Preview via OpenRouter for transcription
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://greenline365.com',
        'X-Title': 'GreenLine365 Voice Transcription',
      },
      body: JSON.stringify({
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
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Transcribe] OpenRouter error:', errorText);
      return NextResponse.json(
        { error: 'Transcription service error' },
        { status: 500 }
      );
    }

    const data = await response.json();
    const transcribedText = data.choices?.[0]?.message?.content || '';

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
