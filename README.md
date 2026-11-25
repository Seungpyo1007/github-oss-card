<div align="center">

<img src="./public/favicon.svg" width="96" alt="GitHub OSS Card logo" />

# GitHub OSS Card

An animated SVG card of the open source pull requests you are proud of, for your GitHub profile README.

<a href="https://github.com/Seungpyo1007/github-oss-card/actions/workflows/ci.yml"><img src="https://github.com/Seungpyo1007/github-oss-card/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
<a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-89CFF0" alt="MIT License" /></a>
<a href="https://github-oss-card.vercel.app"><img src="https://img.shields.io/badge/demo-live-CBAACB" alt="Live demo" /></a>

[Open the builder](https://github-oss-card.vercel.app/) · [Live card](https://github-oss-card.vercel.app/api/card?v=1) · [API options](#api-options) · [Self-hosting](#self-hosting) · [Contributing](#contributing)

</div>

<p align="center">
  <img
    src="https://github-oss-card.vercel.app/api/card?v=1"
    width="94%"
    alt="Example open source contributions card"
  />
</p>

## Features

- Visual builder: add up to 10 contributions, reorder them, and see the card update live.
- Each row takes a repository plus optional PR number, title, star count, date and status.
- Star counts stay current: the card asks GitHub for the live number every time it is rendered.
- Six layouts, from the detailed default to tile rows that sit next to Tech Stack Card.
- One-click **Fill from GitHub** in the builder pulls stars, title, date and state for a row.
- GitHub-style state badges with Octicons: Merged, Open, Closed and Draft.
- Everything is encoded in the card URL. No sign-in, nothing stored on a server.
- Vertical, animated layout with the same themes as [Tech Stack Card](https://github.com/Seungpyo1007/github-tech-stack-card).
- Self-contained SVG: no external images, so it renders through GitHub's image proxy.

## Quick start

1. Open the [builder](https://github-oss-card.vercel.app/).
2. Fill in your contributions and pick a style.
3. Copy the Markdown line into your README:

```md
![Open source contributions](https://github-oss-card.vercel.app/api/card?items=...&v=1)
```

Without `items`, the API renders an example card.

## API options

`GET /api/card`

| Parameter | Default | Description |
|---|---|---|
| `items` | example card | Contributions token made by the builder (see below) |
| `theme` | `shiny` | `shiny`, `github_dark`, `light` |
| `layout` | `rows` | `rows`, `compact`, `grouped`, `tiles`, `tiles-title` or `tiles-square` (see [Layouts](#layouts)) |
| `title` | `Open Source Contributions` | Card title, up to 48 characters |
| `hide_title` | `false` | Hide the header line |
| `animation` | `true` | `false` disables motion |
| `live` | `true` | `false` shows the values in the token as they are, without asking GitHub |
| `bg_color`, `border_color`, `title_color`, `text_color`, `tile_color` | theme | 3 or 6 digit hex, with or without `#` |

### The `items` token

`items` is base64url-encoded JSON. The builder writes it for you, but you can also make one yourself:

```json
{
  "v": 1,
  "items": [
    { "repo": "ahujasid/mcp-for-blender", "number": 342, "title": "feat: Pro account toggle", "stars": 29157, "date": "2026-09-15", "status": "merged" },
    { "repo": "python/python-docs-ko", "number": 1199 }
  ]
}
```

| Field | Required | Rule |
|---|---|---|
| `repo` | yes | `owner/name` |
| `number` | no | PR number, 1 or more |
| `title` | no | Up to 100 characters |
| `stars` | no | Whole number, shown as `29.2k`. Replaced by the live count when GitHub answers |
| `date` | no | `YYYY-MM-DD` |
| `status` | no | `merged` (default), `open`, `closed` or `draft` |

A token holds 1 to 10 items. An invalid token returns an error card with status 400.

### Live data

A token is a snapshot, so on its own the numbers in it would never change. When the card is rendered it
therefore asks the GitHub API for fresh values:

- **Stars** are refreshed for every item that has a `stars` field. Leave the field out to show no stars.
- **Status** is refreshed for items with a `number`, but only when the deployment has a `GITHUB_TOKEN`
  (see [Self-hosting](#self-hosting)).

GitHub responses are cached in memory for 30 minutes. If GitHub is slow, rate limited or down, the card
falls back to the values in the token instead of failing. Pass `live=false` to turn this off.

## Layouts

| Layout | What it shows |
|---|---|
| `rows` | Default. One two-line row per contribution with the full state badge |
| `compact` | One line per contribution, roughly half the height of `rows` |
| `grouped` | Pull requests listed under their repository, one line each with a small state icon |
| `tiles` | Each repository is a row of tiles showing the state icon and PR number |
| `tiles-title` | Like `tiles`, with a shortened title inside each tile |
| `tiles-square` | Square tiles the size of Tech Stack Card's logo tiles |

`grouped` and the `tiles` layouts group by repository and follow the row style of
[Tech Stack Card](https://github.com/Seungpyo1007/github-tech-stack-card), so the two cards line up when stacked.

## Themes

| Theme | Background | Accent | Border |
|---|---|---|---|
| `shiny` | `#0F1B2A` | `#89CFF0` | `#CBAACB` |
| `github_dark` | `#0D1117` | `#58A6FF` | `#30363D` |
| `light` | `#FFFFFF` | `#0969DA` | `#D0D7DE` |

## Caching

Cards are cached for 6 hours at the CDN, so live star counts can lag by a few hours. GitHub also caches
README images, so after editing your card change a throwaway parameter such as `&v=1` to `&v=2`.

## Development

```bash
pnpm install
pnpm check        # lint, typecheck, tests, build
pnpm dev          # Astro site only
pnpm dev:vercel   # site + /api/card through vercel dev
```

## Self-hosting

Fork this repository and import it into Vercel. No environment variables are required.

Setting `GITHUB_TOKEN` is recommended. Without it the card uses GitHub's unauthenticated API, which
allows only 60 requests an hour per IP address and is shared with other apps on the same host, so star
counts may fall back to the token values more often. A fine-grained token with no extra permissions
(public read-only) is enough; it also turns on live pull request states.

## Contributing

This repository uses Git Flow. Branch `feature/*` from `develop`, use Conventional Commits, and open pull
requests against `develop`. Releases are cut from `release/*` into `main`.

## License

[MIT](LICENSE)

State icons are [GitHub Octicons](https://github.com/primer/octicons) (MIT).
