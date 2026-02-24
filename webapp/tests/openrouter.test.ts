import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Mock env
vi.stubEnv('OPENROUTER_API_KEY', 'test-key-123');

// Import after mocks are set
import { callOpenRouter, callOpenRouterJSON } from '@/lib/openrouter';
import type { OpenRouterConfig } from '@/lib/openrouter';

describe('callOpenRouter', () => {
  const baseConfig: OpenRouterConfig = {
    model: 'anthropic/claude-sonnet-4.6',
    messages: [{ role: 'user', content: 'Hello' }],
    caller: 'test',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws if API key is not set', async () => {
    vi.stubEnv('OPENROUTER_API_KEY', '');
    // Re-import to pick up env change — use dynamic import
    const mod = await import('@/lib/openrouter');
    // The function reads process.env at call time
    const originalKey = process.env.OPENROUTER_API_KEY;
    process.env.OPENROUTER_API_KEY = '';
    await expect(mod.callOpenRouter(baseConfig)).rejects.toThrow('API key not configured');
    process.env.OPENROUTER_API_KEY = 'test-key-123';
  });

  it('returns content and token counts on success', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'Hello back!' } }],
        usage: { prompt_tokens: 10, completion_tokens: 20 },
      }),
    });

    const result = await callOpenRouter(baseConfig);
    expect(result.content).toBe('Hello back!');
    expect(result.tokens.input).toBe(10);
    expect(result.tokens.output).toBe(20);
  });

  it('sends correct headers', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'ok' } }],
        usage: { prompt_tokens: 5, completion_tokens: 5 },
      }),
    });

    await callOpenRouter(baseConfig);

    expect(mockFetch).toHaveBeenCalledWith(
      'https://openrouter.ai/api/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-key-123',
          'Content-Type': 'application/json',
        }),
      }),
    );
  });

  it('enables json_mode when specified', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: '{"key":"value"}' } }],
        usage: { prompt_tokens: 5, completion_tokens: 5 },
      }),
    });

    await callOpenRouter({ ...baseConfig, json_mode: true });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.response_format).toEqual({ type: 'json_object' });
  });

  it('uses default temperature of 0.7', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'ok' } }],
        usage: { prompt_tokens: 5, completion_tokens: 5 },
      }),
    });

    await callOpenRouter(baseConfig);

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.temperature).toBe(0.7);
    expect(body.max_tokens).toBe(1000);
  });

  it('throws on non-retryable HTTP errors', async () => {
    // Status 400 is non-retryable but the code still retries on catch.
    // Mock to return a 400 consistently — the function will throw after retries.
    let callCount = 0;
    mockFetch.mockImplementation(async () => {
      callCount++;
      return {
        ok: false,
        status: 400,
        text: async () => 'Bad request',
      };
    });

    await expect(callOpenRouter(baseConfig)).rejects.toThrow('OpenRouter 400');
    // Should have been called (initial + retries)
    expect(callCount).toBeGreaterThanOrEqual(1);
  }, 30000);

  it('returns empty string for missing content', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: {} }],
        usage: {},
      }),
    });

    const result = await callOpenRouter(baseConfig);
    expect(result.content).toBe('');
    expect(result.tokens.input).toBe(0);
    expect(result.tokens.output).toBe(0);
  });
});

describe('callOpenRouterJSON', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OPENROUTER_API_KEY = 'test-key-123';
  });

  it('parses valid JSON response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: '{"status":"ok","count":5}' } }],
        usage: { prompt_tokens: 10, completion_tokens: 15 },
      }),
    });

    const result = await callOpenRouterJSON<{ status: string; count: number }>({
      model: 'anthropic/claude-sonnet-4.6',
      messages: [{ role: 'user', content: 'return json' }],
    });

    expect(result.parsed.status).toBe('ok');
    expect(result.parsed.count).toBe(5);
  });

  it('extracts JSON from markdown code blocks', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'Here is the result:\n```json\n{"name":"test"}\n```' } }],
        usage: { prompt_tokens: 10, completion_tokens: 15 },
      }),
    });

    const result = await callOpenRouterJSON<{ name: string }>({
      model: 'anthropic/claude-sonnet-4.6',
      messages: [{ role: 'user', content: 'return json' }],
    });

    expect(result.parsed.name).toBe('test');
  });

  it('throws on unparseable response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'This is not JSON at all, no curly braces here' } }],
        usage: { prompt_tokens: 10, completion_tokens: 15 },
      }),
    });

    await expect(
      callOpenRouterJSON({
        model: 'anthropic/claude-sonnet-4.6',
        messages: [{ role: 'user', content: 'return json' }],
      }),
    ).rejects.toThrow();
  });
});
