import { beforeEach, describe, expect, it, vi } from 'vitest';

import { clearLiveCache, refreshContributions } from '../src/live.js';
import type { Contribution } from '../src/types.js';

type Routes = Record<string, unknown>;

function fakeFetch(routes: Routes) {
  return vi.fn(async (input: string | URL | Request) => {
    const path = String(input).replace('https://api.github.com', '');
    const body = routes[path];
    return body === undefined
      ? new Response('{}', { status: 404 })
      : new Response(JSON.stringify(body), { status: 200 });
  });
}

const items: Contribution[] = [
  { number: 344, repo: 'ahujasid/mcp-for-blender', stars: 29925, status: 'merged' },
  { number: 342, repo: 'ahujasid/mcp-for-blender', stars: 29925, status: 'open' },
  { repo: 'python/python-docs-ko', status: 'merged' },
];

describe('refreshContributions', () => {
  beforeEach(() => clearLiveCache());

  it('replaces stale star counts with the live count', async () => {
    const fetch = fakeFetch({ '/repos/ahujasid/mcp-for-blender': { stargazers_count: 35649 } });
    const refreshed = await refreshContributions(items, { fetch });

    expect(refreshed.map((item) => item.stars)).toEqual([35649, 35649, undefined]);
    // One request per repository, and none for rows that do not show stars.
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('keeps the token values when GitHub fails', async () => {
    const failing = vi.fn(async () => { throw new Error('offline'); });
    expect(await refreshContributions(items, { fetch: failing })).toEqual(items);

    clearLiveCache();
    const rateLimited = vi.fn(async () => new Response('{}', { status: 403 }));
    expect(await refreshContributions(items, { fetch: rateLimited })).toEqual(items);
  });

  it('ignores malformed star counts', async () => {
    const fetch = fakeFetch({ '/repos/ahujasid/mcp-for-blender': { stargazers_count: '35649' } });
    expect((await refreshContributions(items, { fetch }))[0]?.stars).toBe(29925);
  });

  it('caches responses between renders', async () => {
    const fetch = fakeFetch({ '/repos/ahujasid/mcp-for-blender': { stargazers_count: 35649 } });
    let now = 0;
    await refreshContributions(items, { fetch, now: () => now });
    await refreshContributions(items, { fetch, now: () => now });
    expect(fetch).toHaveBeenCalledTimes(1);

    now = 31 * 60 * 1000;
    await refreshContributions(items, { fetch, now: () => now });
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('makes no requests when nothing can be refreshed', async () => {
    const fetch = fakeFetch({});
    const plain: Contribution[] = [{ repo: 'octocat/hello-world', status: 'merged' }];
    expect(await refreshContributions(plain, { fetch })).toBe(plain);
    expect(fetch).not.toHaveBeenCalled();
  });
});
