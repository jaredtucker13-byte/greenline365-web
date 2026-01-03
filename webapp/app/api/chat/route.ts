import { NextRequest } from 'next/server';

type Msg = { role: 'user' | 'assistant' | 'system'; content: string };

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({} as any));

    const message: string | undefined =
      body?.message ??
      body?.messages?.[body.messages.length - 1]?.content;

    if (!message || typeof message !== 'string') {
      return Response.json({ error: 'Missing message' }, { status: 400 });
    }

    const messages: Msg[] = body?.messages?.length
      ? body.messages
      : [{ role: 'user', content: message }];

    const upstream = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini', // or your model
        messages,
        stream: false, // <-- important
      }),
    });

    const json = await upstream.json().catch(async () => ({
      error: await upstream.text(),
    }));

    return Response.json(json, { status: upstream.status });
  } catch (e: any) {
    return Response.json({ error: e?.message ?? 'Server error' }, { status: 500 });
  }
}