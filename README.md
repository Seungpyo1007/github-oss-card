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
- Each row takes a repository plus optional PR number, title, star count, date and status (`merged` or `open`).
- Everything is encoded in the card URL. No sign-in, no token, nothing stored on a server.
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
| `title` | `Open Source Contributions` | Card title, up to 48 characters |
| `hide_title` | `false` | Hide the header line |
| `animation` | `true` | `false` disables motion |
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
| `stars` | no | Whole number, shown as `29.2k` |
| `date` | no | `YYYY-MM-DD` |
| `status` | no | `merged` (default) or `open` |

A token holds 1 to 10 items. An invalid token returns an error card with status 400.

## Themes

| Theme | Background | Accent | Border |
|---|---|---|---|
| `shiny` | `#0F1B2A` | `#89CFF0` | `#CBAACB` |
| `github_dark` | `#0D1117` | `#58A6FF` | `#30363D` |
| `light` | `#FFFFFF` | `#0969DA` | `#D0D7DE` |

## Caching

Cards are cached for 6 hours at the CDN. GitHub also caches README images, so after editing your card
change a throwaway parameter such as `&v=1` to `&v=2`.

## Development

```bash
pnpm install
pnpm check        # lint, typecheck, tests, build
pnpm dev          # Astro site only
pnpm dev:vercel   # site + /api/card through vercel dev
```

## Self-hosting

Fork this repository and import it into Vercel. No environment variables are needed.

## Contributing

This repository uses Git Flow. Branch `feature/*` from `develop`, use Conventional Commits, and open pull
requests against `develop`. Releases are cut from `release/*` into `main`.

## License

[MIT](LICENSE)
