import type { VercelRequest, VercelResponse } from '@vercel/node';

import { fetchContributions, GitHubError, selectContributions } from '../src/github.js';
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

// Errors should not stick in the CDN for six hours.
function shortCache(response: VercelResponse): void {
  response.setHeader('CDN-Cache-Control', 'max-age=60');
  response.setHeader('Vercel-CDN-Cache-Control', 'max-age=60');
}

export default async function handler(request: VercelRequest, response: VercelResponse): Promise<void> {
  const options = parseCardOptions(request.query);
  applyHeaders(response);

  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    response.status(405).send(renderErrorCard('Method not allowed', options.theme));
    return;
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    shortCache(response);
    response.status(500).send(renderErrorCard('GITHUB_TOKEN is not configured', options.theme));
    return;
  }

  try {
    const contributions = await fetchContributions(options.username, token);
    response.status(200).send(renderCard(selectContributions(contributions, options), options));
  } catch (error) {
    shortCache(response);
    const status = error instanceof GitHubError ? error.status : 502;
    const message = error instanceof GitHubError ? error.message : 'Could not reach GitHub';
    response.status(status).send(renderErrorCard(message, options.theme));
  }
}
