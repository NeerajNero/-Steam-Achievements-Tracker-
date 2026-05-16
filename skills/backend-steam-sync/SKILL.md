---
name: backend:steam-sync
description: Use when integrating Steam Web API, syncing Steam profiles, owned games, achievements, global achievement percentages, caching, retries, and sync status tracking in the Steam Achievement Tracker backend.
---

# Backend Steam Sync Skill

## Trigger
Use this skill for Steam Web API client work, sync service work, achievement/game ingestion, retry/error handling, and sync status tracking.

## Boundaries
- Steam API client handles external HTTP only.
- Sync service orchestrates fetch + persistence.
- Repositories persist data only.
- Controllers start/read sync state only.
- Frontend never receives or uses the Steam API key.

## Required Steam data flows

### Profile sync
1. Fetch player summary by Steam ID.
2. Upsert `steam_profiles`.
3. Store visibility state, persona name, avatar, and profile URL.
4. If profile is private, return/store a clear private-profile result.

### Owned games sync
1. Fetch owned games for profile.
2. Upsert canonical `games` by `steam_app_id`.
3. Upsert `profile_games` for playtime/progress.
4. Do not assume every owned game has achievements.

### Achievement sync per game
1. Fetch player achievements for `steamId + appId`.
2. Fetch global achievement percentages for app rarity.
3. Fetch or derive achievement metadata where available.
4. Upsert canonical `achievements` by `(steam_app_id, api_name)`.
5. Upsert `profile_achievements` by `(profile_id, achievement_id)`.
6. Recalculate `profile_games.total_achievements`, `unlocked_achievements`, and `completion_percentage`.

## Error cases to handle
- Private profile.
- Invalid Steam ID.
- Steam API key missing.
- Steam API timeout.
- Steam API rate limit.
- Game has no achievements.
- Game has achievements but metadata unavailable.
- Global achievement percentages unavailable.
- Profile owns zero games.

## Implementation guidance
- Use typed response interfaces for Steam API responses.
- Normalize Steam API responses before passing to services/repositories.
- Avoid leaking external response shape across the app.
- Use configurable timeout and retry policy.
- Log/store sync failures with safe error messages.
- Do not store raw API key or full sensitive request details in logs.

## Suggested files

```txt
apps/backend/src/modules/steam/
  steam.module.ts
  steam.controller.ts
  steam.service.ts
  steam-api.client.ts
  dto/
  interfaces/

apps/backend/src/modules/sync/
  sync.service.ts
  sync-status.enum.ts
```

## Done checklist
- Steam API key is loaded from backend env only.
- Client methods are typed.
- Sync is idempotent.
- Sync writes `sync_runs`.
- Private/missing achievement cases do not crash dashboard reads.
- Summary and game endpoints use cached DB data, not live API calls on every request.
