<div align="center">

<img src="./public/favicon.svg" width="96" alt="GitHub OSS Card logo" />

# GitHub OSS Card

A live SVG card of the pull requests you got merged into other people's open source projects.

<a href="https://github.com/Seungpyo1007/github-oss-card/actions/workflows/ci.yml"><img src="https://github.com/Seungpyo1007/github-oss-card/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
<a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-89CFF0" alt="MIT License" /></a>
<a href="https://github-oss-card.vercel.app"><img src="https://img.shields.io/badge/demo-live-CBAACB" alt="Live demo" /></a>

[Open the builder](https://github-oss-card.vercel.app/) · [Live card](https://github-oss-card.vercel.app/api/card?username=Seungpyo1007&v=1) · [API options](#api-options) · [Self-hosting](#self-hosting) · [Contributing](#contributing)

</div>

<p align="center">
  <img
    src="https://github-oss-card.vercel.app/api/card?username=Seungpyo1007&v=1"
    width="94%"
    alt="Seungpyo1007 open source contributions"
  />
</p>

## Features

- Finds merged pull requests automatically with the GitHub GraphQL search API.
- Leaves out your own account and organizations, so only work in other people's projects is shown.
- Hides low-star repositories by default (`min_stars`) and lets you exclude any repository.
- Vertical, animated layout with the same themes as [Tech Stack Card](https://github.com/Seungpyo1007/github-tech-stack-card).
- Self-contained SVG: no external images, so it renders through GitHub's image proxy.

## Quick start

```md
![Open source contributions](https://github-oss-card.vercel.app/api/card?username=YOUR_USERNAME)
```

Or pick options in the [builder](https://github-oss-card.vercel.app/) and copy the snippet.

## API options

`GET /api/card`

| Parameter | Default | Description |
|---|---|---|
| `username` | `Seungpyo1007` | GitHub login |
| `min_stars` | `10` | Hide repositories with fewer stars (0 – 1,000,000) |
| `limit` | `6` | Maximum number of pull requests (1 – 10) |
| `exclude` | | Comma-separated `owner/repo` list to hide |
| `theme` | `shiny` | `shiny`, `github_dark`, `light` |
| `title` | `Open Source Contributions` | Card title, up to 48 characters |
| `hide_title` | `false` | Hide the header line |
| `animation` | `true` | `false` disables motion |
| `bg_color`, `border_color`, `title_color`, `text_color`, `tile_color` | theme | 3 or 6 digit hex, with or without `#` |

Pull requests are sorted by repository stars, then by merge date.

## Themes

| Theme | Background | Accent | Border |
|---|---|---|---|
| `shiny` | `#0F1B2A` | `#89CFF0` | `#CBAACB` |
| `github_dark` | `#0D1117` | `#58A6FF` | `#30363D` |
| `light` | `#FFFFFF` | `#0969DA` | `#D0D7DE` |

## Caching

Cards are cached for 6 hours at the CDN (errors for 1 minute). GitHub also caches README images, so change a
throwaway parameter such as `&v=2` to force a refresh.

## Development

```bash
pnpm install
pnpm check      # lint, typecheck, tests, build
pnpm dev        # vercel dev: site + API
```

`pnpm dev` needs a `GITHUB_TOKEN` in `.env` (see below).

## Self-hosting

1. Fork this repository and import it into Vercel.
2. Create a fine-grained personal access token with **public repository read-only** access. No extra
   permissions are needed.
3. Add it as the `GITHUB_TOKEN` environment variable in Vercel and redeploy.

The token only reads public search results. It is never sent to the browser.

## Contributing

This repository uses Git Flow. Branch `feature/*` from `develop`, use Conventional Commits, and open pull
requests against `develop`. Releases are cut from `release/*` into `main`.

## License

[MIT](LICENSE)
