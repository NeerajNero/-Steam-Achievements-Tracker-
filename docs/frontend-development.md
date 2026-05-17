# Frontend Development

The frontend lives in `apps/web` and uses Next.js, TypeScript, Tailwind, TanStack
Query, and the generated SDK package `@steam-achievement/client-sdk`.

## Local URLs

- Frontend: `http://localhost:3001`
- Backend: `http://localhost:3000`
- Swagger UI: `http://localhost:3000/docs`
- BullMQ dashboard: `http://localhost:3000/queues`

## Frontend Skill

Before doing non-trivial frontend work, read:

```txt
skills/frontend-nextjs-sdk/SKILL.md
```

That skill captures the local frontend patterns adapted from the `in-old-news`
reference project:

```txt
/Users/neerajkumarsharmau/Desktop/projects/inoldnews/in-old-news/apps/frontend
```

Use the reference for structure and discipline, not for unrelated features such
as auth, role layouts, media upload, cookies, or frontend-owned API routes.

## Demo Profile

Seeded local demo data uses:

```txt
76561198000000000
```

Seeded demo app IDs are `910001` through `910006`.

## Run With Docker

Start the full local stack:

```sh
docker-compose up -d postgres redis backend web
```

The browser calls the backend through the published host port:

```txt
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
```

Do not use the Docker service hostname `backend` for browser-side requests. If
server-side requests are added later, use a separate internal-only variable such
as `INTERNAL_API_BASE_URL`.

### Frontend container networking

In Docker, the web container runs Next.js on container port `3000` and is
published as host `3001` (default `3001:3000` mapping).

- Dev command: `next dev --hostname 0.0.0.0 --port 3000`
- Start command: `next start --hostname 0.0.0.0 --port 3000`

Using a hostname of `localhost` or not binding to `0.0.0.0` can make the container
service unreachable from the host browser.

Do not change browser API calls to use container hostnames (`backend`); keep
`NEXT_PUBLIC_API_BASE_URL=http://localhost:3000` for client-side SDK calls.

For deterministic builds in this repo environment:

- Development keeps using `next dev --hostname 0.0.0.0 --port 3000`.
- Production/container build uses `next build --webpack`.

`--webpack` is selected here because it is more stable in local/container runs in
this environment. You can switch back to default behavior later if your target
environment is consistently stable with it.

## Run Locally

Start the backend in Docker first:

```sh
docker-compose up -d postgres redis backend
```

Then run the web app on the host:

```sh
pnpm web:dev
```

The frontend reads `NEXT_PUBLIC_API_BASE_URL`; copy
`apps/web/.env.example` to a local env file only if you need to override the
default.

## SDK Rule

Frontend API calls must use `@steam-achievement/client-sdk`. Do not add raw
`fetch` wrappers for endpoints that exist in the generated SDK.

Current SDK clients used by the frontend:

- `AccountApi`
- `AuthApi`
- `BadgesApi`
- `PublicProfilesApi`
- `ProfilesApi`
- `GamesApi`
- `LeaderboardsApi`
- `SnapshotsApi`
- `AchievementsApi`
- `SyncApi`
- `HealthApi`
- `ShowcaseApi`

SDK clients are configured in:

```txt
apps/web/src/lib/api/client.ts
```

The generated SDK is the API type source of truth. Do not duplicate backend DTOs
in `apps/web`; only create frontend-local types for component props, UI state,
or derived view models.

Reminder: do not add raw `fetch` wrappers or Axios calls for OpenAPI-backed
backend endpoints.
Reminder: regenerate SDK packages only if the backend API shape changes.
After SDK regeneration, run `pnpm sdk:build` and recreate the web container with
`docker-compose up -d --force-recreate web` so Next.js does not keep a stale SDK
module graph.

## Auth UI

Auth is Steam-only. The frontend does not implement email/password auth,
protected middleware, or role dashboards.

Minimal auth UI lives in:

```txt
apps/web/src/features/auth
```

`AuthStatus` is shown on public pages. It uses SDK-backed hooks for:

- `GET /auth/me`
- `POST /auth/logout`

The Sign in with Steam button navigates the browser to
`/auth/steam/login?returnTo=...` on the backend because OpenID login starts as a
browser redirect. That redirect navigation is the only frontend auth exception
to the SDK data-call rule.

SDK configuration uses `credentials: "include"` so the browser sends the
httpOnly session cookie to the backend.

Authenticated account settings live at:

```txt
apps/web/src/app/settings/page.tsx
apps/web/src/features/account
```

The settings page is client-side gated: signed-out users see the Steam sign-in
prompt, and signed-in users can update display fields, preferences, and public
profile publishing settings. No frontend auth middleware is required for this
step.

## App Structure

Keep `apps/web` organized around route composition, feature modules, and shared
UI:

```txt
apps/web/src/
  app/
  components/
    layout/
    ui/
  features/
    profile/
      api/
      components/
      types.ts
      utils.ts
  lib/
    api/
    query/
  utils/
```

Route files should stay small. If a page grows, move sections into
`features/<feature>/components`. Generic primitives such as buttons, badges,
cards, tables, loading states, empty states, and error panels belong under
`components/ui`.

Avoid page-local duplicates of:
- status badges;
- loading, empty, and error panels;
- tables/lists;
- sync action panels;
- achievement rows/cards.
- state chips and empty/error messaging in reusable UI components.

## Dashboard UI System

The current frontend uses a shared dark dashboard shell:

```txt
apps/web/src/components/layout
apps/web/src/components/ui
```

The information architecture is inspired by Steam achievement hunting and
profile-tracking platforms: Home, Games, Leaderboards, Guides, Sessions, and
Activity are first-class navigation items. The visual direction uses a dark
gaming dashboard foundation with green accent states. Do not copy third-party
branding, names, assets, or layouts.

Use `PageShell`, `PageHero`, `SectionCard`, `SummaryCard`, `StatusBadge`,
`ProgressBar`, `DataToolbar`, and the shared loading/empty/error states before
adding page-local card or table styling.

## Public Dashboard Sections

The profile page is organized as:

- profile header (avatar, persona, Steam ID, visibility, last synced);
- summary cards (total games, completed games, totals/unlocked/remaining, average
  completion);
- sync action panel;
- game library;
- nearest completions;
- rarest achievements;
- badges and profile showcase;
- sync history.

## Badges And Showcase

Badges and showcase UI lives in:

```txt
apps/web/src/features/badges
apps/web/src/features/showcase
```

The public profile dashboard and `/u/:slug` render earned badges and public
showcase items through SDK-backed hooks. The settings page includes a simple
showcase editor for selecting up to six earned badges. The frontend does not
upload images, call Cloudinary, or generate share cards for badges yet.

## Global Game Browsing

Public game browsing lives at:

```txt
apps/web/src/app/games/page.tsx
apps/web/src/app/games/[steamAppId]/page.tsx
apps/web/src/features/games
```

The pages use `GamesApi` through feature-scoped hooks only:

- `GET /games`
- `GET /games/:steamAppId`
- `GET /games/:steamAppId/achievements`
- `GET /games/:steamAppId/players`

These endpoints are database-backed read models. The frontend must not call the
Steam Web API directly.

The `/games` page stores filter state in URL params:

- `search`
- `hasAchievements=true|false`
- `sort=name|tracked_players|completion_rate|achievements|playtime`
- `order=asc|desc`
- `limit`
- `offset`

The game detail page keeps achievement and player filters in URL params:

- `achievementSearch`
- `hidden=all|visible|hidden`
- `achievementSort=rarity|name`
- `achievementOrder=asc|desc`
- `achievementLimit`
- `achievementOffset`
- `playerStatus=all|completed|incomplete`
- `playerSort=completion|playtime|recently_played`
- `playerOrder=asc|desc`
- `playerLimit`
- `playerOffset`

Invalid URL params are normalized to defaults before SDK hooks are called.
Tracked player links prefer `/u/:slug` when a published public profile slug is
available and otherwise fall back to `/profiles/:steamId`.

## Leaderboards And Snapshots

Leaderboard browsing lives at:

```txt
apps/web/src/app/leaderboards/page.tsx
apps/web/src/app/leaderboards/[type]/page.tsx
apps/web/src/features/leaderboards
```

The pages use `LeaderboardsApi` through feature-scoped hooks only:

- `GET /leaderboards`
- `GET /leaderboards/:type`

Supported leaderboard types are:

- `completion_percentage`
- `completed_games`
- `unlocked_achievements`
- `rarest_unlocks`

Leaderboard rows are based on the latest stored snapshot per Steam profile.
The frontend renders ranks and summary stats from the API response and does not
recompute leaderboard scores from profile progress rows.

Profile snapshots are displayed on profile dashboards from:

```txt
apps/web/src/features/snapshots
```

The snapshot hook uses `SnapshotsApi` for `GET /profiles/:steamId/snapshots`.
Snapshots are created by completed syncs and can also be created manually
through the backend snapshot endpoint by the authenticated owner of the claimed
Steam profile. There is no manual snapshot button in the frontend yet; profile
pages currently show the public snapshot history only.

## Guides And Roadmaps

Guide pages live at:

```txt
apps/web/src/app/games/[steamAppId]/guides/page.tsx
apps/web/src/app/games/[steamAppId]/guides/[slug]/page.tsx
apps/web/src/app/games/[steamAppId]/guides/new/page.tsx
apps/web/src/app/account/guides/page.tsx
apps/web/src/app/guides/[guideId]/edit/page.tsx
apps/web/src/features/guides
```

The pages use generated `GuidesApi` methods through feature-scoped hooks only:

- `GET /games/:steamAppId/guides`
- `GET /games/:steamAppId/guides/:slug`
- `POST /games/:steamAppId/guides`
- `PATCH /guides/:guideId`
- `GET /account/guides`
- `POST/PATCH /guides/:guideId/sections`
- `POST/DELETE /guides/:guideId/achievements`

The current editor is intentionally basic: metadata fields, plain textarea
sections, and achievement UUID attachment. Do not add rich text, uploads,
comments, votes, or moderation UI until the backend models for those features
exist.

Manual guide smoke:
- sign in with Steam;
- open `/games/910001/guides/new`;
- create a draft guide named `Demo Completion Roadmap`;
- add one section;
- attach one achievement UUID from Steam App `910001`;
- publish the guide from `/guides/:guideId/edit`;
- verify `/games/910001/guides`, `/games/910001/guides/:slug`, and
  `/account/guides`.

Deterministic guide auth smoke is available when a real browser session is not
practical:

```sh
docker-compose exec -T backend pnpm guide:auth-smoke
```

The script uses the demo Steam ID and app `910001`, stores only a session token
hash in PostgreSQL, never prints cookie/token values, and reports the created
guide slug. To smoke the public guide detail page afterward:

```sh
docker-compose exec -T -e WEB_URL=http://localhost:3000 \
  -e WEB_GUIDE_SLUG=<slug> web node scripts/web-smoke.js
```

If the web container reports that `GuidesApi` or another generated API export is
missing, rebuild the SDK and recreate web:

```sh
pnpm sdk:build
docker-compose up -d --force-recreate web
```

The SDK package build normalizes emitted ESM imports in `libs/client-sdk/dist`.
If this step is skipped, Node may fail to resolve generated SDK entrypoints even
when the TypeScript source exists.

## Image Rendering

Steam-provided avatars, game icons/logos, and achievement icons are stored as
external URL fields from Steam sync data and rendered directly from those URLs.
The frontend currently uses normal `<img>` elements for these small remote
images.

This is acceptable for the MVP. If these image surfaces are later migrated to
`next/image`, configure `images.remotePatterns` in `apps/web/next.config.ts` for
only the trusted Steam image hosts present in synced data. Do not add broad
wildcard remote image hosts.

Do not upload Steam-provided images to Cloudinary. Cloudinary is deferred for
user-uploaded or generated media such as profile banners, guide images, share
cards, and generated gamercards. See `docs/media-assets.md`.

## Account Settings

The settings page uses generated SDK clients through feature hooks only:

- `GET /account/me`
- `PATCH /account/me`
- `GET /account/preferences`
- `PATCH /account/preferences`
- `GET /account/public-profile`
- `PATCH /account/public-profile`

Public profile slugs are trimmed and normalized to lowercase before submission.
Valid slugs are 3 to 64 characters and may contain only lowercase letters,
digits, and hyphens. Reserved app routes such as `admin`, `api`, `auth`,
`account`, `profiles`, `games`, `settings`, `docs`, and `health` are rejected.

If a slug is saved and publishing is enabled, the UI shows a preview link:

```txt
/u/:slug
```

The account page must not expose session fields, token hashes, or internal
database identifiers beyond the public response DTOs.

## Public Profiles

Public Steam profile pages live at:

```txt
apps/web/src/app/u/[slug]/page.tsx
apps/web/src/features/public-profile
```

They fetch `GET /public-profiles/:slug` through `PublicProfilesApi`, not through
raw fetch. The page displays public Steam metadata, summary stats, nearest
completions, and rarest achievements when the owner has enabled that section.

When `showSteamId` is disabled, the frontend must not display the Steam ID or
link to the full `/profiles/:steamId` dashboard.

## Query Hooks

SDK-backed hooks live under:

```txt
apps/web/src/features/<feature>/api
```

Rules:
- centralize query keys in a query-key factory;
- create one hook per backend use case;
- call generated SDK methods inside hooks, not inside page markup;
- keep UI side effects out of query hooks;
- mutation hooks invalidate relevant profile/sync query-key families;
- use pure helpers for polling decisions and status mapping.

Anti-patterns:
- inline query keys in components;
- raw `fetch` or Axios for OpenAPI-backed endpoints;
- duplicated `useQuery` blocks for the same backend use case;
- permanent polling after the relevant sync run reaches a terminal status;
- broad invalidation of unrelated query caches.

## Library Filters

The game library uses existing SDK-backed filters with URL state:

- `search`
- `status=all|completed|incomplete|no_achievements`
- `sort=name|completion|playtime|recently_played|remaining`
- `order=asc|desc`
- `limit`
- `offset`

Defaults are normalized on the client:

- `status=all`
- `sort=completion`
- `order=desc`
- `limit=25`
- `offset=0`

Invalid values fall back to defaults instead of rendering errors.

Game detail filters (optional) use:

- `status=all|unlocked|locked`
- `sort=rarity|unlocked_at|name`
- `order=asc|desc`

Both page-level filter states are stored in URL query params so links are
shareable.

## Refreshing The SDK

After a backend API shape change:

```sh
pnpm openapi:generate
pnpm sdk:generate
pnpm --filter @steam-achievement/client-sdk build
pnpm sdk:build
```

Do not manually edit files under `libs/client-sdk/src/generated`.

## Sync Status

Sync requests are queued with `POST /profiles/:steamId/sync`. The frontend shows
the queued response and polls sync status through
`GET /profiles/:steamId/sync-runs`.

Polling should be scoped and temporary:
- refresh sync runs immediately after enqueue;
- poll every 2 to 5 seconds while the latest relevant run is `queued` or
  `running`;
- stop polling when the relevant run reaches `success`, `partial_success`, or
  `failed`;
- show safe `errorMessage` values for failed sync runs;
- show `syncRunId` and `jobId` from the queued response.

The MVP Sync Achievements button should send:

```json
{ "scope": "achievements" }
```

Do not require app IDs in the frontend until selected-app sync has a dedicated
UI.

## Achievement Unlock State

Achievement metadata can exist even when Steam does not expose player unlock
state. The game achievement response includes:

```txt
unlockState = unlocked | locked | unknown
```

The frontend must not present `unknown` as definitely locked. Use the explicit
unknown state in labels and badges.

When `unlockState` is unknown:

- use a dedicated “Unknown unlock state” label;
- avoid any UI that implies certainty (for example a locked icon or “locked”
  action text).

## Checks

Run these after meaningful frontend changes:

```sh
pnpm --filter @steam-achievement/client-sdk build
pnpm --filter @steam-achievement/web type-check
pnpm --filter @steam-achievement/web test
pnpm --filter @steam-achievement/web build
```

The current unit tests cover stable query keys, sync terminal/polling helpers,
and unlock-state label styling. Keep these tests focused on reusable helpers and
components; do not add a large browser test setup until the flow needs it.

Docker/browser smoke:

```sh
docker-compose config --quiet
docker-compose up -d postgres redis backend web
docker-compose exec -T backend pnpm api:smoke
```

Run the frontend smoke check:

```sh
pnpm web:smoke
```

If `localhost:3001` is not reachable, inspect:

```sh
docker-compose ps web
docker-compose logs web --tail=100
docker-compose inspect steam-tracker-web --format '{{json .State.Health }}'
```

Look for:

- web container in `Up` state;
- port map showing `0.0.0.0:3001->3000`;
- Next logs showing it is listening on `0.0.0.0:3000`;
- container health status `healthy` (if healthcheck is enabled).

Manual browser smoke:
- open `http://localhost:3001`;
- open the demo profile `76561198000000000`;
- open a seeded game such as `910001`;
- open `http://localhost:3001/games`;
- open `http://localhost:3001/games/910001`;
- open `http://localhost:3001/sessions`;
- open `http://localhost:3001/games/910001/sessions`;
- verify global game filters update URL params;
- verify game achievement and tracked-player sections render;
- verify session status filters update URL params;
- verify Sync Profile, Sync Games, and Sync Achievements enqueue through the
  SDK;
- verify sync runs update and stop polling when terminal;
- verify unknown achievement unlock state is shown as unknown, not locked;
- verify filter controls update URL params and apply after search/sort/status changes;
- verify the demo profile link on home and game detail back link work.

Auth note:
- auth schema tables exist in SQL (`app_users`, `user_steam_accounts`,
  `auth_sessions`, `user_preferences`, `public_profiles`);
- auth runtime, minimal frontend auth UI, and account settings are implemented;
- protected middleware and role-specific dashboards are intentionally deferred.

Manual auth smoke:
- open `http://localhost:3001`;
- click `Sign in with Steam`;
- complete Steam login;
- verify `AuthStatus` changes from guest to signed-in user;
- verify the linked Steam ID is shown;
- click `Sign out`;
- verify `AuthStatus` returns to guest state.

Manual settings/public profile smoke:
- sign in with Steam;
- open `http://localhost:3001/settings`;
- update display name or avatar URL;
- set a public slug and toggle publishing settings;
- open `http://localhost:3001/u/<slug>`;
- verify private account settings, session fields, and token data are not shown;
- logout and verify `/settings` returns to the sign-in prompt while the public
  slug page still follows the `isPublic` setting.

Use `localhost` consistently for the whole login flow. Do not start on
`127.0.0.1` and return to `localhost` or vice versa because auth cookies are
host-bound. `BACKEND_PUBLIC_URL` should remain `http://localhost:3000` and
`FRONTEND_PUBLIC_URL` should remain `http://localhost:3001` for local browser
auth. If the frontend receives `auth_error=<reason_code>`, check the backend
callback logs for the matching safe reason code without copying OpenID callback
URLs, cookie values, or token data.

For auth data calls, the frontend uses `AuthApi` with `credentials: "include"`.
The only direct browser navigation is the Sign in with Steam redirect to
`/auth/steam/login`.

The sync buttons enqueue through the generated SDK. After enqueue, the profile
page refreshes sync runs immediately, polls every few seconds while the relevant
run is `queued` or `running`, and stops once that run reaches a terminal status.

## Gaming Sessions UI

Gaming session frontend routes:

- `/sessions`: public global session browse page.
- `/sessions/:sessionId`: public or participant-visible session detail page.
- `/games/:steamAppId/sessions`: public sessions for one Steam game.
- `/games/:steamAppId/sessions/new`: authenticated create form.
- `/sessions/:sessionId/edit`: host/admin/moderator edit form and achievement
  attachment.

The frontend uses `SessionsApi` from `@steam-achievement/client-sdk`; do not add
raw fetch or Axios wrappers for these endpoints. Sign-in prompts are client-side
for now, matching the existing settings/guides pattern.

The session forms intentionally use plain datetime inputs. Calendar integration,
reminders, real-time chat, uploads, and payment-related features are deferred.
Flat session comments exist on the session detail page, but they are not a chat
replacement.

## Community UI

Guide detail pages render:

- guide vote controls through `CommunityApi`;
- visible guide comments through `CommunityApi`;
- a comment form for signed-in users;
- a report form through `ReportsApi`.

Session detail pages render:

- visible session comments through `CommunityApi`;
- a comment form for signed-in users;
- a report form through `ReportsApi`.

Keep these interactions SDK-backed. Do not add raw fetch or Axios wrappers for
community endpoints. Report forms create private moderation-intake rows only;
there is no moderation dashboard, nested thread UI, or real-time update loop yet.

Run deterministic backend smoke after seed data when changing sessions:

```sh
docker-compose exec -T backend pnpm session:auth-smoke
```

Optional web smoke can check a known session detail route when a smoke-created
session ID is provided:

```sh
docker-compose exec -T -e WEB_URL=http://localhost:3000 -e WEB_SESSION_ID=<session-id> web node scripts/web-smoke.js
```

## Activity And Milestones UI

Activity and milestone frontend surfaces are SDK-backed:

- `/activity` renders the latest public activity feed using `ActivityApi`.
- `/profiles/:steamId` renders recent activity and milestones for the profile.
- `/games/:steamAppId` renders recent game activity.
- `/u/:slug` renders public profile activity and milestones when the public
  profile response includes a Steam ID.

The feed is not real-time and does not poll. It reads current public events from
PostgreSQL through the generated SDK. Do not add raw fetch or Axios wrappers for
activity or milestone endpoints.

`web-smoke` checks `/activity` with the marker `Steam Activity`.
