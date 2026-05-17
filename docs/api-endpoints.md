# API Endpoints

These MVP endpoints are database-backed only. They read from the migrated
PostgreSQL schema through database-facing services backed by Drizzle
repositories, and do not call the live Steam API.

Interactive API documentation is available locally at:

- Swagger UI: `http://localhost:3000/docs`
- OpenAPI JSON: `http://localhost:3000/openapi.json`

The generated OpenAPI contract is written to `docs/openapi/openapi.json`, and
the frontend SDK is generated in `libs/client-sdk`.

## Auth

Auth is Steam-only and backend-owned. The frontend must not call Steam OpenID or
Steam Web API directly.

### `GET /auth/steam/login`

Starts Sign in with Steam. This is a browser redirect endpoint, not a JSON data
API.

Query parameters:
- `returnTo`: optional frontend path to return to after login. Unsafe external
  redirects are normalized by the backend.

Behavior:
- creates a short-lived OpenID state cookie;
- redirects the browser to Steam OpenID;
- does not expose Steam API keys or session tokens.

### `GET /auth/steam/callback`

Handles the Steam OpenID callback. This endpoint verifies the OpenID assertion
server-side, creates or reuses the app user, links the Steam account, creates a
hashed-token session row, sets the httpOnly session cookie, and redirects back
to the frontend.

### `GET /auth/me`

Returns the current authenticated user from the session cookie.

Response shape:
- `user`: id, display name, avatar URL, role, status.
- `steamAccount`: linked Steam ID/profile data, or `null`.
- `publicProfile`: public profile settings, or `null`.

Returns `401` when there is no active session.

### `POST /auth/logout`

Revokes the current session and clears the session cookie. Returns `204`.

## Account

Account endpoints require an active Sign in with Steam session cookie. They
return `401` when unauthenticated and never expose session tokens, token hashes,
or internal auth session rows.

### `GET /account/me`

Returns the authenticated account, linked primary Steam account, preferences,
and public profile publishing settings.

Response shape:
- `user`: id, display name, avatar URL, role, status.
- `steamAccount`: linked Steam ID/profile data, or `null`.
- `preferences`: authenticated user settings object.
- `publicProfile`: slug, publishing flag, and public settings object.

### `PATCH /account/me`

Updates editable account display fields only.

Allowed request fields:
- `displayName`: optional string, 1 to 80 characters.
- `avatarUrl`: optional nullable URL string.

The endpoint does not accept role, status, Steam ID, session, or ownership
changes.

### `GET /account/preferences`

Returns the authenticated user's preference settings.

### `PATCH /account/preferences`

Updates strict preference settings.

Supported settings:

```json
{
  "defaultGameSort": "completion",
  "defaultGameOrder": "desc",
  "showPrivateHints": true
}
```

`defaultGameSort` supports `completion`, `name`, `playtime`,
`recently_played`, and `remaining`. `defaultGameOrder` supports `asc` and
`desc`.

### `GET /account/public-profile`

Returns the authenticated user's public profile publishing settings.

### `PATCH /account/public-profile`

Updates the authenticated user's public profile settings.

Allowed request fields:
- `slug`: nullable string. Values are trimmed, normalized to lowercase, and must
  be 3 to 64 characters of `a-z`, `0-9`, or hyphen.
- `isPublic`: boolean.
- `settings`: object with `showRarestAchievements`, `showRecentSyncs`, and
  `showSteamId` booleans.

Reserved slugs are rejected: `admin`, `api`, `auth`, `account`, `profiles`,
`games`, `settings`, `docs`, and `health`.

Slug conflicts return `409 Conflict`.

## Public Profiles

### `GET /public-profiles/:slug`

Returns public Steam profile data for a published slug. This endpoint does not
require auth.

Response shape:
- `publicProfile`: slug, publishing flag, and public settings.
- `steamProfile`: public Steam metadata. `steamId` may be `null` when the owner
  disables Steam ID display.
- `summary`: public achievement summary stats.
- `nearestCompletions`: public nearest-completion games.
- `rarestAchievements`: public rarest unlocked achievements, omitted as an
  empty list when the owner disables that section.

Returns `404` when the slug is missing, unpublished, or not linked to a Steam
profile. The response never exposes private account fields, sessions,
preferences, or token data.

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

Global game endpoints are public, database-backed, and read only. They do not
call Steam at request time.

### `GET /games`

Lists games tracked in the platform database.

Query parameters:
- `search`: optional case-insensitive game name search.
- `hasAchievements`: optional boolean.
- `sort`: `name`, `tracked_players`, `completion_rate`, `achievements`, or
  `playtime`.
- `order`: `asc` or `desc`.
- `limit`: integer from `1` to `100`; default `25`.
- `offset`: non-negative integer; default `0`.

Response shape:
- `items`: game metadata plus tracked player count, achievement count, average
  completion, completed players, and total playtime.
- `total`
- `limit`
- `offset`

### `GET /games/:steamAppId`

Returns canonical game metadata and aggregate tracked-player stats.

Response shape:
- `game`: stored Steam app metadata.
- `stats`: tracked players, completed players, total achievements, average
  completion percentage, total playtime, and average playtime.

Returns `404` when the Steam app is not tracked in the database.

### `GET /games/:steamAppId/achievements`

Returns public achievement metadata for a tracked game.

Query parameters:
- `search`: optional case-insensitive achievement API/display name search.
- `hidden`: `all`, `visible`, or `hidden`.
- `sort`: `rarity` or `name`.
- `order`: `asc` or `desc`.
- `limit`: integer from `1` to `500`; default `100`.
- `offset`: non-negative integer; default `0`.

Returns `404` when the Steam app is not tracked in the database.

### `GET /games/:steamAppId/players`

Returns public tracked player progress for a game.

Query parameters:
- `status`: `all`, `completed`, or `incomplete`.
- `sort`: `completion`, `playtime`, or `recently_played`.
- `order`: `asc` or `desc`.
- `limit`: integer from `1` to `100`; default `25`.
- `offset`: non-negative integer; default `0`.

Player rows include public Steam profile metadata and `publicSlug` when the
linked public profile is published. They do not expose app user private fields,
preferences, sessions, or token data.

## Guides

Guide endpoints are Steam-only and database-backed. The frontend must consume
them through generated `GuidesApi` SDK methods.

### `GET /games/:steamAppId/guides`

Lists published public guides for a tracked Steam game.

Query parameters:
- `search`: optional guide title/summary search.
- `limit`: integer from `1` to `100`; default `20`.
- `offset`: non-negative integer; default `0`.

Draft, archived, private, and unlisted guides are not returned from this public
endpoint.

### `GET /games/:steamAppId/guides/:slug`

Returns one published public guide with ordered sections and attached
achievement metadata. Returns `404` when the guide is missing or not public.

### `POST /games/:steamAppId/guides`

Requires an active Sign in with Steam session. Creates a draft guide for a
tracked Steam game and generates a game-scoped slug from the title. Slug
conflicts append a suffix.

### `PATCH /guides/:guideId`

Requires auth. Only the guide author, admin, or moderator can update a guide.
Allowed fields are title, summary, visibility, estimated difficulty/hours,
spoiler flag, and status. Publishing sets `publishedAt` the first time a guide
enters `published`.

### `GET /account/guides`

Requires auth. Returns the signed-in user's guides, including draft, unlisted,
private, and archived guides.

### `POST /guides/:guideId/sections`

Requires author/admin/moderator access. Adds a plain-text section to a guide.

### `PATCH /guides/:guideId/sections/:sectionId`

Requires author/admin/moderator access. Updates a guide section.

### `POST /guides/:guideId/achievements`

Requires author/admin/moderator access. Attaches one or more achievement IDs to
a guide. Every achievement must belong to the same Steam app as the guide.

### `DELETE /guides/:guideId/achievements/:achievementId`

Requires author/admin/moderator access. Removes a guide-achievement mapping.
The mapping row is not historical progress data, so hard-deleting it is allowed.

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

## Snapshots

Profile snapshots are stored aggregate stats for one Steam profile. They are
used as the v1 foundation for fast leaderboard reads and historical progress
views.

### `GET /profiles/:steamId/snapshots`

Returns stored snapshots for a Steam profile, newest first.

Query parameters:
- `limit`: integer from `1` to `100`; default `20`.
- `offset`: non-negative integer; default `0`.

Response shape:
- `steamId`
- `items`: snapshot id, total/completed games, total/unlocked/remaining
  achievements, average completion, total playtime, rarest unlocked global
  percentage, reason, and creation timestamp.
- `total`
- `limit`
- `offset`

### `POST /profiles/:steamId/snapshots`

Creates a manual snapshot from the current stored database state.

Auth behavior:
- returns `401` without an active Sign in with Steam session;
- returns `403` when the authenticated user has not claimed the Steam profile;
- allows `admin` and `moderator` users to create snapshots for any profile.

Automatic snapshots are also created after successful or partial successful
syncs and do not require an HTTP user session. Sync-created snapshots are
deduped when the latest snapshot for the same profile was created within the
last five minutes.

Returns `404` when the Steam profile is not stored.

## Leaderboards

Leaderboard endpoints are public, database-backed, and read from the latest
snapshot per Steam profile. They do not call Steam at request time and do not
expose auth/session fields.

### `GET /leaderboards`

Returns available leaderboard types:
- `completion_percentage`
- `completed_games`
- `unlocked_achievements`
- `rarest_unlocks`

### `GET /leaderboards/:type`

Returns ranked profiles for one leaderboard type.

Query parameters:
- `limit`: integer from `1` to `100`; default `50`.
- `offset`: non-negative integer; default `0`.

Ranking rules:
- `completion_percentage`: average completion percentage descending.
- `completed_games`: completed games descending.
- `unlocked_achievements`: unlocked achievements descending.
- `rarest_unlocks`: rarest unlocked global percentage ascending, nulls last.

Rows include public Steam metadata and `publicSlug` when a linked public profile
is published. Frontend links should prefer `/u/:slug` and otherwise fall back to
`/profiles/:steamId`.

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
