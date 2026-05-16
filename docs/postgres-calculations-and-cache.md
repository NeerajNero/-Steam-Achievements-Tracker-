# PostgreSQL Calculations And Cache

## PostgreSQL Calculation Rules

Durable product calculations should live in PostgreSQL when they are derived
from persisted relational rows and are reused by dashboards or sync workflows.

Current example:

```sql
refresh_profile_game_achievement_progress(profile_id, steam_app_id)
```

The function derives:
- total achievements from `achievements`;
- unlocked achievements from `profile_achievements`;
- completion percentage rounded to two decimals;
- `games.has_achievements`;
- `profile_games.last_synced_at` and `updated_at`.

## Function Rules

- Add PostgreSQL functions through numbered SQL migrations.
- Use explicit calls from database-facing services or repositories after a write
  batch.
- Prefer `SECURITY INVOKER`.
- Return useful values for tests and sync metadata.
- Do not delete achievement rows during recalculation.
- Do not call progress refresh after metadata-only achievement persistence when
  player unlock state is unavailable; doing so would turn unknown unlock state
  into an incorrect 0% completion value.

## Trigger Rules

Do not use heavy row-by-row triggers for sync recalculation unless there is a
clear reason. Steam sync writes batches of related rows, so explicit function
calls are easier to reason about and test.

## Redis Cache Rules

Redis is cache-aside infrastructure only:
- read cache first;
- on miss, call `SteamApiClient`;
- store normalized result with TTL;
- return the normalized result.

Do not cache:
- errors;
- Steam API keys;
- full sensitive URLs;
- product state that belongs in PostgreSQL.

If Redis is unavailable, the backend logs a safe warning and falls back to live
Steam API calls.

## Cache Keys And TTLs

Default namespace: `steam:v1`.

| Data | Key | TTL |
| --- | --- | --- |
| Profile summary | `steam:v1:profile:{steamId}` | 600 seconds |
| Owned games | `steam:v1:owned-games:{steamId}` | 1800 seconds |
| Game schema | `steam:v1:schema:{appId}:english` | 1209600 seconds |
| Global percentages | `steam:v1:global-achievements:{appId}` | 43200 seconds |
| Player achievements | `steam:v1:player-achievements:{steamId}:{appId}:english` | 120 seconds |

Player achievement TTL stays short so manual sync can become fresh quickly.
Schema and global rarity data can be cached longer because they change less
often.
