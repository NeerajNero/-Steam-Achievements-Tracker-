# Sync Flow

Sync is now asynchronous. The API queues work with BullMQ/Redis, and PostgreSQL
`sync_runs` remains the user-visible source of truth for sync status and history.

## Current Endpoint

```http
POST /profiles/:steamId/sync
```

Body:

```json
{
  "scope": "achievements",
  "appIds": [910001, 910002]
}
```

Supported scopes:
- `profile`
- `games`
- `achievements`

For `achievements`, omit `appIds` to sync achievements for all stored profile
games, or pass up to 100 positive Steam app IDs to sync selected games.

The endpoint returns `202 Accepted` with queued sync information:

```json
{
  "syncRunId": "...",
  "jobId": "...",
  "steamId": "76561198000000000",
  "scope": "achievements",
  "status": "queued",
  "queuedAt": "..."
}
```

## Queue Flow

1. The controller validates the request and calls `SyncService`.
2. `SyncService` creates a `sync_runs` row with `status = queued`.
3. `SyncService` enqueues a BullMQ job on the `steam-sync` queue.
4. If enqueue fails, the `sync_runs` row is marked `failed`.
5. `SyncProcessor` consumes the job and marks the run `running`.
6. `SyncWorkflowService` executes the profile, games, or achievements workflow.
7. After a successful or partial successful workflow, the backend creates a
   profile snapshot when the profile has stored games.
8. The workflow marks the run `success`, `partial_success`, or `failed` with
   safe metadata.
9. Read endpoints and dashboards continue to read status from PostgreSQL.

Redis job state is operational only. Product-facing status is stored in
`sync_runs`.

## Frontend Polling

The frontend queues work through the generated SDK and observes status through
`GET /profiles/:steamId/sync-runs`.

Frontend polling should:
- refresh sync runs immediately after enqueue;
- poll every 2 to 5 seconds only while the latest relevant sync run is
  `queued` or `running`;
- stop when that run reaches `success`, `partial_success`, or `failed`;
- show safe `errorMessage` values from `sync_runs`;
- show the queued `syncRunId` and `jobId` without exposing backend secrets.

Do not inspect BullMQ payloads from the frontend. BullMQ remains operational
infrastructure, while PostgreSQL `sync_runs` is the UI source of truth.

## Job Payload

```json
{
  "syncRunId": "...",
  "steamId": "76561198000000000",
  "scope": "achievements",
  "appIds": [910001, 910002]
}
```

## Retry Policy

Sync jobs use:
- `attempts: 3`
- exponential backoff starting at `1000ms`
- processor concurrency `2`
- achievement game processing concurrency `3` inside each job
- completed job cleanup for local development
- failed jobs retained for debugging

The processor marks a sync run `failed` only when the final BullMQ attempt fails.

## Profile Sync

1. Call cached Steam API wrapper for `getPlayerSummaries([steamId])`.
2. Upsert `steam_profiles`.
3. Store `visibility_state`, `is_private`, and `last_synced_at`.
4. Mark the run `success` with:

   ```json
   {
     "profilesSynced": 1
   }
   ```

If Steam does not return the profile, the run is marked `failed` with a safe
message.

## Owned Games Sync

1. Ensure the Steam profile exists. If it does not, fetch and upsert profile
   metadata first.
2. Call cached Steam API wrapper for `getOwnedGames(steamId)`.
3. Call cached Steam API wrapper for `getRecentlyPlayedGames({ steamId })`.
3. Upsert canonical `games` rows by `steam_app_id`.
4. Upsert `profile_games` playtime fields from owned games.
5. Upsert recent playtime fields from recently played games. Recent Steam data
   does not include an exact last played timestamp, so the sync preserves any
   existing `last_played_at` value instead of fabricating one.
6. Update `steam_profiles.last_synced_at`.
7. Mark the run `success` with:

   ```json
  {
    "gamesSynced": 0,
    "profileGamesSynced": 0,
    "recentGamesSynced": 0,
    "ownedGamesWithPlaytime": 0,
    "ownedGamesWithRecentPlaytime": 0
  }
  ```

## Achievement Progress Preservation

Owned games sync is not an achievement-count source.

When updating `profile_games`, owned games sync updates:
- `playtime_minutes`
- `playtime_two_weeks_minutes`
- `last_played_at`
- `last_synced_at`

It does not overwrite:
- `total_achievements`
- `unlocked_achievements`
- `completion_percentage`

This preserves future achievement sync results and development seed data.

The `recently_played` sort uses two-week playtime first and then last-played
timestamps. This keeps profiles useful even when `GetRecentlyPlayedGames`
returns recent playtime but no timestamp.

## Achievement Sync

Achievement sync reads stored `profile_games` rows and then syncs Steam
achievement data per game.

1. Resolve `steam_profiles` by Steam ID.
2. If `appIds` is provided, load matching stored profile games only.
3. If `appIds` is omitted, load all stored profile games for the profile.
4. For each game, with bounded per-job concurrency:
   - call cached Steam API wrapper for `getSchemaForGame`;
   - call cached Steam API wrapper for `getGlobalAchievementPercentages`;
   - call cached Steam API wrapper for `getPlayerAchievements`.
5. Persist schema/global metadata independently from player unlock state:
   - upsert canonical `achievements`;
   - persist `global_percentage`;
   - update `games.has_achievements`.
6. If player unlock state is available, upsert profile-specific
   `profile_achievements` and call
   `refresh_profile_game_achievement_progress(profile_id, steam_app_id)`.
7. If player unlock state is unavailable, preserve existing
   `profile_achievements` and `profile_games` progress instead of guessing
   locked state or resetting completion to 0%.
8. For confirmed zero-achievement games, call
   `refresh_profile_game_achievement_progress(profile_id, steam_app_id)` so the
   game is marked as having no achievements.
9. Mark the sync run:
   - `success` when all requested games are `full_success` or
     `no_achievements`;
   - `partial_success` when any game is `metadata_only`, or when at least one
     useful game result and at least one hard failure occur;
   - `failed` when all requested games fail.

Per-game categories:
- `full_success`: metadata and player unlock state were synced.
- `metadata_only`: schema/global metadata was persisted, but player unlock state
  was denied or unavailable, such as an HTTP 403 from
  `GetPlayerAchievements`.
- `no_achievements`: schema/global data confirms there are no achievements.
- `failed`: schema/global metadata could not be fetched or persisted.

Steam games with confirmed zero achievements are treated as successful syncs
with zero progress. Missing or private player achievement state does not delete
existing achievement data, does not create fake locked rows, and does not reset
profile progress.

Read endpoints derive display state from PostgreSQL rows:
- canonical `achievements` rows drive `achievementMetadataCount`;
- profile `profile_achievements` rows drive `knownUnlockStateCount`;
- metadata with no profile unlock rows is returned as `metadata_only`;
- no metadata rows are returned as `not_synced` unless a future schema records a
  stronger confirmed zero-achievement signal.

This is intentionally conservative. Owned-game sync defaults cannot prove that a
game truly has no achievements, so the UI must not label unsynced metadata as
“No achievements.”

`refresh_profile_game_achievement_progress` derives total achievements,
unlocked achievements, completion percentage, `profile_games.last_synced_at`,
and `games.has_achievements` from persisted PostgreSQL rows. The function is
called explicitly once per synced game; no heavy trigger recalculation is used.

Achievement sync metadata includes:

```json
{
  "gamesRequested": 2,
  "gamesProcessed": 2,
  "gamesSucceeded": 1,
  "gamesMetadataOnly": 0,
  "gamesNoAchievements": 0,
  "gamesFailed": 1,
  "achievementsSynced": 10,
  "profileAchievementsSynced": 10,
  "unlockStateUnavailableApps": [
    {
      "appId": 550,
      "reason": "Player achievements unavailable"
    }
  ],
  "failedApps": [
    {
      "appId": 123,
      "reason": "Steam API request failed while syncing achievements for this game."
    }
  ]
}
```

## Snapshot Creation

`SyncWorkflowService` creates a `profile_snapshots` row after `success` or
`partial_success` sync completion when the profile has stored games. The
snapshot is created by the PostgreSQL function
`create_profile_snapshot(profile_id, 'sync_completed')`.

Snapshot creation is best-effort: a snapshot failure is logged with a safe
message and does not turn an otherwise successful sync into a failed sync. This
keeps the sync result focused on Steam data persistence while still feeding
leaderboard and historical-progress reads from stored aggregate data.

After successful or partial successful sync completion, the workflow also writes
a public `profile_synced` activity event with safe metadata. If a new snapshot
creates new milestones, each new milestone records one `milestone_reached`
activity event. These writes are best-effort and must not include secrets,
cookies, token hashes, raw Steam API payloads, or private account fields.

For v1, one snapshot per completed sync is acceptable. A later scheduled sync
or retention policy can reduce duplicate snapshots if they become noisy.

The sync workflow applies a short dedupe guard: if the latest snapshot for the
profile was created within the last five minutes, the workflow skips creating
another sync-created snapshot. Manual owner-created snapshots are handled by the
HTTP snapshots endpoint and are not blocked by this sync dedupe guard.

## Boundaries

- Controllers enqueue sync only and stay thin.
- `SyncService` creates queued `sync_runs` rows and submits jobs.
- `SyncProcessor` owns BullMQ job execution.
- `SyncWorkflowService` orchestrates Steam fetches and writes through
  database-facing services from `src/db/services`.
- `CachedSteamApiClient` provides cache-aside reads and delegates misses to
  `SteamApiClient`, which is the only layer that calls Steam HTTP.
- Database-facing services are the persistence boundary imported by feature
  modules.
- Repositories are internal to the database module and are the only layer that
  writes PostgreSQL data.
- Dashboard and read endpoints continue to read from the database only.
- No ORM schema sync or `drizzle-kit push` is used.

## Next Phase

Future sync work can add scheduled refreshes, stronger active-job deduplication,
and richer achievement planning metrics. Public read endpoints should continue
to read from PostgreSQL only.
