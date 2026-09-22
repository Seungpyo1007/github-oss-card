import type { VercelRequest, VercelResponse } from '@vercel/node';

import { decodeContributions, sampleContributions } from '../src/contributions.js';
import { parseCardOptions } from '../src/options.js';
import { renderCard, renderErrorCard } from '../src/render/card.js';

const cacheHeaders = {
  'Cache-Control': 'public, max-age=300',
  'CDN-Cache-Control': 'max-age=21600',
  'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'",
  'Content-Type': 'image/svg+xml; charset=utf-8',
  'Vercel-CDN-Cache-Control': 'max-age=21600, stale-while-revalidate=86400',
  'X-Content-Type-Options': 'nosniff',
};

function applyHeaders(response: VercelResponse): void {
  for (const [name, value] of Object.entries(cacheHeaders)) {
    response.setHeader(name, value);
  }
  response.setHeader('Access-Control-Allow-Origin', '*');
}

export default function handler(request: VercelRequest, response: VercelResponse): void {
  const options = parseCardOptions(request.query);
  applyHeaders(response);

  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    response.status(405).send(renderErrorCard('Method not allowed', options.theme));
    return;
  }

  let items = sampleContributions;
  if (options.itemsToken) {
    const decoded = decodeContributions(options.itemsToken);
    if (!decoded.ok) {
      response.status(400).send(renderErrorCard(decoded.error, options.theme));
      return;
    }
    items = decoded.items;
  }

  response.status(200).send(renderCard(items, options));
}
