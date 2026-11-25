import type { CardTheme, Contribution, RenderOptions } from '../types.js';
import { renderStatusBadge, statusBadgeWidth } from './status.js';

const CARD_WIDTH = 960;
const PADDING = 28;
const HEADER_HEIGHT = 64;
const ROW_HEIGHT = 74;
const ROW_GAP = 12;
const COMPACT_ROW_HEIGHT = 40;
const COMPACT_ROW_GAP = 6;
const MAX_TITLE_LENGTH = 72;
const FONT = 'Segoe UI, Arial, sans-serif';
const MONO = 'ui-monospace, SFMono-Regular, Consolas, monospace';

function escapeXml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&apos;',
    };
    return entities[character] ?? character;
  });
}

export function formatStars(stars: number): string {
  if (stars < 1000) return String(stars);
  const thousands = stars / 1000;
  return `${thousands >= 100 ? Math.round(thousands) : Number(thousands.toFixed(1))}k`;
}

function truncate(value: string, length: number): string {
  const characters = [...value];
  return characters.length > length ? `${characters.slice(0, length - 1).join('')}…` : value;
}

// SVG cannot measure text, so compact rows estimate it: East Asian wide
// characters take roughly twice the space of Latin ones.
function textUnits(value: string): number {
  let units = 0;
  for (const character of value) units += /[\u1100-\u11FF\u2E80-\uA4CF\uAC00-\uD7AF\uF900-\uFAFF\uFF00-\uFFEF]/u.test(character) ? 2 : 1;
  return units;
}

function truncateUnits(value: string, units: number): string {
  if (textUnits(value) <= units) return value;
  let used = 1;
  let result = '';
  for (const character of value) {
    used += textUnits(character);
    if (used > units) break;
    result += character;
  }
  return `${result.trimEnd()}…`;
}

function renderAnimationStyles(enabled: boolean): string {
  if (!enabled) return '';
  return `<style>
    .card-title-motion, .contribution-row { opacity: 0; animation: fadeSlide 0.55s ease-out forwards; }
    .border-shimmer { fill: none; stroke-width: 2.5; stroke-linecap: round; stroke-dasharray: 10 90; animation: borderTravel 6s linear infinite; }
    @keyframes fadeSlide { from { opacity: 0; transform: translateY(7px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes borderTravel { to { stroke-dashoffset: -100; } }
    @media (prefers-reduced-motion: reduce) {
      .card-title-motion, .contribution-row, .border-shimmer {
        animation: none !important;
        opacity: 1 !important;
        transform: none !important;
        stroke-dashoffset: 0 !important;
      }
    }
  </style>`;
}

function renderRow(item: Contribution, index: number, top: number, options: RenderOptions): string {
  const { theme } = options;
  const motion = options.animated ? ` class="contribution-row" style="animation-delay:${140 + index * 90}ms"` : '';
  const width = CARD_WIDTH - PADDING * 2;
  const stars = item.stars === undefined ? '' : `<tspan fill="${theme.accent}" font-weight="600" dx="10">★ ${formatStars(item.stars)}</tspan>`;
  const number = item.number === undefined ? '' : `<tspan fill="${theme.border}" font-weight="700">#${item.number}</tspan> `;
  const detail = item.number === undefined && !item.title ? '' : `
  <text x="${PADDING + 24}" y="${top + 56}" fill="${theme.text}" fill-opacity="0.72" font-family="${FONT}" font-size="14">${number}${escapeXml(truncate(item.title ?? '', MAX_TITLE_LENGTH))}</text>`;
  const repoY = detail ? top + 31 : top + ROW_HEIGHT / 2 + 6;
  const right = CARD_WIDTH - PADDING - 20;
  // With a second line the date sits under the badge; otherwise it sits beside it.
  const dateX = detail ? right : right - statusBadgeWidth(item.status) - 12;
  const dateY = detail ? top + 56 : repoY;
  const date = item.date
    ? `
  <text x="${dateX}" y="${dateY}" text-anchor="end" fill="${theme.text}" fill-opacity="0.55" font-family="${MONO}" font-size="12">${item.date}</text>`
    : '';
  return `<g${motion}>
  <rect x="${PADDING}" y="${top}" width="${width}" height="${ROW_HEIGHT}" rx="12" fill="${theme.tile}"/>
  <rect x="${PADDING}" y="${top + 14}" width="4" height="${ROW_HEIGHT - 28}" rx="2" fill="${index % 2 === 0 ? theme.border : theme.accent}"/>
  <text x="${PADDING + 24}" y="${repoY}" fill="${theme.text}" font-family="${FONT}" font-size="17" font-weight="700">${escapeXml(item.repo)}${stars}</text>${detail}
  ${renderStatusBadge(item.status, right, repoY, FONT)}${date}
</g>`;
}

// One line per contribution: repository, stars, PR number and title on the
// left, date and state badge on the right. About half the height of a full row.
function renderCompactRow(item: Contribution, index: number, top: number, options: RenderOptions): string {
  const { theme } = options;
  const motion = options.animated ? ` class="contribution-row" style="animation-delay:${140 + index * 60}ms"` : '';
  const width = CARD_WIDTH - PADDING * 2;
  const baseline = top + COMPACT_ROW_HEIGHT / 2 + 5;
  const right = CARD_WIDTH - PADDING - 12;
  const left = PADDING + 20;
  const badgeLeft = right - statusBadgeWidth(item.status);
  const dateWidth = item.date ? 86 : 0;

  const starsLabel = item.stars === undefined ? '' : `★ ${formatStars(item.stars)}`;
  const numberLabel = item.number === undefined ? '' : `#${item.number}`;
  const used = textUnits(item.repo) * 8.4 + (starsLabel ? 10 + starsLabel.length * 7.8 : 0) + (numberLabel ? 14 + numberLabel.length * 7.6 : 0);
  const titleUnits = Math.floor((badgeLeft - 12 - dateWidth - left - used - 10) / 6.7);
  const title = item.title && titleUnits >= 8 ? truncateUnits(item.title, titleUnits) : '';

  const stars = starsLabel ? `<tspan fill="${theme.accent}" font-size="13" font-weight="600" dx="10">${starsLabel}</tspan>` : '';
  const number = numberLabel ? `<tspan fill="${theme.border}" font-size="13" font-weight="700" dx="14">${numberLabel}</tspan>` : '';
  const titleSpan = title ? `<tspan fill="${theme.text}" fill-opacity="0.72" font-size="13" font-weight="400" dx="${numberLabel ? 6 : 14}">${escapeXml(title)}</tspan>` : '';
  const date = item.date
    ? `
  <text x="${badgeLeft - 12}" y="${baseline}" text-anchor="end" fill="${theme.text}" fill-opacity="0.55" font-family="${MONO}" font-size="12">${item.date}</text>`
    : '';
  return `<g${motion}>
  <rect x="${PADDING}" y="${top}" width="${width}" height="${COMPACT_ROW_HEIGHT}" rx="10" fill="${theme.tile}"/>
  <rect x="${PADDING}" y="${top + 10}" width="4" height="${COMPACT_ROW_HEIGHT - 20}" rx="2" fill="${index % 2 === 0 ? theme.border : theme.accent}"/>
  <text x="${left}" y="${baseline}" fill="${theme.text}" font-family="${FONT}" font-size="15" font-weight="700">${escapeXml(item.repo)}${stars}${number}${titleSpan}</text>
  ${renderStatusBadge(item.status, right, baseline, FONT)}${date}
</g>`;
}

export function renderCard(items: Contribution[], options: RenderOptions): string {
  const { theme } = options;
  const compact = options.layout === 'compact';
  const rowHeight = compact ? COMPACT_ROW_HEIGHT : ROW_HEIGHT;
  const rowGap = compact ? COMPACT_ROW_GAP : ROW_GAP;
  const padding = compact ? 20 : PADDING;
  const top = options.hideTitle ? padding : HEADER_HEIGHT + (compact ? 0 : 8);
  const rows = items.length === 0 ? 1 : items.length;
  const height = top + rows * rowHeight + (rows - 1) * rowGap + padding;
  const repositories = new Set(items.map((item) => item.repo.toLowerCase())).size;
  const summary = `${items.length} contribution${items.length === 1 ? '' : 's'} · ${repositories} repo${repositories === 1 ? '' : 's'}`;
  const label = escapeXml(`${options.title}: ${summary}`);

  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_WIDTH}" height="${height}" viewBox="0 0 ${CARD_WIDTH} ${height}" role="img" aria-label="${label}">`,
    `<title>${label}</title>`,
    renderAnimationStyles(options.animated),
    `<rect x="1" y="1" width="${CARD_WIDTH - 2}" height="${height - 2}" rx="16" fill="${theme.background}" stroke="${theme.border}" stroke-width="2"/>`,
  ];
  if (options.animated) {
    parts.push(`<rect class="border-shimmer" x="2" y="2" width="${CARD_WIDTH - 4}" height="${height - 4}" rx="15" pathLength="100" stroke="${theme.accent}"/>`);
  }
  if (!options.hideTitle) {
    const titleMotion = options.animated ? ' class="card-title-motion"' : '';
    parts.push(`<g${titleMotion}>
  <text x="${PADDING}" y="44" fill="${theme.accent}" font-family="${FONT}" font-size="22" font-weight="700">${escapeXml(options.title)}</text>
  <text x="${CARD_WIDTH - PADDING}" y="44" text-anchor="end" fill="${theme.text}" fill-opacity="0.6" font-family="${MONO}" font-size="12">${escapeXml(summary.toUpperCase())}</text>
</g>`);
  }

  if (items.length === 0) {
    parts.push(
      `<text x="${CARD_WIDTH / 2}" y="${top + rowHeight / 2 + 6}" text-anchor="middle" fill="${theme.text}" fill-opacity="0.72" font-family="${FONT}" font-size="16">No contributions yet</text>`,
    );
  }
  items.forEach((item, index) => {
    const rowTop = top + index * (rowHeight + rowGap);
    parts.push(compact ? renderCompactRow(item, index, rowTop, options) : renderRow(item, index, rowTop, options));
  });

  parts.push('</svg>');
  return parts.join('\n');
}

export function renderErrorCard(message: string, theme: CardTheme): string {
  const safeMessage = escapeXml(message);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="120" viewBox="0 0 600 120" role="img" aria-label="${safeMessage}">
  <rect x="1" y="1" width="598" height="118" rx="14" fill="${theme.background}" stroke="${theme.border}" stroke-width="2"/>
  <text x="300" y="68" text-anchor="middle" fill="${theme.text}" font-family="${FONT}" font-size="18">${safeMessage}</text>
</svg>`;
}
