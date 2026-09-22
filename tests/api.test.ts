import type { VercelRequest, VercelResponse } from '@vercel/node';
import { describe, expect, it } from 'vitest';

import handler from '../api/card.js';
import { encodeContributions } from '../src/contributions.js';

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
  it('renders the sample card without a token', () => {
    const { response, state } = mockResponse();
    handler(request('GET'), response);

    expect(state.statusCode).toBe(200);
    expect(state.headers['Content-Type']).toBe('image/svg+xml; charset=utf-8');
    expect(state.headers['Vercel-CDN-Cache-Control']).toContain('max-age=21600');
    expect(state.body).toContain('ahujasid/mcp-for-blender');
  });

  it('renders the items from the token', () => {
    const { response, state } = mockResponse();
    handler(request('GET', { items: encodeContributions([{ number: 7, repo: 'octocat/hello-world', status: 'merged' }]) }), response);
    expect(state.statusCode).toBe(200);
    expect(state.body).toContain('octocat/hello-world');
    expect(state.body).not.toContain('mcp-for-blender');
  });

  it('returns an SVG error for a bad token', () => {
    const { response, state } = mockResponse();
    handler(request('GET', { items: 'garbage' }), response);
    expect(state.statusCode).toBe(400);
    expect(state.body).toContain('Invalid contributions');
  });

  it('rejects non-GET requests', () => {
    const { response, state } = mockResponse();
    handler(request('POST'), response);
    expect(state.statusCode).toBe(405);
    expect(state.headers.Allow).toBe('GET');
  });
});
