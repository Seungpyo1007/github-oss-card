import type { Contributions, PullRequest } from '../src/types.js';

function pr(repo: string, number: number, stars: number, mergedAt: string, title: string, isPrivate = false): PullRequest {
  return {
    mergedAt,
    number,
    owner: repo.split('/')[0]!,
    private: isPrivate,
    repo,
    stars,
    title,
    url: `https://github.com/${repo}/pull/${number}`,
  };
}

// Shaped after Seungpyo1007's real search results: most merged PRs live in the
// user's own organizations and only three land in other people's projects.
export const contributions: Contributions = {
  organizations: ['GetTechAPI', 'SeoulPrism'],
  pullRequests: [
    pr('GetTechAPI/TechAPI', 196, 4, '2026-09-22T05:00:00Z', 'feat(site): support PUBLIC_API_BASE_URL'),
    pr('GetTechAPI/TechEngine', 70, 2, '2026-09-22T04:00:00Z', 'feat(verify): GSMArena source_urls backfill tool'),
    pr('SeoulPrism/SeoulPrism', 21, 1, '2026-05-12T00:00:00Z', 'feat: destination voting'),
    pr('SchutzScript/Schutz', 87, 1, '2026-08-01T00:00:00Z', 'End of updates, not archived'),
    pr('someone/tiny-lib', 3, 2, '2026-07-01T00:00:00Z', 'fix: typo'),
    pr('secret-org/internal', 9, 500, '2026-07-02T00:00:00Z', 'feat: private work', true),
    pr('ahujasid/mcp-for-blender', 342, 29157, '2026-09-15T09:47:06Z', 'feat: International (Pro) account toggle for Hunyuan3D Official API'),
    pr('ahujasid/mcp-for-blender', 344, 29157, '2026-09-16T00:00:00Z', 'feat: export_scene command and MCP tool (GLB/FBX to a caller-chosen path)'),
    pr('python/python-docs-ko', 1199, 77, '2026-08-20T00:00:00Z', '#975 translate library/bz2.po'),
  ],
};
