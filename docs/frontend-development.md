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

Manual browser smoke:
- open `http://localhost:3001`;
- open the demo profile `76561198000000000`;
- open a seeded game such as `910001`;
- verify Sync Profile, Sync Games, and Sync Achievements enqueue through the
  SDK;
- verify sync runs update and stop polling when terminal;
- verify unknown achievement unlock state is shown as unknown, not locked.

The sync buttons enqueue through the generated SDK. After enqueue, the profile
page refreshes sync runs immediately, polls every few seconds while the relevant
run is `queued` or `running`, and stops once that run reaches a terminal status.
