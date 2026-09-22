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
  exclude: Set<string>;
  limit: number;
  minStars: number;
  username: string;
}

export interface PullRequest {
  mergedAt: string;
  number: number;
  owner: string;
  private: boolean;
  repo: string;
  stars: number;
  title: string;
  url: string;
}

export interface Contributions {
  organizations: string[];
  pullRequests: PullRequest[];
}
