export interface CardTheme {
  background: string;
  border: string;
  accent: string;
  text: string;
  tile: string;
}

export type CardLayout = 'rows' | 'compact';

export interface RenderOptions {
  animated: boolean;
  hideTitle: boolean;
  layout: CardLayout;
  theme: CardTheme;
  title: string;
}

export interface CardRequestOptions extends RenderOptions {
  itemsToken: string | null;
  live: boolean;
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
