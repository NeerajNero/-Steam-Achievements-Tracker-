# Leaderboards

Leaderboard v1 is Steam-only and reads from stored PostgreSQL snapshot data.
It does not call Steam at request time and does not calculate ranks in the
frontend.

## Snapshot Strategy

`profile_snapshots` stores aggregate progress for a Steam profile:

- total and completed games;
- total, unlocked, and remaining achievements;
- average completion percentage;
- total playtime;
- rarest unlocked global achievement percentage.

Snapshots are created explicitly by:

- successful or partial successful sync completion, when the profile has stored
  games;
- the manual `POST /profiles/:steamId/snapshots` endpoint for authenticated
  owners of the claimed Steam profile, or admin/moderator users.

The database function `create_profile_snapshot(profile_id, reason)` performs the
aggregate calculation from current persisted profile progress.

## Leaderboard Types

`GET /leaderboards` returns the available types:

- `completion_percentage`
- `completed_games`
- `unlocked_achievements`
- `rarest_unlocks`

`GET /leaderboards/:type` ranks the latest snapshot for each Steam profile:

- completion percentage sorts average completion descending;
- completed games sorts completed game count descending;
- unlocked achievements sorts unlocked achievement count descending;
- rarest unlocks sorts rarest unlocked global percentage ascending with nulls
  last.

Rows include public Steam profile metadata and a `publicSlug` when the linked
public profile is published. Clients should link to `/u/:slug` when available
and otherwise fall back to `/profiles/:steamId`.

## Why Snapshots

Snapshots make leaderboard reads fast and explainable. A row captures the exact
aggregate values used for ranking, while raw sync tables remain the source of
truth for profile/game/achievement progress.

This avoids recomputing every public leaderboard directly from raw progress rows
on every request. It also gives future moderation, fairness, or scheduled
ranking systems a stable foundation.

## Manual Snapshot Security

Snapshot reads are public because public profile pages can show progress
history:

```http
GET /profiles/:steamId/snapshots
```

Manual snapshot creation is protected:

```http
POST /profiles/:steamId/snapshots
```

The POST endpoint requires an active session and only allows:

- the app user who has claimed/linked that Steam profile through
  `user_steam_accounts`;
- an `admin` or `moderator` app user.

Sync-created snapshots do not use an HTTP user session. The sync workflow calls
the snapshot data service directly after successful or partial successful syncs.

To limit snapshot noise, sync-created snapshots are skipped when the latest
snapshot for the same profile was created within the last five minutes. Manual
owner-created snapshots bypass this short dedupe window.

## Deferred Work

`leaderboard_entries` is not part of v1. Add a reviewed migration for
materialized leaderboard batches only if latest-snapshot queries become too
expensive or fairness rules need frozen ranking sets.

Future work can add:

- scheduled snapshot jobs;
- snapshot retention policy;
- richer milestone types and activity-feed ranking summaries;
- public/private leaderboard visibility controls;
- moderation and anti-cheat review flows;
- friend or group leaderboards.
