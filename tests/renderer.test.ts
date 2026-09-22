import sharp from 'sharp';
import { XMLValidator } from 'fast-xml-parser';
import { describe, expect, it } from 'vitest';

import { sampleContributions } from '../src/contributions.js';
import { parseCardOptions } from '../src/options.js';
import { formatStars, renderCard, renderErrorCard } from '../src/render/card.js';
import { statusStyles } from '../src/render/status.js';

const options = parseCardOptions({ animation: 'false' });

describe('SVG card renderer', () => {
  it('renders a valid card that rasterizes', async () => {
    const svg = renderCard(sampleContributions, options);
    expect(XMLValidator.validate(svg)).toBe(true);
    const { info } = await sharp(Buffer.from(svg)).png().toBuffer({ resolveWithObject: true });
    expect(info.format).toBe('png');
    expect(info.width).toBe(960);
  });

  it('lists every contribution vertically', () => {
    const svg = renderCard(sampleContributions, options);
    expect(svg).toContain('ahujasid/mcp-for-blender');
    expect(svg).toContain('#1199');
    expect(svg).toContain('★ 29.2k');
    expect(svg).toContain('>Merged<');
    expect(svg).toContain('>2026-09-15<');
    expect(svg).toContain('3 CONTRIBUTIONS · 2 REPOS');
    expect(svg).toMatchSnapshot();
  });

  it('renders minimal and open items', () => {
    const svg = renderCard([{ repo: 'octocat/hello-world', status: 'open' }], options);
    expect(XMLValidator.validate(svg)).toBe(true);
    expect(svg).toContain('>Open<');
    expect(svg).not.toContain('★');
    expect(svg).not.toMatch(/>#\d/);
  });

  it('escapes titles and adds motion only when enabled', () => {
    const animated = renderCard([{ repo: 'a/b', status: 'merged', title: '<b>&"x"</b>' }], parseCardOptions({}));
    expect(animated).toContain('&lt;b&gt;&amp;&quot;x&quot;&lt;/b&gt;');
    expect(animated).toContain('@keyframes fadeSlide');
    expect(renderCard(sampleContributions, options)).not.toContain('<style>');
  });

  it('renders an empty state and error cards', () => {
    expect(XMLValidator.validate(renderCard([], options))).toBe(true);
    expect(renderCard([], options)).toContain('No contributions yet');
    expect(renderErrorCard('Invalid contributions', options.theme)).toContain('Invalid contributions');
  });

  it.each(Object.entries(statusStyles))('draws the %s badge with its icon and colour', (status, style) => {
    const svg = renderCard([{ date: '2026-01-02', repo: 'a/b', status: status as keyof typeof statusStyles }], options);
    expect(XMLValidator.validate(svg)).toBe(true);
    expect(svg).toContain(`fill="${style.color}"`);
    expect(svg).toContain(style.path);
    expect(svg).toContain(`>${style.label}<`);
    expect(svg).toContain('>2026-01-02<');
  });

  it('formats star counts', () => {
    expect([77, 1000, 29157, 143000].map(formatStars)).toEqual(['77', '1k', '29.2k', '143k']);
  });
});
