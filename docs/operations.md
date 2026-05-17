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

## Steam API Runtime Config

Local Docker backend env is loaded from:

```txt
apps/backend/.env
```

Use `apps/backend/.env.example` as the template, and put the local
`STEAM_API_KEY` in `apps/backend/.env`. The real `.env` file is ignored by Git
and must never be committed or pasted into logs.

Check Steam config safely from inside the backend container:

```sh
docker-compose exec -T backend pnpm steam:config-check
```

Expected safe output includes:

```txt
STEAM_API_KEY configured: true
STEAM_API_BASE_URL configured/defaulted: true
STEAM_API_CACHE_ENABLED: true
```

The check prints booleans only. It does not print env values, call Steam, or
build Steam API URLs.

If sync history shows:

```txt
STEAM_API_KEY is not configured in backend runtime environment.
```

verify `apps/backend/.env` exists, then recreate the backend container after
changing env:

```sh
docker-compose up -d --force-recreate backend
```

Use `docker-compose config --quiet` for Compose validation. Do not paste full
rendered Compose config if it includes interpolated secrets.

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
- raw session tokens, auth cookies, OpenID assertion payloads, or
  `auth_sessions.session_token_hash`.

## Auth Smoke

Safe endpoint checks:

```sh
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/auth/me
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/auth/steam/login
```

Expected:
- unauthenticated `/auth/me` returns `401`;
- `/auth/steam/login` returns `302`;
- the redirect host is Steam Community.

Do not paste full `Location` headers for Steam OpenID redirects because they
include callback parameters. Do not paste cookie values.

Safe database checks after completing browser login:

```sql
select count(*) as app_user_rows from app_users;
select count(*) as linked_steam_accounts from user_steam_accounts;
select count(*) as user_preference_rows from user_preferences;
select count(*) as public_profile_rows from public_profiles;
select
  count(*) as auth_session_rows,
  count(*) filter (where revoked_at is null) as active_session_rows,
  count(*) filter (where revoked_at is not null) as revoked_session_rows
from auth_sessions;
```

To verify raw session tokens are not stored, check only the column names:

```sql
select column_name
from information_schema.columns
where table_name = 'auth_sessions'
  and column_name like '%token%'
order by column_name;
```

The only token column should be `session_token_hash`. Do not select or print
that column's values.

### Account Settings Smoke

After browser login, open:

```txt
http://localhost:3001/settings
```

Expected:
- account display fields load for the signed-in user;
- linked Steam account summary is visible;
- preference changes save through `/account/preferences`;
- public profile publishing changes save through `/account/public-profile`;
- a unique public slug creates a frontend preview link at `/u/<slug>`.

Slug troubleshooting:
- invalid or reserved slugs return `400`;
- duplicate slugs return `409`;
- unpublished or missing slugs return `404` from `/public-profiles/:slug`.

Do not verify account settings by selecting auth session token hashes, cookie
values, or raw session tokens.

Safe public profile checks:

```sql
select slug, is_public, created_at, updated_at
from public_profiles
where slug is not null
order by updated_at desc
limit 10;
```

Do not expose private account fields on `/u/:slug`. Public profile responses
should contain only publishing settings, public Steam metadata, summary stats,
and public achievement sections.

### Local Orphan Auth Cleanup

Older failed local callback attempts may have created `app_users` rows before
the callback persistence transaction existed. In local/dev only, you can remove
orphan auth rows that have no linked Steam account. This does not delete
`steam_profiles`, games, achievements, sync data, or valid linked accounts.

Check safe counts first:

```sql
select
  (select count(*) from app_users) as app_users,
  (select count(*) from user_steam_accounts) as user_steam_accounts,
  (select count(*) from user_preferences) as user_preferences,
  (select count(*) from public_profiles) as public_profiles,
  (select count(*) from auth_sessions) as auth_sessions;
```

Clean only orphan app users:

```sql
with orphan_users as (
  select au.id
  from app_users au
  left join user_steam_accounts usa on usa.user_id = au.id
  where usa.id is null
),
deleted_sessions as (
  delete from auth_sessions
  where user_id in (select id from orphan_users)
  returning id
),
deleted_public_profiles as (
  delete from public_profiles
  where user_id in (select id from orphan_users)
  returning id
),
deleted_preferences as (
  delete from user_preferences
  where user_id in (select id from orphan_users)
  returning id
),
deleted_users as (
  delete from app_users
  where id in (select id from orphan_users)
  returning id
)
select
  (select count(*) from deleted_sessions) as auth_sessions_deleted,
  (select count(*) from deleted_public_profiles) as public_profiles_deleted,
  (select count(*) from deleted_preferences) as user_preferences_deleted,
  (select count(*) from deleted_users) as app_users_deleted;
```

Then rerun the safe counts query. Do not select `session_token_hash`; only row
counts are needed.

### Steam Callback Troubleshooting

If the browser returns to the frontend with `auth_error=<reason_code>`, inspect
backend logs for `event=callback_failed`. The log includes only a safe
`reasonCode`, a generic safe message, and whether minimum OpenID fields were
present.

Safe callback reason codes:

- `auth_state_missing`: missing or expired auth state cookie.
- `auth_state_invalid`: callback state mismatch.
- `openid_missing_required_fields`: required OpenID fields were absent.
- `openid_cancelled`: the user cancelled the Steam login.
- `openid_verification_failed`: Steam rejected the OpenID assertion.
- `openid_verification_request_failed`: backend verification request to Steam
  failed.
- `steam_id_extract_failed`: claimed identity did not contain a valid SteamID64.
- `steam_profile_upsert_failed`: profile persistence failed.
- `app_user_link_failed`: app user/profile claiming persistence failed.
- `session_create_failed`: session creation failed.
- `callback_unexpected_error`: unexpected callback failure.

Local URL consistency is important:

- `BACKEND_PUBLIC_URL` should point to `http://localhost:3000`.
- `FRONTEND_PUBLIC_URL` should point to `http://localhost:3001`.
- `AUTH_COOKIE_SECURE=false` is expected for local HTTP.
- Do not mix `localhost` and `127.0.0.1` during the same login attempt because
  cookies are host-bound.
- Do not use Docker service names such as `backend` in browser-facing OpenID
  URLs.

Never paste full Steam OpenID callback URLs, raw OpenID query payloads, cookie
values, raw session tokens, or `session_token_hash` values into logs, docs, or
tickets.

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
