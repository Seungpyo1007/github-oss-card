import type { VercelRequest, VercelResponse } from '@vercel/node';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import handler from '../api/card.js';

interface ResponseState {
  body: string;
  headers: Record<string, string | number | readonly string[]>;
  statusCode: number;
}

function mockResponse(): { response: VercelResponse; state: ResponseState } {
  const state: ResponseState = { body: '', headers: {}, statusCode: 200 };
  const response = {
    send(body: string) {
      state.body = body;
      return this;
    },
    setHeader(name: string, value: string | number | readonly string[]) {
      state.headers[name] = value;
      return this;
    },
    status(code: number) {
      state.statusCode = code;
      return this;
    },
  } as unknown as VercelResponse;
  return { response, state };
}

function request(method: string, query: VercelRequest['query'] = {}): VercelRequest {
  return { method, query } as VercelRequest;
}

const searchPayload = {
  data: {
    search: {
      nodes: [
        {
          mergedAt: '2026-09-15T09:47:06Z',
          number: 342,
          repository: { isPrivate: false, nameWithOwner: 'ahujasid/mcp-for-blender', owner: { login: 'ahujasid' }, stargazerCount: 29157 },
          title: 'feat: International (Pro) account toggle',
          url: 'https://github.com/ahujasid/mcp-for-blender/pull/342',
        },
      ],
      pageInfo: { endCursor: null, hasNextPage: false },
    },
    user: { organizations: { nodes: [] } },
  },
};

describe('card API', () => {
  beforeEach(() => {
    vi.stubEnv('GITHUB_TOKEN', 'test-token');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('returns a cacheable SVG card', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(searchPayload))));
    const { response, state } = mockResponse();
    await handler(request('GET', { username: 'Seungpyo1007' }), response);

    expect(state.statusCode).toBe(200);
    expect(state.headers['Content-Type']).toBe('image/svg+xml; charset=utf-8');
    expect(state.headers['Vercel-CDN-Cache-Control']).toContain('max-age=21600');
    expect(state.body).toContain('ahujasid/mcp-for-blender');
  });

  it('explains a missing token without caching it for long', async () => {
    vi.stubEnv('GITHUB_TOKEN', '');
    const { response, state } = mockResponse();
    await handler(request('GET'), response);
    expect(state.statusCode).toBe(500);
    expect(state.body).toContain('GITHUB_TOKEN is not configured');
    expect(state.headers['Vercel-CDN-Cache-Control']).toBe('max-age=60');
  });

  it('maps upstream failures to 502', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('network down')));
    const { response, state } = mockResponse();
    await handler(request('GET'), response);
    expect(state.statusCode).toBe(502);
    expect(state.body).toContain('Could not reach GitHub');
  });

  it('rejects non-GET requests', async () => {
    const { response, state } = mockResponse();
    await handler(request('POST'), response);
    expect(state.statusCode).toBe(405);
    expect(state.headers.Allow).toBe('GET');
  });
});
