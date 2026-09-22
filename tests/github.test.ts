import { describe, expect, it, vi } from 'vitest';

import { fetchContributions, GitHubError, selectContributions } from '../src/github.js';
import { contributions } from './fixtures.js';

const defaults = { exclude: new Set<string>(), limit: 6, minStars: 10, username: 'Seungpyo1007' };

function page(nodes: unknown[], hasNextPage: boolean, endCursor: string | null = null) {
  return new Response(
    JSON.stringify({
      data: {
        search: { nodes, pageInfo: { endCursor, hasNextPage } },
        user: { organizations: { nodes: [{ login: 'GetTechAPI' }] } },
      },
    }),
  );
}

const node = {
  mergedAt: '2026-09-15T09:47:06Z',
  number: 342,
  repository: { isPrivate: false, nameWithOwner: 'ahujasid/mcp-for-blender', owner: { login: 'ahujasid' }, stargazerCount: 29157 },
  title: 'feat: International (Pro) account toggle',
  url: 'https://github.com/ahujasid/mcp-for-blender/pull/342',
};

describe('selectContributions', () => {
  it('keeps only merged PRs to other public projects', () => {
    const selected = selectContributions(contributions, defaults).map((pullRequest) => `${pullRequest.repo}#${pullRequest.number}`);
    expect(selected).toEqual(['ahujasid/mcp-for-blender#344', 'ahujasid/mcp-for-blender#342', 'python/python-docs-ko#1199']);
  });

  it('lowers the star floor on request', () => {
    const selected = selectContributions(contributions, { ...defaults, minStars: 0 });
    expect(selected.map((pullRequest) => pullRequest.repo)).toContain('someone/tiny-lib');
    expect(selected.map((pullRequest) => pullRequest.owner)).not.toContain('GetTechAPI');
  });

  it('honours exclusions case-insensitively and the limit', () => {
    const selected = selectContributions(contributions, { ...defaults, exclude: new Set(['python/python-docs-ko']), limit: 1 });
    expect(selected).toHaveLength(1);
    expect(selected[0]?.repo).toBe('ahujasid/mcp-for-blender');
  });
});

describe('fetchContributions', () => {
  it('follows pagination and maps nodes', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(page([node, {}], true, 'cursor-1'))
      .mockResolvedValueOnce(page([{ ...node, number: 344 }], false));

    const result = await fetchContributions('Seungpyo1007', 'token', fetchMock);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const secondBody = JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body)) as { variables: { cursor: string; search: string } };
    expect(secondBody.variables.cursor).toBe('cursor-1');
    expect(secondBody.variables.search).toBe('is:pr is:merged author:Seungpyo1007 -user:Seungpyo1007');
    expect(result.organizations).toEqual(['GetTechAPI']);
    expect(result.pullRequests.map((pullRequest) => pullRequest.number)).toEqual([342, 344]);
  });

  it('reports unknown users as 404', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ data: null, errors: [{ message: "Could not resolve to a User with the login of 'x'." }] })),
    );
    await expect(fetchContributions('x', 'token', fetchMock)).rejects.toMatchObject({ status: 404 });
  });

  it('reports HTTP failures as 502', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response('nope', { status: 401 }));
    const error = await fetchContributions('Seungpyo1007', 'bad', fetchMock).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(GitHubError);
    expect((error as GitHubError).status).toBe(502);
  });
});
