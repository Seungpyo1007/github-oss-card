# Changelog

All notable changes to this project are documented in this file.

## [2.0.2] - 2026-09-22

### Changed

- Pull request state is shown as a GitHub-style badge with the matching Octicon instead of plain text

### Added

- `closed` and `draft` states

## [2.0.1] - 2026-09-22

### Fixed

- The date field no longer sticks out of its contribution row on iOS Safari
- Builder inputs and selects share one height

## [2.0.0] - 2026-09-22

### Changed

- **Breaking:** the card is built from contributions you enter yourself, passed as the `items` token, instead of GitHub search. `username`, `min_stars`, `limit` and `exclude` are removed and no `GITHUB_TOKEN` is needed.
- Rows show whatever fields are given: repository, PR number, title, stars, date and `merged` / `open` status.

### Added

- Builder homepage with editable, reorderable rows, theme swatches, toggles and a live preview
- Keyword marquee, hero metrics, cursor glow and scroll reveal on the homepage

### Fixed

- `vercel dev` no longer invokes itself recursively

## [1.0.0] - 2026-09-22

### Added

- `/api/card` SVG endpoint listing merged pull requests to other people's public projects
- Automatic exclusion of the user's own account and organizations, plus `min_stars`, `limit` and `exclude` filters
- Vertical animated layout with `shiny`, `github_dark` and `light` themes and colour overrides
- Builder homepage with live preview and a copyable Markdown snippet
