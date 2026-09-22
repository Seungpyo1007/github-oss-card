import type { CardTheme } from './types.js';

export const themes: Record<string, CardTheme> = {
  shiny: {
    accent: '#89CFF0',
    background: '#0F1B2A',
    border: '#CBAACB',
    text: '#FFFFFF',
    tile: '#132238',
  },
  github_dark: {
    accent: '#58A6FF',
    background: '#0D1117',
    border: '#30363D',
    text: '#F0F6FC',
    tile: '#161B22',
  },
  light: {
    accent: '#0969DA',
    background: '#FFFFFF',
    border: '#D0D7DE',
    text: '#1F2328',
    tile: '#F6F8FA',
  },
};

export function getTheme(name: string): CardTheme {
  return themes[name] ?? themes.shiny!;
}
