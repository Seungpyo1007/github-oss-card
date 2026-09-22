import sharp from 'sharp';
import { XMLValidator } from 'fast-xml-parser';
import { describe, expect, it } from 'vitest';

import { selectContributions } from '../src/github.js';
import { parseCardOptions } from '../src/options.js';
import { formatStars, renderCard, renderErrorCard } from '../src/render/card.js';
import { contributions } from './fixtures.js';

const options = parseCardOptions({ animation: 'false' });
const pullRequests = selectContributions(contributions, options);

describe('SVG card renderer', () => {
  it('renders a valid card that rasterizes', async () => {
    const svg = renderCard(pullRequests, options);
    expect(XMLValidator.validate(svg)).toBe(true);
    const { info } = await sharp(Buffer.from(svg)).png().toBuffer({ resolveWithObject: true });
    expect(info.format).toBe('png');
    expect(info.width).toBe(960);
  });

  it('lists every contribution vertically', () => {
    const svg = renderCard(pullRequests, options);
    expect(svg).toContain('ahujasid/mcp-for-blender');
    expect(svg).toContain('#1199');
    expect(svg).toContain('★ 29.2k');
    expect(svg).toContain('3 MERGED PRS · 2 REPOS');
    expect(svg).toMatchSnapshot();
  });

  it('escapes titles and adds motion only when enabled', () => {
    const animated = renderCard([{ ...pullRequests[0]!, title: '<b>&"x"</b>' }], parseCardOptions({}));
    expect(animated).toContain('&lt;b&gt;&amp;&quot;x&quot;&lt;/b&gt;');
    expect(animated).toContain('@keyframes fadeSlide');
    expect(renderCard(pullRequests, options)).not.toContain('<style>');
  });

  it('renders an empty state and error cards', () => {
    expect(XMLValidator.validate(renderCard([], options))).toBe(true);
    expect(renderCard([], options)).toContain('No merged pull requests');
    expect(renderErrorCard('Unknown user: x', options.theme)).toContain('Unknown user: x');
  });

  it('formats star counts', () => {
    expect([77, 1000, 29157, 143000].map(formatStars)).toEqual(['77', '1k', '29.2k', '143k']);
  });
});
