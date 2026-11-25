import type { VercelRequest, VercelResponse } from '@vercel/node';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import handler from '../api/card.js';
import { encodeContributions } from '../src/contributions.js';
import { clearLiveCache } from '../src/live.js';

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

describe('card API', () => {
  // The handler asks GitHub for live star counts; tests never touch the network.
  const githubFetch = vi.fn(async () => new Response('{}', { status: 404 }));

  beforeEach(() => {
    clearLiveCache();
    githubFetch.mockClear();
    vi.stubGlobal('fetch', githubFetch);
  });

  afterEach(() => vi.unstubAllGlobals());

  it('renders the sample card without a token', async () => {
    const { response, state } = mockResponse();
    await handler(request('GET'), response);

    expect(state.statusCode).toBe(200);
    expect(state.headers['Content-Type']).toBe('image/svg+xml; charset=utf-8');
    expect(state.headers['Vercel-CDN-Cache-Control']).toContain('max-age=21600');
    expect(state.body).toContain('ahujasid/mcp-for-blender');
  });

  it('renders the items from the token', async () => {
    const { response, state } = mockResponse();
    await handler(request('GET', { items: encodeContributions([{ number: 7, repo: 'octocat/hello-world', status: 'merged' }]) }), response);
    expect(state.statusCode).toBe(200);
    expect(state.body).toContain('octocat/hello-world');
    expect(state.body).not.toContain('mcp-for-blender');
  });

  it('returns an SVG error for a bad token', async () => {
    const { response, state } = mockResponse();
    await handler(request('GET', { items: 'garbage' }), response);
    expect(state.statusCode).toBe(400);
    expect(state.body).toContain('Invalid contributions');
  });

  it('rejects non-GET requests', async () => {
    const { response, state } = mockResponse();
    await handler(request('POST'), response);
    expect(state.statusCode).toBe(405);
    expect(state.headers.Allow).toBe('GET');
  });

  it('shows the live star count instead of the one in the token', async () => {
    githubFetch.mockResolvedValueOnce(new Response(JSON.stringify({ stargazers_count: 35649 }), { status: 200 }));
    const { response, state } = mockResponse();
    await handler(request('GET', { items: encodeContributions([{ repo: 'ahujasid/mcp-for-blender', stars: 29925, status: 'merged' }]) }), response);
    expect(state.statusCode).toBe(200);
    expect(state.body).toContain('★ 35.6k');
    expect(state.body).not.toContain('29.9k');
  });

  it('falls back to the token star count when GitHub is unavailable', async () => {
    const { response, state } = mockResponse();
    await handler(request('GET', { items: encodeContributions([{ repo: 'ahujasid/mcp-for-blender', stars: 29925, status: 'merged' }]) }), response);
    expect(state.statusCode).toBe(200);
    expect(state.body).toContain('★ 29.9k');
  });

  it('skips GitHub entirely with live=false', async () => {
    const { response, state } = mockResponse();
    await handler(request('GET', { live: 'false' }), response);
    expect(state.statusCode).toBe(200);
    expect(githubFetch).not.toHaveBeenCalled();
  });
});
