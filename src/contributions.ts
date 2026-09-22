import type { Contribution, ContributionStatus, ContributionsConfigV1 } from './types.js';

export const MAX_ITEMS = 10;
export const MAX_TOKEN_LENGTH = 4096;
export const MAX_TITLE_LENGTH = 100;

const repoPattern = /^[A-Za-z0-9-]{1,39}\/[A-Za-z0-9._-]{1,100}$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const statusValues = new Set<unknown>(['merged', 'open', 'closed', 'draft'] satisfies ContributionStatus[]);

// Shown when no `items` token is given, and used as the builder's starting point.
export const sampleContributions: Contribution[] = [
  { date: '2026-09-16', number: 344, repo: 'ahujasid/mcp-for-blender', stars: 29157, status: 'merged', title: 'feat: export_scene command and MCP tool' },
  { date: '2026-09-15', number: 342, repo: 'ahujasid/mcp-for-blender', stars: 29157, status: 'merged', title: 'feat: International (Pro) account toggle for Hunyuan3D' },
  { date: '2026-08-20', number: 1199, repo: 'python/python-docs-ko', stars: 77, status: 'merged', title: 'Translate library/bz2 into Korean' },
];

export type DecodeResult = { ok: true; items: Contribution[] } | { ok: false; error: string };

function toBase64Url(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/u, '');
}

function fromBase64Url(value: string): string {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(normalized + padding);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function cleanText(value: string): string {
  return [...value]
    .filter((character) => character.charCodeAt(0) >= 32 && character.charCodeAt(0) !== 127)
    .join('')
    .trim();
}

function isInteger(value: unknown, minimum: number, maximum: number): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= minimum && value <= maximum;
}

// Returns a normalized copy, or null when anything is malformed. Optional
// fields are kept only when present, so tokens stay short.
function validateItem(value: unknown): Contribution | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Record<string, unknown>;
  if (typeof candidate.repo !== 'string' || !repoPattern.test(candidate.repo)) return null;

  const item: Contribution = { repo: candidate.repo, status: 'merged' };
  if (candidate.status !== undefined) {
    if (!statusValues.has(candidate.status)) return null;
    item.status = candidate.status as ContributionStatus;
  }
  if (candidate.number !== undefined) {
    if (!isInteger(candidate.number, 1, 99_999_999)) return null;
    item.number = candidate.number;
  }
  if (candidate.stars !== undefined) {
    if (!isInteger(candidate.stars, 0, 999_999_999)) return null;
    item.stars = candidate.stars;
  }
  if (candidate.date !== undefined) {
    if (typeof candidate.date !== 'string' || !datePattern.test(candidate.date)) return null;
    item.date = candidate.date;
  }
  if (candidate.title !== undefined) {
    if (typeof candidate.title !== 'string') return null;
    const title = [...cleanText(candidate.title)].slice(0, MAX_TITLE_LENGTH).join('');
    if (title) item.title = title;
  }
  return item;
}

function validateConfig(value: unknown): ContributionsConfigV1 | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Partial<ContributionsConfigV1>;
  if (candidate.v !== 1 || !Array.isArray(candidate.items) || candidate.items.length === 0 || candidate.items.length > MAX_ITEMS) return null;
  const items: Contribution[] = [];
  for (const entry of candidate.items) {
    const item = validateItem(entry);
    if (!item) return null;
    items.push(item);
  }
  return { v: 1, items };
}

export function encodeContributions(items: Contribution[]): string {
  const config = validateConfig({ v: 1, items });
  if (!config) throw new Error('Invalid contributions');
  const token = toBase64Url(JSON.stringify(config));
  if (token.length > MAX_TOKEN_LENGTH) throw new Error('Contributions are too large');
  return token;
}

export function decodeContributions(token: string): DecodeResult {
  if (!token || token.length > MAX_TOKEN_LENGTH) return { ok: false, error: 'Invalid contributions' };
  try {
    const config = validateConfig(JSON.parse(fromBase64Url(token)));
    return config ? { ok: true, items: config.items } : { ok: false, error: 'Invalid contributions' };
  } catch {
    return { ok: false, error: 'Invalid contributions' };
  }
}
