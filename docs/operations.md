# Operations

These checks are for local Docker development and MVP backend smoke validation.

## Service Health

```sh
docker-compose ps
docker-compose logs -f backend
docker-compose logs -f postgres
docker-compose logs -f redis
```

Backend health:

```sh
curl http://localhost:3000/health
```

Swagger and OpenAPI:

```sh
curl http://localhost:3000/openapi.json
```

Open the backend tools home in a browser:

```txt
http://localhost:3000
```

Open Swagger UI in a browser:

```txt
http://localhost:3000/docs
```

## Migration Status

```sh
docker-compose exec -T backend pnpm migration:status
docker-compose exec -T backend pnpm migration:pending
```

Migrations are manual. Do not run ORM schema sync or `drizzle-kit push`.

## Queue Health

Sync jobs use BullMQ on Redis. The default queue name is `steam-sync`.

Open Bull Board in a browser:

```txt
http://localhost:3000/queues
```

The legacy local shortcut `http://localhost:3000/bull-dashboard` redirects to
the Bull Board route. Use the dashboard for queue counts and job state review,
but do not paste raw job payloads into tickets or docs if they contain upstream
errors or other sensitive operational details.

List BullMQ keys:

```sh
docker-compose exec -T redis redis-cli --scan --pattern 'bull:steam-sync:*'
```

Check queued and failed job structures when debugging:

```sh
docker-compose exec -T redis redis-cli type bull:steam-sync:wait
docker-compose exec -T redis redis-cli type bull:steam-sync:failed
```

User-visible status is in PostgreSQL `sync_runs`, not Redis.

## Redis Cache

List Steam API cache keys:

```sh
docker-compose exec -T redis redis-cli --scan --pattern 'steam:v1:*'
```

Clear only Steam API cache keys when jobs are not actively running:

```sh
docker-compose exec -T redis sh -lc "for key in $(redis-cli --scan --pattern 'steam:v1:*'); do redis-cli del \"$key\"; done"
```

Do not run `FLUSHDB` or `FLUSHALL` while BullMQ jobs are running. Redis also
contains operational queue state.

## Logging Review

Expected safe logs:
- sync processor logs include `syncRunId`, `steamId`, `scope`, `jobId`, and
  attempt counts;
- cache warnings do not include Steam API keys;
- Steam API request errors redact the `key` query parameter;
- `sync_runs.error_message` stores safe product messages only.

Do not log:
- `STEAM_API_KEY`;
- full unredacted Steam request URLs;
- raw upstream response bodies that might contain sensitive details.

## PostgreSQL Checks

List profiles:

```sql
select id, steam_id, persona_name, visibility_state, is_private, last_synced_at
from steam_profiles
order by created_at desc;
```

List games for a profile:

```sql
select
  g.steam_app_id,
  g.name,
  pg.playtime_minutes,
  pg.total_achievements,
  pg.unlocked_achievements,
  pg.completion_percentage,
  pg.last_synced_at
from profile_games pg
join games g on g.id = pg.game_id
join steam_profiles sp on sp.id = pg.profile_id
where sp.steam_id = '76561198000000000'
order by pg.completion_percentage desc, g.name asc;
```

List achievement progress:

```sql
select
  g.steam_app_id,
  g.name,
  count(a.id) as achievement_rows,
  count(pa.id) filter (where pa.achieved) as unlocked_rows
from games g
left join achievements a on a.steam_app_id = g.steam_app_id
left join profile_achievements pa on pa.achievement_id = a.id
group by g.steam_app_id, g.name
order by g.steam_app_id;
```

Rarest unlocked achievements:

```sql
select
  g.steam_app_id,
  g.name as game_name,
  a.display_name,
  a.api_name,
  a.global_percentage,
  pa.unlocked_at
from profile_achievements pa
join achievements a on a.id = pa.achievement_id
join games g on g.steam_app_id = a.steam_app_id
join steam_profiles sp on sp.id = pa.profile_id
where sp.steam_id = '76561198000000000'
  and pa.achieved = true
  and a.global_percentage is not null
order by a.global_percentage asc
limit 20;
```

Latest sync runs:

```sql
select sync_type, status, started_at, finished_at, error_message, metadata
from sync_runs sr
left join steam_profiles sp on sp.id = sr.profile_id
where sp.steam_id = '76561198000000000' or sr.profile_id is null
order by sr.started_at desc
limit 20;
```

Verify profile game progress values:

```sql
select
  g.steam_app_id,
  pg.total_achievements,
  pg.unlocked_achievements,
  pg.completion_percentage,
  g.has_achievements
from profile_games pg
join games g on g.id = pg.game_id
join steam_profiles sp on sp.id = pg.profile_id
where sp.steam_id = '76561198000000000'
order by g.steam_app_id;
```

Verify the progress refresh function exists:

```sql
select proname
from pg_proc
where proname = 'refresh_profile_game_achievement_progress';
```

## Source Of Truth

PostgreSQL stores product state and sync history. Redis stores BullMQ operational
state and short-lived Steam API cache entries. Losing Redis cache keys should
not delete product data.
