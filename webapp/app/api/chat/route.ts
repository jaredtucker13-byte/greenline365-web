import { NextRequest } from 'next/server';
import { createClient, createServerClient } from '@/lib/supabase/server';
import { MemoryBucketService, AIContext } from '@/lib/memory-bucket-service';

type Msg = { role: 'user' | 'assistant' | 'system'; content: string };

// Model selection based on mode
const getModel = (mode?: string): string => {
  switch (mode) {
    case 'creative':
      return 'anthropic/claude-3.5-sonnet';
    case 'support':
      return 'openai/gpt-4o-mini';
    default:
      return 'openai/gpt-4o-mini';
  }
};

// Build system prompt with brand voice from Memory Bucket Layer 1
function buildSystemPromptWithBrandVoice(context: AIContext | null, mode?: string): string {
  // Base prompts per mode
  const basePrompts: Record<string, string> = {
    creative: `You are a creative marketing assistant for a local business. 
You help brainstorm content ideas, write engaging copy, and suggest marketing strategies.
Be creative, enthusiastic, and provide multiple options when possible.`,
    support: `You are a helpful customer support assistant for GreenLine365.
Answer questions about features, help troubleshoot issues, and guide users through the platform.
Be clear, concise, and always offer to help further.`,
    default: `You are a friendly business concierge assistant for GreenLine365.
Help local business owners with marketing, content creation, and business growth.
Be personable, knowledgeable, and proactive in offering suggestions.`,
  };

  let systemPrompt = basePrompts[mode || 'default'] || basePrompts.default;

  // Inject brand voice from Layer 1 (Core Profile)
  if (context?.brandVoice) {
    const voice = context.brandVoice;
    systemPrompt += `

═══════════════════════════════════════════════════════════════
BRAND VOICE INSTRUCTIONS (Match this user's style)
═══════════════════════════════════════════════════════════════
`;
    if (voice.displayName) {
      systemPrompt += `- Speaking as/for: ${voice.displayName}`;
      if (voice.businessName) systemPrompt += ` (${voice.businessName})`;
      systemPrompt += '\n';
    }
    if (voice.location) {
      systemPrompt += `- Location context: ${voice.location}\n`;
    }
    if (voice.industry) {
      systemPrompt += `- Industry: ${voice.industry}\n`;
    }
    if (voice.personality) {
      systemPrompt += `- Tone: ${voice.personality.tone || 'friendly'}\n`;
      systemPrompt += `- Formality: ${voice.personality.formality || 'casual-professional'}\n`;
      systemPrompt += `- Energy: ${voice.personality.energy || 'balanced'}\n`;
      if (voice.personality.quirks?.length) {
        systemPrompt += `- Style quirks: ${voice.personality.quirks.join(', ')}\n`;
      }
    }
    if (voice.preferredPhrases?.length) {
      systemPrompt += `- Preferred phrases to use: "${voice.preferredPhrases.slice(0, 3).join('", "')}"\n`;
    }
    if (voice.forbiddenPhrases?.length) {
      systemPrompt += `- NEVER say: "${voice.forbiddenPhrases.slice(0, 3).join('", "')}"\n`;
    }
    if (voice.voiceExamples?.length) {
      systemPrompt += `- Voice example: "${voice.voiceExamples[0]}"\n`;
    }
    if (voice.biography?.background) {
      systemPrompt += `- User background: ${voice.biography.background}\n`;
    }
  }

  // Add context from Layer 3 (Journal - Recent Events)
  if (context?.history?.length) {
    systemPrompt += `

═══════════════════════════════════════════════════════════════
RECENT ACTIVITY (What this user has done recently)
═══════════════════════════════════════════════════════════════
`;
    context.history.slice(0, 5).forEach(event => {
      const date = event.occurredAt.toLocaleDateString();
      systemPrompt += `- ${date}: ${event.eventType}${event.title ? ` - "${event.title}"` : ''}\n`;
    });
  }

  // Add relevant knowledge from Layer 2 (Warehouse)
  if (context?.factualBase?.length) {
    systemPrompt += `

═══════════════════════════════════════════════════════════════
BUSINESS KNOWLEDGE BASE
═══════════════════════════════════════════════════════════════
`;
    context.factualBase.slice(0, 3).forEach(chunk => {
      systemPrompt += `[${chunk.category}]: ${chunk.content.slice(0, 300)}${chunk.content.length > 300 ? '...' : ''}\n`;
    });
  }

  return systemPrompt;
}

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

    // ========================================
    // MEMORY BUCKET INTEGRATION
    // ========================================
    let aiContext: AIContext | null = null;
    let userId: string | null = null;

    try {
      // Try to get authenticated user
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user && sessionId) {
        userId = user.id;
        
        // Create Memory Bucket Service
        const memoryService = new MemoryBucketService(supabase, userId);
        
        // Fetch AI context using Priority Fetch Order
        aiContext = await memoryService.prepareAIContext(sessionId, message);
        
        // Store user message in Buffer (Layer 4)
        await memoryService.addToBuffer(sessionId, {
          contextType: 'message',
          content: { role: 'user', content: message, timestamp: new Date().toISOString() },
          importance: 5,
        });
        
        console.log(`[Chat] Memory context loaded for user ${userId}`);
      }
    } catch (memoryError) {
      // Memory system is optional - continue without it
      console.warn('[Chat] Memory system unavailable:', memoryError);
    }

    // Build system prompt with brand voice injection
    const systemPrompt = buildSystemPromptWithBrandVoice(aiContext, mode);

    // Prepare messages with system prompt
    const messagesWithSystem: Msg[] = [
      { role: 'system', content: systemPrompt },
      ...messages.filter(m => m.role !== 'system'), // Remove any existing system messages
    ];

    console.log(`[Chat] Session: ${sessionId || 'anonymous'}, Mode: ${mode || 'default'}, Model: ${model}, HasMemory: ${!!aiContext}`);

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
        messages: messagesWithSystem,
        stream: false,
        temperature: mode === 'creative' ? 0.8 : 0.7,
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

    // Store assistant response in Buffer (Layer 4)
    if (userId && sessionId && json?.choices?.[0]?.message?.content) {
      try {
        const supabase = await createClient();
        const memoryService = new MemoryBucketService(supabase, userId);
        await memoryService.addToBuffer(sessionId, {
          contextType: 'message',
          content: { 
            role: 'assistant', 
            content: json.choices[0].message.content, 
            timestamp: new Date().toISOString() 
          },
          importance: 5,
        });
      } catch (e) {
        // Silently fail - don't break the response
        console.warn('[Chat] Failed to store assistant message:', e);
      }
    }

    return Response.json(json, { status: 200 });
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : 'Server error';
    console.error('[Chat] Server Error:', errorMessage);
    return Response.json({ error: errorMessage }, { status: 500 });
  }
}
