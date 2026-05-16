# Queue Architecture

The backend uses BullMQ with Redis for background sync jobs.

## Why BullMQ/Redis

Steam sync can involve upstream latency, retries, and rate limits. Queueing sync
work lets the API return quickly while a worker processes the job in the
background.

## Source Of Truth

Redis/BullMQ is operational infrastructure only. Redis is also used for
short-lived Steam API cache-aside entries, but never for product state.

PostgreSQL `sync_runs` remains the product source of truth for:
- queued status;
- running status;
- success and failure history;
- safe error messages;
- sync metadata.

PostgreSQL remains the source of truth for profiles, games, achievements,
profile progress, and sync history. Cached Steam API responses can be discarded
without data loss.

## Queue

- Queue name: `steam-sync` by default.
- Configured by: `SYNC_QUEUE_NAME`.
- Job name: `sync-profile-scope`.

## Job Payload

```json
{
  "syncRunId": "...",
  "steamId": "76561198000000000",
  "scope": "achievements",
  "appIds": [910001, 910002]
}
```

Supported scopes:
- `profile`
- `games`
- `achievements`

`appIds` is only used for achievement sync. If omitted, the worker syncs
achievements for all stored profile games.

## Retry Policy

- Attempts: `3`
- Backoff: exponential, starting at `1000ms`
- BullMQ worker concurrency: `2`
- Per achievement job game concurrency: `3`
- Completed jobs: removed after a bounded local-dev count
- Failed jobs: retained for debugging

Duplicate prevention is intentionally light for now. Job IDs include the
`syncRunId`, so completed jobs do not block future syncs. Stronger active-job
deduplication can be added later if product behavior requires it.

BullMQ reserves `:` internally, so local job IDs use hyphen separators:

```txt
steam-sync-76561198000000000-profile-{syncRunId}
```

## Achievement Worker Behavior

Achievement jobs process stored profile games only. For each game, the worker
fetches schema metadata, global rarity percentages, and player unlock state via
the cached Steam API wrapper. Schema/global metadata is persisted separately
from player unlock state so Steam 403/private responses from
`GetPlayerAchievements` do not discard useful metadata. Cache misses delegate
to `SteamApiClient`.

The worker records:
- `success` when every requested game is fully synced or confirmed to have no
  achievements;
- `partial_success` when at least one game is metadata-only, or when useful
  metadata/full success is mixed with hard failures;
- `failed` when no requested game produces useful metadata and all hard-fail.

Safe player-state unavailable reasons are stored in
`sync_runs.metadata.unlockStateUnavailableApps`. Hard per-app failure reasons
are stored in `sync_runs.metadata.failedApps`.
Steam API keys and sensitive URLs are never stored.

## Steam API Cache

Cache-aside keys use the `steam:v1` namespace by default:
- `steam:v1:profile:{steamId}`
- `steam:v1:owned-games:{steamId}`
- `steam:v1:schema:{appId}:english`
- `steam:v1:global-achievements:{appId}`
- `steam:v1:player-achievements:{steamId}:{appId}:english`

Errors are not cached. If Redis is unavailable, sync falls back to live Steam
API calls and records Steam failures in `sync_runs` as usual.

## Future Worker Container

The backend currently hosts both the HTTP API and BullMQ processor. A future
deployment can split workers into a separate container that imports the same
Nest modules and runs only processors.

The split should keep:
- controllers in the API container;
- processors in the worker container;
- PostgreSQL `sync_runs` as the visible status source;
- Steam API calls isolated behind `SteamApiClient`.
