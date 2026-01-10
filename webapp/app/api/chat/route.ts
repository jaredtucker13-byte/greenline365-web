import { NextRequest } from 'next/server';

type Msg = { role: 'user' | 'assistant' | 'system'; content: string };

// Model selection based on mode
const getModel = (mode?: string): string => {
  switch (mode) {
    case 'creative':
      // Use Claude for nuanced creative conversations
      return 'anthropic/claude-3.5-sonnet';
    case 'support':
      // Fast and accurate for support
      return 'openai/gpt-4o-mini';
    default:
      // Default concierge
      return 'openai/gpt-4o-mini';
  }
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({} as Record<string, unknown>));

    const message: string | undefined =
      body?.message ??
      body?.messages?.[body.messages.length - 1]?.content;

    if (!message || typeof message !== 'string') {
      return Response.json({ error: 'Missing message' }, { status: 400 });
    }

    const messages: Msg[] = body?.messages?.length
      ? body.messages
      : [{ role: 'user', content: message }];

    const mode = body?.mode as string | undefined;
    const sessionId = body?.sessionId as string | undefined;
    const model = getModel(mode);

    // Log conversation for analytics (could be stored in DB later)
    console.log(`[Chat] Session: ${sessionId || 'anonymous'}, Mode: ${mode || 'default'}, Model: ${model}`);

    const upstream = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://greenline365.com',
        'X-Title': 'GreenLine365 Assistant',
      },
      body: JSON.stringify({
        model,
        messages,
        stream: false,
        temperature: mode === 'creative' ? 0.8 : 0.7, // Higher creativity for brainstorming
        max_tokens: mode === 'creative' ? 1000 : 500,
      }),
    });

    const json = await upstream.json().catch(async () => ({
      error: await upstream.text(),
    }));

    // Handle rate limits or errors gracefully
    if (!upstream.ok) {
      console.error('[Chat] API Error:', json);
      return Response.json(
        { 
          error: 'Service temporarily unavailable',
          reply: "I'm experiencing a brief delay. Please try again in a moment."
        }, 
        { status: upstream.status }
      );
    }

    return Response.json(json, { status: 200 });
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : 'Server error';
    console.error('[Chat] Server Error:', errorMessage);
    return Response.json({ error: errorMessage }, { status: 500 });
  }
}
