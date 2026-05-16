# Development Seed Data

The development seed creates fake local-only data for the MVP read endpoints.
It does not call Steam, does not run migrations, and does not use schema sync.

## Demo Profile

- Steam ID: `76561198000000000`
- Persona name: `Demo Achievement Hunter`
- Visibility state: `3`
- Private: `false`

Use this profile from the frontend home page at:

```txt
http://localhost:3001
```

## Seeded Games

- `910001` - Demo Complete Quest
- `910002` - Demo Last Mile
- `910003` - Demo Balanced Adventure
- `910004` - Demo Fresh Start
- `910005` - Demo Idle Sandbox
- `910006` - Demo Endless Grind

The data includes:
- one completed game;
- one near-complete game with one achievement remaining;
- one partially completed game;
- one untouched achievement-enabled game;
- one game with zero achievements;
- one high-playtime unfinished game;
- rare, common, hidden, locked, and unlocked achievements;
- success, partial success, and failed sync runs.

Frontend game detail pages must display achievement `unlockState` explicitly.
If future seed data includes metadata-only achievements, show
`Unknown unlock state` rather than treating those achievements as locked.

## Run In Docker

Start the Docker services first:

```sh
docker-compose up -d postgres backend
```

Apply migrations manually if needed:

```sh
docker-compose exec backend pnpm migration:run
```

Seed the demo data:

```sh
docker-compose exec backend pnpm seed:dev
```

Reset only the deterministic demo data:

```sh
docker-compose exec backend pnpm seed:reset-dev
```

The reset command deletes child rows first and uses the demo Steam ID plus seeded
Steam app IDs as boundaries. It does not truncate tables. Canonical seeded game
and achievement rows are removed only when no remaining profile data references
them.

## Validation Commands

```sh
docker-compose exec backend pnpm test
docker-compose exec backend pnpm test:integration
docker-compose exec backend pnpm api:smoke
```

Frontend checks:

```sh
pnpm --filter @steam-achievement/web type-check
pnpm --filter @steam-achievement/web build
```

If your local Docker supports Compose v2, `docker compose` can be used instead
of `docker-compose`.

## Inspect In DBeaver

Use the Docker database connection:

- Host: `localhost`
- Port: `55432` if that is the local Compose port in use, otherwise `5432`
- Database: `steam_tracker`
- User: `postgres`
- Password: `postgres`

Useful tables:
- `steam_profiles`
- `games`
- `profile_games`
- `achievements`
- `profile_achievements`
- `sync_runs`

Filter by:

```sql
select * from steam_profiles where steam_id = '76561198000000000';
select * from games where steam_app_id between 910001 and 910006;
```

## Notes

- The seed data is fake and local-only.
- Steam sync is not implemented yet.
- Backend container `DATABASE_URL` must continue to use the Docker hostname:
  `postgresql://postgres:postgres@postgres:5432/steam_tracker`.
- Host-only curl examples may use `localhost:3000` because they call the
  published backend HTTP port, not the database from inside a container.
