import { describe, expect, it } from 'vitest';

import { decodeContributions, encodeContributions, MAX_ITEMS, MAX_TOKEN_LENGTH, sampleContributions } from '../src/contributions.js';

describe('contribution tokens', () => {
  it('round-trips items in order', () => {
    const decoded = decodeContributions(encodeContributions(sampleContributions));
    expect(decoded).toEqual({ ok: true, items: sampleContributions });
  });

  it('keeps only the repository when optional fields are absent', () => {
    const decoded = decodeContributions(encodeContributions([{ repo: 'octocat/hello-world', status: 'open' }]));
    expect(decoded).toEqual({ ok: true, items: [{ repo: 'octocat/hello-world', status: 'open' }] });
  });

  it('cleans titles and drops empty ones', () => {
    const decoded = decodeContributions(
      encodeContributions([
        { repo: 'a/b', status: 'merged', title: '  fix: typo  ' },
        { repo: 'a/c', status: 'merged', title: '   ' },
      ]),
    );
    expect(decoded.ok && decoded.items).toEqual([
      { repo: 'a/b', status: 'merged', title: 'fix: typo' },
      { repo: 'a/c', status: 'merged' },
    ]);
  });

  it('handles non-ASCII titles', () => {
    const decoded = decodeContributions(encodeContributions([{ repo: 'python/python-docs-ko', status: 'merged', title: 'bz2 모듈 번역' }]));
    expect(decoded.ok && decoded.items[0]?.title).toBe('bz2 모듈 번역');
  });

  it('accepts every pull request state', () => {
    const items = (['merged', 'open', 'closed', 'draft'] as const).map((status) => ({ repo: 'a/b', status }));
    expect(decodeContributions(encodeContributions(items))).toEqual({ ok: true, items });
  });

  it('rejects malformed input', () => {
    expect(decodeContributions('not-base64-json').ok).toBe(false);
    expect(decodeContributions('a'.repeat(MAX_TOKEN_LENGTH + 1)).ok).toBe(false);
    expect(() => encodeContributions([])).toThrow('Invalid contributions');
    expect(() => encodeContributions([{ repo: 'not a repo', status: 'merged' }])).toThrow();
    expect(() => encodeContributions([{ number: 0, repo: 'a/b', status: 'merged' }])).toThrow();
    expect(() => encodeContributions([{ date: '15/09/2026', repo: 'a/b', status: 'merged' }])).toThrow();
    expect(() => encodeContributions([{ repo: 'a/b', status: 'reopened' as 'merged' }])).toThrow();
    const tooMany = Array.from({ length: MAX_ITEMS + 1 }, (_, index) => ({ repo: `a/r${index}`, status: 'merged' as const }));
    expect(() => encodeContributions(tooMany)).toThrow();
  });
});
