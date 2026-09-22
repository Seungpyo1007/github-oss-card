import { describe, expect, it } from 'vitest';

import { parseCardOptions } from '../src/options.js';

describe('parseCardOptions', () => {
  it('applies defaults', () => {
    const options = parseCardOptions({});
    expect(options.itemsToken).toBeNull();
    expect(options.title).toBe('Open Source Contributions');
    expect(options.animated).toBe(true);
    expect(options.hideTitle).toBe(false);
    expect(options.theme.background).toBe('#0F1B2A');
  });

  it('parses the items token, colours and flags', () => {
    const options = parseCardOptions({
      animation: 'false',
      bg_color: '%23abc',
      hide_title: 'true',
      items: 'token',
      theme: 'light',
      title: '  My PRs  ',
    });
    expect(options.itemsToken).toBe('token');
    expect(options.theme.background).toBe('#AABBCC');
    expect(options.theme.text).toBe('#1F2328');
    expect(options.animated).toBe(false);
    expect(options.hideTitle).toBe(true);
    expect(options.title).toBe('My PRs');
  });
});
