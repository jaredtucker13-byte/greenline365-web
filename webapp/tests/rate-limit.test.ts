import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';

function createMockRequest(ip: string = '127.0.0.1', path: string = '/api/test'): NextRequest {
  const req = new NextRequest(`http://localhost${path}`, {
    headers: {
      'x-forwarded-for': ip,
    },
  });
  return req;
}

describe('rateLimit (in-memory)', () => {
  it('allows requests under the limit', () => {
    const req = createMockRequest('10.0.0.1', '/api/rate-test-1');
    const result = rateLimit(req, { max: 5, windowMs: 60000 });
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it('tracks remaining count correctly', () => {
    const ip = '10.0.0.2';
    const path = '/api/rate-test-2';

    for (let i = 0; i < 3; i++) {
      rateLimit(createMockRequest(ip, path), { max: 5, windowMs: 60000 });
    }

    const result = rateLimit(createMockRequest(ip, path), { max: 5, windowMs: 60000 });
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(1);
  });

  it('blocks requests over the limit', () => {
    const ip = '10.0.0.3';
    const path = '/api/rate-test-3';

    // Use up all 3 requests
    for (let i = 0; i < 3; i++) {
      rateLimit(createMockRequest(ip, path), { max: 3, windowMs: 60000 });
    }

    // 4th should be blocked
    const result = rateLimit(createMockRequest(ip, path), { max: 3, windowMs: 60000 });
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.retryAfter).toBeGreaterThan(0);
  });

  it('isolates different IPs', () => {
    const path = '/api/rate-test-4';

    // Fill up IP A
    for (let i = 0; i < 2; i++) {
      rateLimit(createMockRequest('10.0.0.4', path), { max: 2, windowMs: 60000 });
    }

    // IP B should still be allowed
    const result = rateLimit(createMockRequest('10.0.0.5', path), { max: 2, windowMs: 60000 });
    expect(result.allowed).toBe(true);
  });

  it('isolates different paths', () => {
    const ip = '10.0.0.6';

    // Fill up path A
    for (let i = 0; i < 2; i++) {
      rateLimit(createMockRequest(ip, '/api/rate-path-a'), { max: 2, windowMs: 60000 });
    }

    // Path B should still be allowed
    const result = rateLimit(createMockRequest(ip, '/api/rate-path-b'), { max: 2, windowMs: 60000 });
    expect(result.allowed).toBe(true);
  });

  it('uses default windowMs of 60000', () => {
    const req = createMockRequest('10.0.0.7', '/api/rate-test-default');
    const result = rateLimit(req, { max: 10 });
    expect(result.allowed).toBe(true);
  });
});

describe('rateLimitResponse', () => {
  it('returns 429 status', () => {
    const response = rateLimitResponse(30);
    expect(response.status).toBe(429);
  });

  it('includes Retry-After header', () => {
    const response = rateLimitResponse(45);
    expect(response.headers.get('Retry-After')).toBe('45');
  });

  it('returns JSON error body', async () => {
    const response = rateLimitResponse(10);
    const body = await response.json();
    expect(body.error).toContain('Too many requests');
  });
});
