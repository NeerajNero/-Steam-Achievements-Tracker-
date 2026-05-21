# Release Readiness

This project is a local/dev Steam-only achievement hunting platform. The current
readiness target is a stable local demonstration build, not production
deployment.

## Current Feature Set

- Steam profile sync and queued sync history.
- Public Steam profile dashboards and public profile slugs.
- Signed-in Hunter Command Center dashboard at `/dashboard`.
- Global Steam game browsing with achievements and tracked players.
- Profile snapshots, milestones, badges, showcase, and leaderboards.
- Game guides and achievement roadmaps.
- Gaming sessions for scheduled co-op/boosting.
- Guide votes, guide comments, session comments, and report intake.
- Public activity feed and profile/game activity sections.
- Deterministic local smoke scripts for auth-backed guide, session, community,
  badge, seed, and API flows.

## Local Startup

```sh
pnpm docker:preflight
docker-compose config --quiet
docker-compose up -d postgres redis backend web
docker-compose exec -T backend pnpm migration:status
docker-compose exec -T backend pnpm seed:dev
docker-compose exec -T backend pnpm milestones:backfill-dev
docker-compose exec -T backend pnpm badges:backfill-dev
```

App-service startup requires Docker Compose plus `buildx` because `backend` and
`web` are built from local Dockerfiles. Verify locally with:

```sh
docker compose version
docker buildx version
```

If `buildx` is missing, do not mark Docker app-service validation as passed.
Use the fallback path documented in `docs/docker-local-development.md`: run only
`postgres` and `redis` in Docker, then run backend/web from the host.

Local URLs:

- web: `http://localhost:3001`
- backend: `http://localhost:3000`
- Swagger: `http://localhost:3000/docs`
- Bull Board: `http://localhost:3000/queues`

## Smoke Checklist

Run backend/API smoke:

```sh
docker-compose exec -T backend pnpm api:smoke
docker-compose exec -T backend pnpm guide:auth-smoke
docker-compose exec -T backend pnpm session:auth-smoke
docker-compose exec -T backend pnpm community:auth-smoke
docker-compose exec -T backend pnpm badges:auth-smoke
```

Run frontend smoke against the web container:

```sh
docker-compose exec -T -e WEB_URL=http://localhost:3000 web node scripts/web-smoke.js
```

Optional route checks:

```sh
docker-compose exec -T -e WEB_URL=http://localhost:3000 -e WEB_PUBLIC_PROFILE_SLUG=nero web node scripts/web-smoke.js
docker-compose exec -T -e WEB_URL=http://localhost:3000 -e WEB_GUIDE_SLUG=demo-completion-roadmap web node scripts/web-smoke.js
```

## Test Checklist

```sh
pnpm --filter @steam-achievement/backend type-check
pnpm --filter @steam-achievement/backend build
pnpm --filter @steam-achievement/backend test
docker-compose exec -T backend pnpm test
docker-compose exec -T backend pnpm test:integration
pnpm --filter @steam-achievement/client-sdk build
pnpm sdk:build
pnpm --filter @steam-achievement/web type-check
pnpm --filter @steam-achievement/web test
pnpm --filter @steam-achievement/web build
```

The backend OpenAPI coverage test is expected to bootstrap only the lightweight
document module. It does not connect to PostgreSQL or Redis and uses a
spec-local timeout instead of increasing the global Vitest timeout.

## Real Steam Sync Checklist

Real sync requires `STEAM_API_KEY` in `apps/backend/.env`. Never print the key.

```sh
docker-compose exec -T backend pnpm steam:config-check
docker-compose exec -T backend pnpm real-sync:smoke -- <STEAM64_ID>
docker-compose exec -T backend pnpm real-sync:smoke -- <STEAM64_ID> --app-ids=550
docker-compose exec -T backend pnpm steam:data-diagnostics -- <STEAM64_ID> --app-ids=550,203160
```

Achievement sync may return `partial_success` when Steam denies player
achievement access. That is acceptable for private or restricted profiles.
Diagnostics should show whether missing data is caused by Steam privacy/API
availability, persistence, or frontend display.

The UI distinguishes Steam data states:
- `not_synced`: achievement metadata has not been stored yet.
- `metadata_only`: achievement metadata exists, but player unlock state is
  unavailable.
- `unlock_state_synced`: player unlock rows exist.
- `no_achievements`: confirmed zero-achievement state.

Do not treat metadata-only achievements as locked, and do not label unsynced
metadata as “No achievements.”

## Frontend UI Smoke

Check the main routes:

- `/`
- `/dashboard`
- `/profiles/76561198000000000`
- `/profiles/76561198000000000/games/910001`
- `/games`
- `/games/910001`
- `/games/910001/guides`
- `/games/910001/sessions`
- `/leaderboards`
- `/leaderboards/completion_percentage`
- `/activity`
- `/settings`
- `/account/guides`
- `/sessions`
- `/badges`

If the web container shows stale route or module errors:

```sh
pnpm web:clean
pnpm web:recreate
```

## Migration Rules

- SQL migrations are the schema source of truth.
- Do not use ORM schema sync or `drizzle-kit push`.
- Applied migrations are immutable; create a new forward migration for schema
  changes.
- Drizzle schema files mirror reviewed SQL migrations only.

## OpenAPI And SDK Rules

Regenerate only when backend API shape changes:

```sh
pnpm openapi:generate
pnpm sdk:generate
pnpm --filter @steam-achievement/client-sdk build
pnpm sdk:build
pnpm web:recreate
```

Do not manually edit `libs/client-sdk/src/generated`.

## Secret Handling

Never print or commit:

- `.env`
- `STEAM_API_KEY`
- auth cookies
- raw session tokens
- `auth_sessions.session_token_hash`
- raw OpenID callback URLs or assertion payloads
- full Steam Web API URLs with key query parameters

Use safe checks such as `steam:config-check`, table counts, and public IDs.

## Known Limitations

Intentionally deferred:

- production deployment and production hardening;
- real-time chat;
- notifications and reminders;
- AI recommendations in the Hunter Command Center;
- uploads, Cloudinary, profile banners, and guide images;
- generated share cards/gamercards;
- moderation dashboard and moderation action workflows;
- payments;
- advanced anti-cheat/fairness systems;
- leaderboard retention policies and frozen ranking batches;
- rich text guide editor;
- nested comment threads;
- calendar integrations.

## Current Readiness Status

The app is release-ready for a local/dev demo when:

- `pnpm docker:preflight` passes, or a documented host fallback is used while a
  local Docker `buildx` fix is pending;
- all migrations are applied;
- seed/backfill commands complete;
- backend and web type-check/build/test commands pass;
- `api:smoke`, auth smoke scripts, and web smoke pass;
- no secrets are printed in logs or docs;
- real Steam sync is verified with a local `STEAM_API_KEY` when live data is
  needed.
