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

- `AuthApi`
- `ProfilesApi`
- `GamesApi`
- `AchievementsApi`
- `SyncApi`
- `HealthApi`

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

## Auth UI

Auth is Steam-only. The frontend does not implement email/password auth,
protected settings pages, or role dashboards yet.

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

## Public Dashboard Sections

The profile page is organized as:

- profile header (avatar, persona, Steam ID, visibility, last synced);
- summary cards (total games, completed games, totals/unlocked/remaining, average
  completion);
- sync action panel;
- game library;
- nearest completions;
- rarest achievements;
- sync history.

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
- verify Sync Profile, Sync Games, and Sync Achievements enqueue through the
  SDK;
- verify sync runs update and stop polling when terminal;
- verify unknown achievement unlock state is shown as unknown, not locked;
- verify filter controls update URL params and apply after search/sort/status changes;
- verify the demo profile link on home and game detail back link work.

Auth note:
- auth schema tables exist in SQL (`app_users`, `user_steam_accounts`,
  `auth_sessions`, `user_preferences`, `public_profiles`);
- auth runtime and minimal frontend auth UI are implemented;
- protected settings pages and role-specific dashboards are intentionally
  deferred.

The sync buttons enqueue through the generated SDK. After enqueue, the profile
page refreshes sync runs immediately, polls every few seconds while the relevant
run is `queued` or `running`, and stops once that run reaches a terminal status.
