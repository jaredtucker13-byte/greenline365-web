/**
 * Shared OpenRouter API utility
 * Centralized LLM calls with retry, JSON mode, cost logging, and rate limit handling.
 * All AI in GL365 goes through OpenRouter — this is the single entry point.
 */

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

// ── Types ──────────────────────────────────────────────────────────

export interface ToolCallMessage {
  id: string;
  type: 'function';
  function: { name: string; arguments: string };
}

export type ChatMessage = {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null | Array<{ type: string; [key: string]: any }>;
  tool_calls?: ToolCallMessage[];
  tool_call_id?: string;
};

export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, any>;
  };
}

export interface OpenRouterConfig {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  json_mode?: boolean;
  caller?: string;
  tools?: ToolDefinition[];
}

export interface OpenRouterResult {
  content: string;
  tool_calls?: ToolCallMessage[];
  finish_reason?: string;
  tokens: { input: number; output: number };
}

// ── Cost estimation (per 1M tokens, OpenRouter pricing) ────────────

const PRICING: Record<string, { input: number; output: number }> = {
  'anthropic/claude-opus-4.6':    { input: 15,   output: 75 },
  'anthropic/claude-sonnet-4.6':  { input: 3,    output: 15 },
  'anthropic/claude-sonnet-4':    { input: 3,    output: 15 },
  'openai/gpt-4o':                { input: 2.5,  output: 10 },
  'openai/gpt-4o-mini':           { input: 0.15, output: 0.6 },
  'openai/gpt-4o-audio-preview':  { input: 2.5,  output: 10 },
  'google/gemini-2.5-pro-preview':{ input: 1.25, output: 10 },
  'google/gemini-2.0-flash-001':  { input: 0.1,  output: 0.4 },
  'perplexity/sonar-pro':         { input: 3,    output: 15 },
  'perplexity/sonar':             { input: 1,    output: 1 },
  'perplexity/llama-3.1-sonar-large-128k-online': { input: 1, output: 1 },
};

function estimateCost(model: string, input: number, output: number): number {
  const p = PRICING[model] || { input: 5, output: 15 };
  return (input * p.input + output * p.output) / 1_000_000;
}

// ── Core function ──────────────────────────────────────────────────

export async function callOpenRouter(config: OpenRouterConfig): Promise<OpenRouterResult> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OpenRouter API key not configured');
  }

  const body: Record<string, any> = {
    model: config.model,
    messages: config.messages,
    temperature: config.temperature ?? 0.7,
    max_tokens: config.max_tokens ?? 1000,
  };

  if (config.tools && config.tools.length > 0) {
    body.tools = config.tools;
  }

  if (config.json_mode) {
    body.response_format = { type: 'json_object' };
  }

  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(OPENROUTER_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://greenline365.com',
          'X-Title': config.caller || 'GreenLine365',
        },
        body: JSON.stringify(body),
      });

      // Retry on rate limit or server errors
      if (response.status === 429 || response.status >= 500) {
        const waitMs = Math.pow(2, attempt) * 1000;
        console.warn(`[OpenRouter] ${response.status} from ${config.caller || '?'}, retry ${attempt + 1}/${maxRetries} in ${waitMs}ms`);
        if (attempt < maxRetries) {
          await new Promise(r => setTimeout(r, waitMs));
          continue;
        }
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      const message = data.choices?.[0]?.message;
      const content = message?.content || '';
      const toolCalls: ToolCallMessage[] | undefined = message?.tool_calls;
      const finishReason = data.choices?.[0]?.finish_reason;
      const tokens = {
        input: data.usage?.prompt_tokens || 0,
        output: data.usage?.completion_tokens || 0,
      };

      const cost = estimateCost(config.model, tokens.input, tokens.output);
      const toolInfo = toolCalls?.length ? ` | tools:${toolCalls.map(t => t.function.name).join(',')}` : '';
      console.log(
        `[OpenRouter] ${config.caller || '?'} | ${config.model.split('/')[1]} | ${tokens.input}in+${tokens.output}out | ~$${cost.toFixed(4)}${toolInfo}`
      );

      return { content, tool_calls: toolCalls, finish_reason: finishReason, tokens };
    } catch (error: any) {
      lastError = error;
      if (attempt < maxRetries) {
        const waitMs = Math.pow(2, attempt) * 1000;
        await new Promise(r => setTimeout(r, waitMs));
      }
    }
  }

  throw lastError || new Error('OpenRouter request failed after retries');
}

// ── JSON convenience ───────────────────────────────────────────────

export async function callOpenRouterJSON<T = any>(
  config: OpenRouterConfig
): Promise<{ parsed: T; content: string; tokens: { input: number; output: number } }> {
  const result = await callOpenRouter({ ...config, json_mode: true });

  try {
    const parsed = JSON.parse(result.content) as T;
    return { parsed, content: result.content, tokens: result.tokens };
  } catch {
    // Fallback: extract JSON from markdown blocks or raw text
    const jsonMatch =
      result.content.match(/```json\n?([\s\S]*?)\n?```/) ||
      result.content.match(/\{[\s\S]*\}/) ||
      result.content.match(/\[[\s\S]*\]/);

    if (jsonMatch) {
      const jsonStr = jsonMatch[1] || jsonMatch[0];
      const parsed = JSON.parse(jsonStr) as T;
      return { parsed, content: result.content, tokens: result.tokens };
    }

    throw new Error('Failed to parse JSON from OpenRouter response');
  }
}
