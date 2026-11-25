import { getTheme } from './themes.js';
import { cardLayouts } from './types.js';
import type { CardLayout, CardRequestOptions, CardTheme } from './types.js';

type QueryValue = string | string[] | undefined;
export type CardQuery = Record<string, QueryValue>;

const colorPattern = /^(?:#|%23)?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const defaultTitle = 'Open Source Contributions';

function first(value: QueryValue): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parseColor(value: QueryValue, fallback: string): string {
  const match = first(value)?.match(colorPattern);
  if (!match?.[1]) return fallback;
  const color = match[1];
  const expanded = color.length === 3 ? color.split('').map((character) => character.repeat(2)).join('') : color;
  return `#${expanded.toUpperCase()}`;
}

function parseBoolean(value: QueryValue): boolean {
  return ['1', 'true', 'yes'].includes((first(value) ?? '').toLowerCase());
}

// For flags that are on unless explicitly switched off (`animation`, `live`).
function parseEnabled(value: QueryValue): boolean {
  return !['0', 'false', 'no', 'none'].includes((first(value) ?? '').toLowerCase());
}

function withCustomColors(theme: CardTheme, query: CardQuery): CardTheme {
  return {
    ...theme,
    accent: parseColor(query.title_color, theme.accent),
    background: parseColor(query.bg_color, theme.background),
    border: parseColor(query.border_color, theme.border),
    text: parseColor(query.text_color, theme.text),
    tile: parseColor(query.tile_color, theme.tile),
  };
}

function parseLayout(value: QueryValue): CardLayout {
  const layout = first(value) as CardLayout;
  return cardLayouts.includes(layout) ? layout : 'rows';
}

function parseTitle(value: QueryValue): string {
  const title = [...(first(value) ?? defaultTitle)]
    .filter((character) => character.charCodeAt(0) >= 32 && character.charCodeAt(0) !== 127)
    .join('')
    .trim();
  return title ? [...title].slice(0, 48).join('') : defaultTitle;
}

export function parseCardOptions(query: CardQuery): CardRequestOptions {
  return {
    animated: parseEnabled(query.animation),
    hideTitle: parseBoolean(query.hide_title),
    itemsToken: first(query.items) ?? null,
    layout: parseLayout(query.layout),
    live: parseEnabled(query.live),
    theme: withCustomColors(getTheme(first(query.theme) ?? 'shiny'), query),
    title: parseTitle(query.title),
  };
}
