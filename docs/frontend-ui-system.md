# Frontend UI System

The frontend uses a Steam-only achievement hunting information architecture
with a dark gaming dashboard visual direction. The style is category-inspired
by profile tracking and console dashboard products, but it must not copy
external branding, assets, names, or layouts pixel-for-pixel.

## Navigation Map

Primary navigation:

- Home
- Games
- Leaderboards
- Guides
- Sessions
- Activity

Authenticated users also see Settings through the auth status control. Account
guide management lives at `/account/guides`.

## Shared Layout

Shared layout components live under:

```txt
apps/web/src/components/layout
apps/web/src/components/ui
```

Core primitives:

- `AppShell`
- `TopNav`
- `PageShell`
- `PageHero`
- `SectionCard`
- `SummaryCard`
- `StatusBadge`
- `ProgressBar`
- `DataToolbar`
- `EmptyState`, `ErrorState`, `LoadingState`

Route files should compose these primitives with feature components. Keep API
hooks in feature `api` folders and do not call SDK clients directly from page
components unless an existing feature hook does not yet exist.

## Visual Rules

- Use the dark slate dashboard background.
- Use lime/green as the main gaming accent.
- Use cards and tables with subtle borders, not heavy decorative gradients.
- Keep text readable on mobile and desktop.
- Use visible loading, error, and empty states.
- Keep unknown achievement unlock state visually distinct from locked.
- Do not add copied console or third-party tracker branding.

## Smoke Routes

`apps/web/scripts/web-smoke.js` checks stable local routes:

- `/`
- `/profiles/76561198000000000`
- `/profiles/76561198000000000/games/910001`
- `/games`
- `/games/910001`
- `/games/910001/guides`
- `/games/910001/guides/new`
- `/games/910001/sessions`
- `/games/910001/sessions/new`
- `/leaderboards`
- `/leaderboards/completion_percentage`
- `/activity`
- `/settings`
- `/sessions`
- `/account/guides`
- `/badges`

Optional environment checks:

- `WEB_PUBLIC_PROFILE_SLUG`
- `WEB_GUIDE_SLUG`
- `WEB_SESSION_ID`

If stable route checks fail after file moves or shared component additions,
clear the Next cache and recreate the web container:

```sh
pnpm web:clean
pnpm web:recreate
```
