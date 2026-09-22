export interface CardTheme {
  background: string;
  border: string;
  accent: string;
  text: string;
  tile: string;
}

export interface RenderOptions {
  animated: boolean;
  hideTitle: boolean;
  theme: CardTheme;
  title: string;
}

export interface CardRequestOptions extends RenderOptions {
  itemsToken: string | null;
}

export type ContributionStatus = 'merged' | 'open' | 'closed' | 'draft';

export interface Contribution {
  date?: string;
  number?: number;
  repo: string;
  stars?: number;
  status: ContributionStatus;
  title?: string;
}

export interface ContributionsConfigV1 {
  v: 1;
  items: Contribution[];
}
