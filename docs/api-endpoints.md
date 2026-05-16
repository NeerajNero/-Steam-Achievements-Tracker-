# API Endpoints

These MVP endpoints are database-backed only. They read from the migrated
PostgreSQL schema through database-facing services backed by Drizzle
repositories, and do not call the live Steam API.

Interactive API documentation is available locally at:

- Swagger UI: `http://localhost:3000/docs`
- OpenAPI JSON: `http://localhost:3000/openapi.json`

The generated OpenAPI contract is written to `docs/openapi/openapi.json`, and
the frontend SDK is generated in `libs/client-sdk`.

## Profiles

### `GET /profiles/:steamId`

Returns profile metadata already stored in the database.

Response shape:
- `id`
- `steamId`
- `personaName`
- `avatarUrl`
- `profileUrl`
- `visibilityState`
- `isPrivate`
- `lastSyncedAt`
- `createdAt`
- `updatedAt`

Returns `404` when the profile has not been synced into the database.

### `GET /profiles/:steamId/summary`

Returns the dashboard summary from stored profile and library progress.

Response shape:
- profile identity fields
- `totalGames`
- `completedGames`
- `totalAchievements`
- `unlockedAchievements`
- `remainingAchievements`
- `averageCompletionPercentage`

## Games

### `GET /profiles/:steamId/games`

Returns the stored game library for one Steam profile.

Query parameters:
- `search`: optional case-insensitive game name search.
- `status`: `all`, `completed`, `incomplete`, or `no_achievements`.
- `sort`: `name`, `completion`, `playtime`, `recently_played`, or `remaining`.
- `order`: `asc` or `desc`.
- `limit`: integer from `1` to `100`; default `50`.
- `offset`: non-negative integer; default `0`.

Default sorting is `completion desc` so the library initially prioritizes games
closest to completion.

Response shape:
- `steamId`
- `total`
- `limit`
- `offset`
- `items`: game metadata plus stored progress fields.

### `GET /profiles/:steamId/games/nearest-completions`

Returns incomplete games with achievements, ordered by highest completion
percentage first.

Query parameters:
- `limit`: integer from `1` to `100`; default `10`.

Zero-achievement games and completed games are excluded. Games with zero
unlocked achievements are included when `totalAchievements` is greater than `0`.

### `GET /profiles/:steamId/games/:steamAppId`

Returns one stored game detail for a profile.

Response shape:
- game metadata
- profile progress
- `achievementsSummary`

Returns `404` when the profile is missing or the profile does not have a stored
progress row for the game.

## Achievements

### `GET /profiles/:steamId/games/:steamAppId/achievements`

Returns achievement metadata for a game with the profile unlock state.

Query parameters:
- `status`: `all`, `unlocked`, or `locked`.
- `sort`: `rarity`, `unlocked_at`, or `name`.
- `order`: `asc` or `desc`.

Response shape:
- `steamId`
- `steamAppId`
- `total`
- `items`: achievement metadata plus `unlockState`, `achieved`, `unlockedAt`,
  and `lastSyncedAt`.

`unlockState` values:
- `unlocked`: a `profile_achievements` row exists with `achieved = true`.
- `locked`: a `profile_achievements` row exists with `achieved = false`.
- `unknown`: metadata exists but player unlock state has not been synced or was
  unavailable.

`achieved` remains `false` for `unknown` to preserve backward compatibility;
clients should use `unlockState` when they need to distinguish unknown from
definitely locked.

Frontend clients must render `unknown` as an explicit unknown state, not as
locked. This matters for metadata-only achievement sync where schema/global
metadata exists but Steam denies player unlock state.

### `GET /profiles/:steamId/achievements/rarest`

Returns the rarest unlocked achievements for a profile.

Query parameters:
- `limit`: integer from `1` to `100`; default `10`.

Achievements without `globalPercentage` are excluded and results are ordered by
global percentage ascending.

## Sync Runs

### `POST /profiles/:steamId/sync`

Queues a manual sync for one profile-backed scope and returns immediately.

Request body:

```json
{
  "scope": "profile"
}
```

Selected achievement sync:

```json
{
  "scope": "achievements",
  "appIds": [910001, 910002]
}
```

Supported `scope` values:
- `profile`: fetches Steam profile metadata and updates `steam_profiles`.
- `games`: ensures the profile exists, fetches owned games, updates `games`,
  and updates `profile_games` playtime fields.
- `achievements`: syncs achievement metadata, global rarity, and profile
  unlock state for stored profile games.

For `achievements`, omit `appIds` to sync all stored profile games. When
provided, `appIds` must contain 1 to 100 positive Steam app IDs and only those
stored profile games are synced.

Response shape:
- `syncRunId`
- `jobId`
- `steamId`
- `scope`
- `status`: always `queued` in the initial response.
- `queuedAt`

Invalid scope values return `400`. Steam upstream failures are recorded in
`sync_runs` by the background worker without exposing the Steam API key.
Invalid `appIds` values return `400`.

The endpoint returns HTTP `202 Accepted`. Poll `GET /profiles/:steamId/sync-runs`
to see the user-visible sync status.

### `GET /profiles/:steamId/sync-runs`

Returns recent sync runs for a stored profile, newest first.

Query parameters:
- `limit`: integer from `1` to `100`; default `10`.

Response shape:
- `steamId`
- `items`: sync type, status, timestamps, optional error message, and metadata.

## Decisions

### Decision

Controllers stay thin and delegate use cases to services.

### Why

Services can resolve the Steam profile once, enforce `404` behavior consistently,
and compose database-service results into API response shapes without leaking
raw database rows or repository classes.

### Decision

All current dashboard, library, achievement, and sync history endpoints read
from PostgreSQL only.

### Why

The MVP read API should be deterministic and fast. Live Steam access belongs in
future sync orchestration, not in read controllers.
