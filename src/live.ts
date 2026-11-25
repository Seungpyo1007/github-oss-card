import type { Contribution } from './types.js';

// Star counts baked into the `items` token go stale the moment the card is
// published. This module refreshes them from the GitHub API
// at render time and falls back to the token's values whenever GitHub is slow,
// rate limited or unreachable, so a card never fails because of it.

const API_ORIGIN = 'https://api.github.com';
const SUCCESS_TTL_MS = 30 * 60 * 1000;
const FAILURE_TTL_MS = 5 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 2500;
const MAX_CACHE_ENTRIES = 500;

type Json = Record<string, unknown>;

export interface LiveOptions {
  fetch?: typeof fetch;
  now?: () => number;
  /** Optional GitHub token. Raises the rate limit. */
  token?: string | undefined;
}

interface CacheEntry {
  expires: number;
  value: Json | null;
}

const cache = new Map<string, CacheEntry>();

export function clearLiveCache(): void {
  cache.clear();
}

async function getJson(path: string, signal: AbortSignal, options: LiveOptions): Promise<Json | null> {
  const now = options.now ?? Date.now;
  const cached = cache.get(path);
  if (cached && cached.expires > now()) return cached.value;

  let value: Json | null = null;
  try {
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'github-oss-card',
      'X-GitHub-Api-Version': '2022-11-28',
    };
    if (options.token) headers.Authorization = `Bearer ${options.token}`;
    const response = await (options.fetch ?? fetch)(`${API_ORIGIN}${path}`, { headers, signal });
    if (response.ok) {
      const body: unknown = await response.json();
      if (body && typeof body === 'object') value = body as Json;
    }
  } catch {
    value = null;
  }

  if (cache.size >= MAX_CACHE_ENTRIES) cache.clear();
  cache.set(path, { expires: now() + (value ? SUCCESS_TTL_MS : FAILURE_TTL_MS), value });
  return value;
}

function starsFrom(repository: Json | null): number | undefined {
  const stars = repository?.stargazers_count;
  return typeof stars === 'number' && Number.isInteger(stars) && stars >= 0 ? stars : undefined;
}

/**
 * Returns a copy of `items` with live star counts from GitHub, for every item
 * that already shows a star count. Anything that cannot be fetched keeps the
 * value from the token.
 */
export async function refreshContributions(items: Contribution[], options: LiveOptions = {}): Promise<Contribution[]> {
  const repoPath = (item: Contribution): string => `/repos/${item.repo.toLowerCase()}`;
  const paths = [...new Set(items.filter((item) => item.stars !== undefined).map(repoPath))];
  if (paths.length === 0) return items;

  const signal = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
  const results = await Promise.all(paths.map((path) => getJson(path, signal, options)));
  const byPath = new Map(paths.map((path, index) => [path, results[index] ?? null]));

  return items.map((item) => (item.stars === undefined
    ? item
    : { ...item, stars: starsFrom(byPath.get(repoPath(item)) ?? null) ?? item.stars }));
}
