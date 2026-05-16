---
name: frontend-nextjs-sdk
description: Use when building or refactoring the Steam Achievement Tracker Next.js frontend, especially SDK-backed data access, TanStack Query hooks, route/page structure, reusable components, frontend types, sync polling, or browser smoke validation.
metadata:
  short-description: Next.js frontend patterns for this repo
---

# Frontend Next.js SDK

Use this skill for frontend work in `apps/web`.

## Reference

The local reference project is:

```txt
/Users/neerajkumarsharmau/Desktop/projects/inoldnews/in-old-news/apps/frontend
```

Adopt its useful patterns:
- app-router pages stay thin;
- API clients are centralized;
- TanStack Query wraps API calls in hooks;
- reusable UI lives under shared component folders;
- route/domain-specific components stay close to their feature;
- validation, formatting, and state helpers are pure utilities.

Do not copy unrelated patterns from the reference app such as auth, cookies,
role layouts, media upload flows, or direct local API route fetches unless the
Steam app explicitly needs them.

## Frontend Structure

Prefer this shape:

```txt
apps/web/src/
  app/
    page.tsx
    providers.tsx
    profiles/[steamId]/page.tsx
    profiles/[steamId]/games/[steamAppId]/page.tsx
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

Keep route files focused on route params, page composition, and high-level
loading/error boundaries. Move repeated tables, cards, badges, empty states, and
forms into reusable components.

## SDK And API Rules

- Use `@steam-achievement/client-sdk` for backend endpoints.
- Configure SDK clients once in `src/lib/api/client.ts`.
- Browser calls use `NEXT_PUBLIC_API_BASE_URL`, normally
  `http://localhost:3000`.
- Do not use Docker hostname `backend` in browser-side API config.
- Do not call Steam Web API directly from frontend.
- Do not manually edit `libs/client-sdk/src/generated`.
- Do not add raw `fetch`/Axios wrappers for endpoints already in the SDK.

Raw `fetch` is acceptable only for frontend-owned Next route handlers or static
assets, not backend API endpoints that exist in OpenAPI.

## Query Hooks

Put SDK-backed hooks under `src/features/<feature>/api`.

Rules:
- Centralize query keys in a query-key factory file.
- Use one hook per backend use case.
- Query hooks should call SDK methods and return TanStack Query results.
- Keep UI side effects out of query hooks.
- Mutation hooks should invalidate the smallest relevant query-key families.
- Poll only while work is active, then stop on terminal status.
- Prefer pure helper functions for polling decisions.

Example naming:

```txt
profile-query-keys.ts
use-profile.ts
use-profile-summary.ts
use-profile-games.ts
use-sync-runs.ts
use-enqueue-sync.ts
```

Anti-patterns:
- inline query keys in components;
- calling SDK clients directly in large page components;
- duplicating the same `useQuery` setup in multiple pages;
- broad invalidation like invalidating every query when only one profile changed;
- permanent polling when the newest relevant sync run is terminal.

## Types

- Prefer generated SDK DTOs and enums for API request/response data.
- Do not duplicate backend DTO types in `apps/web`.
- Add local types only for UI state, component props, or derived view models.
- Put feature-wide UI types in `features/<feature>/types.ts`.
- Keep component-only props near the component.
- Do not use `any`; narrow unknown errors through shared helpers.

## Reusable Components

Before adding page-local markup, check whether it should be reused.

Use:
- `src/components/ui` for generic primitives: badge, button, card, input,
  table, empty state, loading state;
- `src/features/<feature>/components` for domain components such as profile
  summary cards, games table, sync panel, sync run list, achievement row;
- `src/components/layout` for shared shells/navigation.

Avoid:
- one-off status badge class functions scattered across pages;
- duplicated loading/error/empty panels;
- page files larger than necessary;
- putting API calls inside reusable visual components;
- nested card-heavy layouts when a simple section/table is clearer.

## Sync UX Rules

For `/profiles/[steamId]`:
- enqueue sync through `SyncApi.enqueueProfileSync`;
- show `syncRunId` and `jobId` after enqueue;
- refresh sync runs immediately;
- poll while the latest relevant run is `queued` or `running`;
- stop polling on `success`, `partial_success`, or `failed`;
- show safe `errorMessage` for failed runs.

For achievements:
- send `{ scope: "achievements" }` unless the UI explicitly supports selected
  app IDs;
- never require app IDs for the MVP sync button.

## Achievement Unlock State

Use `unlockState`, not only `achieved`.

Display:
- `unlocked` as unlocked;
- `locked` as locked;
- `unknown` as "Unknown unlock state".

Never present `unknown` as definitely locked. Unknown means metadata exists but
Steam did not provide player unlock state.

## Validation

For meaningful frontend changes run:

```sh
pnpm --filter @steam-achievement/client-sdk build
pnpm --filter @steam-achievement/web type-check
pnpm --filter @steam-achievement/web build
```

For Docker/browser checks:

```sh
docker-compose config --quiet
docker-compose up -d postgres redis backend web
docker-compose exec -T backend pnpm api:smoke
```

When adding tests, keep them targeted:
- unit-test pure helpers such as query keys, sync status helpers, and badge
  mappings;
- use Playwright only for high-value browser flows and keep it minimal.
