import { describe, expect, it } from 'vitest';

import { parseCardOptions } from '../src/options.js';

describe('parseCardOptions', () => {
  it('applies defaults', () => {
    const options = parseCardOptions({});
    expect(options.username).toBe('Seungpyo1007');
    expect(options.minStars).toBe(10);
    expect(options.limit).toBe(6);
    expect(options.title).toBe('Open Source Contributions');
    expect(options.animated).toBe(true);
    expect(options.theme.background).toBe('#0F1B2A');
  });

  it('clamps numbers and rejects unsafe usernames', () => {
    const options = parseCardOptions({ limit: '99', min_stars: '-5', username: '<script>' });
    expect(options.limit).toBe(10);
    expect(options.minStars).toBe(0);
    expect(options.username).toBe('Seungpyo1007');
  });

  it('parses exclusions, colours and flags', () => {
    const options = parseCardOptions({
      animation: 'false',
      bg_color: '%23abc',
      exclude: 'Python/Python-Docs-Ko, not a repo,owner/repo.js',
      hide_title: 'true',
      theme: 'light',
    });
    expect([...options.exclude]).toEqual(['python/python-docs-ko', 'owner/repo.js']);
    expect(options.theme.background).toBe('#AABBCC');
    expect(options.theme.text).toBe('#1F2328');
    expect(options.animated).toBe(false);
    expect(options.hideTitle).toBe(true);
  });
});
