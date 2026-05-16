# Real Steam Sync Smoke

Use this workflow only for manual local validation against the real Steam Web
API. Automated tests continue to use mocks and seed data.

## Secrets

Add your Steam Web API key to local `.env`:

```txt
STEAM_API_KEY=your-local-key
```

Do not commit `.env`. Do not paste the key into curl commands, issue reports,
screenshots, or logs.

## Pick A Profile

Use a Steam64 ID for a public Steam profile. The profile and game details must
be public enough for Steam Web API achievement endpoints to return data.

Common failure cases:
- private profile;
- public profile with private game details;
- game has no Steam achievements;
- Steam returns incomplete achievement data for a specific app;
- Steam returns schema/global achievement metadata but denies player unlock
  state for `GetPlayerAchievements` with HTTP 403.

## Start Local Services

```sh
POSTGRES_PORT=55432 docker-compose up -d postgres redis backend
docker-compose exec -T backend pnpm migration:status
```

If port `5432` is free, `POSTGRES_PORT=55432` is optional. The backend container
still uses the Compose hostname `postgres` in `DATABASE_URL`.

## Scripted Smoke

The script calls local backend HTTP endpoints only. It does not call Steam
directly and it never prints `STEAM_API_KEY`.

Profile sync, games sync, then selected achievement sync:

```sh
pnpm real-sync:smoke -- 76561198000000000 --app-ids=440,730
```

Inside Docker:

```sh
docker-compose exec -T backend pnpm real-sync:smoke -- 76561198000000000 --app-ids=440,730
```

Environment-variable form:

```sh
STEAM_SMOKE_STEAM_ID=76561198000000000 STEAM_SMOKE_APP_IDS=440,730 pnpm real-sync:smoke
```

The script always runs:
- profile sync;
- games sync.

Achievement sync is skipped unless `--app-ids=...` is provided. To sync
achievements for every stored profile game later:

```sh
pnpm real-sync:smoke -- 76561198000000000 --all-achievements
```

Start with 1 to 3 selected app IDs before running all-game achievement sync.

## Curl Smoke

Profile:

```sh
curl -X POST http://localhost:3000/profiles/76561198000000000/sync \
  -H "Content-Type: application/json" \
  -d '{"scope":"profile"}'
```

Games:

```sh
curl -X POST http://localhost:3000/profiles/76561198000000000/sync \
  -H "Content-Type: application/json" \
  -d '{"scope":"games"}'
```

Selected achievements:

```sh
curl -X POST http://localhost:3000/profiles/76561198000000000/sync \
  -H "Content-Type: application/json" \
  -d '{"scope":"achievements","appIds":[440,730]}'
```

Poll status:

```sh
curl http://localhost:3000/profiles/76561198000000000/sync-runs?limit=10
```

Terminal statuses are `success`, `partial_success`, and `failed`.

## DBeaver Inspection

Connect to:

```txt
Host: localhost
Port: 55432
Database: steam_tracker
User: postgres
Password: postgres
```

Use `5432` instead of `55432` if your Compose environment exposes Postgres on
the default host port.

Useful tables:
- `steam_profiles`
- `games`
- `profile_games`
- `achievements`
- `profile_achievements`
- `sync_runs`

## Redis Inspection

Steam API cache keys:

```sh
docker-compose exec -T redis redis-cli --scan --pattern 'steam:v1:*'
```

BullMQ keys:

```sh
docker-compose exec -T redis redis-cli --scan --pattern 'bull:steam-sync:*'
```

Redis cache misses are safe. PostgreSQL remains the source of truth.

## Demo Seed Reset

Reset only deterministic demo seed data:

```sh
docker-compose exec -T backend pnpm seed:reset-dev
```

This script targets the demo Steam ID and seeded app IDs. It should not be used
as a general database cleanup tool, and it should not delete real synced data.

## Troubleshooting

### Private Profiles

If profile or games sync fails with a private/unavailable message, verify the
Steam profile and game details visibility settings. The backend records safe
messages in `sync_runs.error_message`; it does not expose raw Steam URLs.

### Missing Achievements

Some games have no achievements. Those should sync as zero-achievement games.
Some games expose schema data but not player unlock state; the sync can finish
as `partial_success` and preserve existing rows.

### Metadata-Only Achievement Sync

Real Steam responses can allow `GetSchemaForGame` and
`GetGlobalAchievementPercentagesForApp` while denying
`GetPlayerAchievements`. In that case, expected behavior is:

- canonical achievement metadata is persisted;
- global rarity percentages are persisted;
- `profile_achievements` is not written with guessed locked rows;
- existing profile achievement rows and profile game progress are preserved;
- the sync run is `partial_success` with `gamesMetadataOnly` and
  `unlockStateUnavailableApps` metadata.

### Rate Limits And Timeouts

Steam `429` and transient `5xx` responses are retried by the Steam API client
and by BullMQ job attempts. If the final attempt fails, `sync_runs` is marked
`failed` with a safe error. Wait before retrying large all-game achievement
syncs.

### Redis

If Redis is unavailable, cache reads/writes fail open and the backend falls back
to live Steam API calls. BullMQ jobs still require Redis to enqueue and process.
Check:

```sh
docker-compose ps redis
docker-compose logs redis
```
