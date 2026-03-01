/**
 * OpenRouter API Client
 *
 * Wrapper with:
 * - Automatic 3-retry logic with exponential backoff
 * - Fallback chain (OpenRouter primary → OpenAI direct fallback)
 * - Model routing map
 * - Cost tracking integration
 * - Error handling and logging
 */

import type { ModelId, OpenRouterResponse, CostEntry } from './types';

// ============ CONFIG ============

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000; // doubles each retry

/** Approximate cost per 1M tokens (input/output averaged) */
const COST_PER_M_TOKENS: Record<string, number> = {
  'perplexity/sonar-pro': 3.0,
  'google/gemini-2.0-flash-001': 0.7,
  'anthropic/claude-sonnet-4': 15.0,
  'openai/gpt-4o': 10.0,
};

/** Model routing map — primary + fallback per task */
export const MODEL_ROUTES: Record<string, { primary: ModelId; fallback: ModelId }> = {
  research:  { primary: 'perplexity/sonar-pro',         fallback: 'openai/gpt-4o' },
  vision:    { primary: 'google/gemini-2.0-flash-001',  fallback: 'openai/gpt-4o' },
  generate:  { primary: 'anthropic/claude-sonnet-4',    fallback: 'openai/gpt-4o' },
  review:    { primary: 'anthropic/claude-sonnet-4',    fallback: 'openai/gpt-4o' },
};

// ============ COST TRACKING ============

const costLog: CostEntry[] = [];

function trackCost(model: string, task: string, tokens: number) {
  const rate = COST_PER_M_TOKENS[model] || 5.0;
  const estimatedCost = (tokens / 1_000_000) * rate;
  costLog.push({ model, task, tokens, estimatedCost, timestamp: new Date().toISOString() });
  console.log(`[OpenRouter] Cost: $${estimatedCost.toFixed(4)} | ${model} | ${tokens} tokens | ${task}`);
}

export function getCostLog(): CostEntry[] {
  return [...costLog];
}

// ============ OPENROUTER CALL ============

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
}

interface CallOptions {
  model: ModelId;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
}

async function callOpenRouter(options: CallOptions): Promise<{ content: string; usage: any }> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY not configured');

  const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://greenline365.com',
      'X-Title': 'GreenLine365 Email Engine',
    },
    body: JSON.stringify({
      model: options.model,
      messages: options.messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 2048,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`OpenRouter ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || '';
  const usage = data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
  return { content, usage };
}

// ============ OPENAI DIRECT FALLBACK ============

async function callOpenAIDirect(options: CallOptions): Promise<{ content: string; usage: any }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY not configured for fallback');

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: options.messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 2048,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`OpenAI ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || '';
  const usage = data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
  return { content, usage };
}

// ============ MAIN EXPORT ============

export interface RouteCallOptions {
  task: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  /** Override the primary model for this call */
  modelOverride?: ModelId;
}

/**
 * Call the AI model routing chain:
 * 1. Try primary model via OpenRouter (up to 3 retries)
 * 2. On failure, fall back to OpenAI direct GPT-4o
 */
export async function callWithFallback(options: RouteCallOptions): Promise<OpenRouterResponse> {
  const route = MODEL_ROUTES[options.task];
  if (!route && !options.modelOverride) {
    throw new Error(`No model route defined for task: ${options.task}`);
  }

  const primaryModel = options.modelOverride || route.primary;
  const fallbackModel = route?.fallback || 'openai/gpt-4o';

  // Try primary model with retries
  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`[OpenRouter] Attempt ${attempt}/${MAX_RETRIES} | ${primaryModel} | task=${options.task}`);
      const result = await callOpenRouter({
        model: primaryModel,
        messages: options.messages,
        temperature: options.temperature,
        maxTokens: options.maxTokens,
      });

      const totalTokens = result.usage.total_tokens || result.usage.prompt_tokens + result.usage.completion_tokens;
      trackCost(primaryModel, options.task, totalTokens);

      return {
        content: result.content,
        model: primaryModel,
        wasFallback: false,
        usage: {
          promptTokens: result.usage.prompt_tokens || 0,
          completionTokens: result.usage.completion_tokens || 0,
          totalTokens,
          estimatedCost: (totalTokens / 1_000_000) * (COST_PER_M_TOKENS[primaryModel] || 5.0),
        },
      };
    } catch (err: any) {
      lastError = err;
      console.warn(`[OpenRouter] Attempt ${attempt} failed for ${primaryModel}: ${err.message}`);
      if (attempt < MAX_RETRIES) {
        await new Promise(r => setTimeout(r, RETRY_DELAY_MS * Math.pow(2, attempt - 1)));
      }
    }
  }

  // Fallback to OpenAI direct
  console.log(`[OpenRouter] All retries failed for ${primaryModel}. Falling back to ${fallbackModel} via OpenAI direct.`);
  try {
    const result = await callOpenAIDirect({
      model: fallbackModel,
      messages: options.messages,
      temperature: options.temperature,
      maxTokens: options.maxTokens,
    });

    const totalTokens = result.usage.total_tokens || result.usage.prompt_tokens + result.usage.completion_tokens;
    trackCost(fallbackModel, `${options.task}_fallback`, totalTokens);

    return {
      content: result.content,
      model: fallbackModel,
      wasFallback: true,
      usage: {
        promptTokens: result.usage.prompt_tokens || 0,
        completionTokens: result.usage.completion_tokens || 0,
        totalTokens,
        estimatedCost: (totalTokens / 1_000_000) * (COST_PER_M_TOKENS[fallbackModel] || 5.0),
      },
    };
  } catch (fallbackErr: any) {
    console.error(`[OpenRouter] Fallback also failed: ${fallbackErr.message}`);
    throw new Error(
      `All AI models failed. Primary (${primaryModel}): ${lastError?.message}. Fallback (${fallbackModel}): ${fallbackErr.message}`
    );
  }
}
