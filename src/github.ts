import type { Contributions, PullRequest } from './types.js';

const endpoint = 'https://api.github.com/graphql';
// GitHub search stops at 1,000 results, which is 10 pages of 100.
const maxPages = 10;

const query = `query($search: String!, $login: String!, $cursor: String) {
  user(login: $login) { organizations(first: 100) { nodes { login } } }
  search(query: $search, type: ISSUE, first: 100, after: $cursor) {
    pageInfo { hasNextPage endCursor }
    nodes {
      ... on PullRequest {
        number title url mergedAt
        repository { nameWithOwner isPrivate stargazerCount owner { login } }
      }
    }
  }
}`;

interface SearchNode {
  mergedAt?: string | null;
  number?: number;
  repository?: { isPrivate: boolean; nameWithOwner: string; owner: { login: string }; stargazerCount: number };
  title?: string;
  url?: string;
}

interface SearchResponse {
  data?: {
    search: { nodes: SearchNode[]; pageInfo: { endCursor: string | null; hasNextPage: boolean } };
    user: { organizations: { nodes: { login: string }[] } } | null;
  };
  errors?: { message: string }[];
}

export class GitHubError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

function toPullRequest(node: SearchNode): PullRequest | null {
  if (!node.repository || !node.mergedAt || node.number === undefined || !node.title || !node.url) return null;
  return {
    mergedAt: node.mergedAt,
    number: node.number,
    owner: node.repository.owner.login,
    private: node.repository.isPrivate,
    repo: node.repository.nameWithOwner,
    stars: node.repository.stargazerCount,
    title: node.title,
    url: node.url,
  };
}

export async function fetchContributions(
  username: string,
  token: string,
  fetchImpl: typeof fetch = fetch,
): Promise<Contributions> {
  const pullRequests: PullRequest[] = [];
  let organizations: string[] = [];
  let cursor: string | null = null;

  for (let page = 0; page < maxPages; page += 1) {
    const response = await fetchImpl(endpoint, {
      body: JSON.stringify({
        query,
        variables: { cursor, login: username, search: `is:pr is:merged author:${username} -user:${username}` },
      }),
      headers: { Authorization: `bearer ${token}`, 'Content-Type': 'application/json', 'User-Agent': 'github-oss-card' },
      method: 'POST',
    });
    if (!response.ok) throw new GitHubError(`GitHub responded with ${response.status}`, 502);

    const payload = (await response.json()) as SearchResponse;
    if (!payload.data || payload.errors?.length) {
      const notFound = payload.errors?.some((error) => error.message.includes('Could not resolve to a User'));
      throw notFound ? new GitHubError(`Unknown user: ${username}`, 404) : new GitHubError('GitHub query failed', 502);
    }
    if (!payload.data.user) throw new GitHubError(`Unknown user: ${username}`, 404);

    organizations = payload.data.user.organizations.nodes.map((organization) => organization.login);
    for (const node of payload.data.search.nodes) {
      const pullRequest = toPullRequest(node);
      if (pullRequest) pullRequests.push(pullRequest);
    }

    const { endCursor, hasNextPage } = payload.data.search.pageInfo;
    if (!hasNextPage || !endCursor) break;
    cursor = endCursor;
  }

  return { organizations, pullRequests };
}

export interface SelectOptions {
  exclude: Set<string>;
  limit: number;
  minStars: number;
  username: string;
}

// Keeps merged PRs to other people's public projects: drops the user's own
// account and organizations, low-star repositories and explicit exclusions.
export function selectContributions(contributions: Contributions, options: SelectOptions): PullRequest[] {
  const ownOwners = new Set([options.username, ...contributions.organizations].map((owner) => owner.toLowerCase()));

  return contributions.pullRequests
    .filter((pullRequest) => !pullRequest.private)
    .filter((pullRequest) => !ownOwners.has(pullRequest.owner.toLowerCase()))
    .filter((pullRequest) => pullRequest.stars >= options.minStars)
    .filter((pullRequest) => !options.exclude.has(pullRequest.repo.toLowerCase()))
    .sort((a, b) => b.stars - a.stars || b.mergedAt.localeCompare(a.mergedAt))
    .slice(0, options.limit);
}
