# Testing

Repository and database-service integration tests use the migrated PostgreSQL
schema in Docker.

## Prerequisites

- Docker services are running.
- SQL migrations have been applied manually.
- `DATABASE_URL` is available inside the backend container.

Inside Docker, the backend uses:

```txt
postgresql://postgres:postgres@postgres:5432/steam_tracker
```

If running tests from the host, use the published Postgres port from Compose. On this machine, `5432` may already be occupied, so the Docker database may be exposed on `55432`:

```sh
DATABASE_URL=postgresql://postgres:postgres@localhost:55432/steam_tracker pnpm --filter @steam-achievement/backend test:integration
```

Do not hardcode host-specific URLs in tests.

## Run Integration Tests In Docker

```sh
docker-compose exec backend pnpm test:integration
```

If your local Docker supports Compose v2:

```sh
docker compose exec backend pnpm test:integration
```

## Cleanup

Repository and database-service integration tests use deterministic test Steam
IDs and Steam app ID ranges. Each test cleans data in dependency order:

1. `sync_runs`
2. `profile_achievements`
3. `profile_games`
4. `achievements`
5. `games`
6. `steam_profiles`

The cleanup runs after each test and again after the suite completes.

## Migration-First Rule

The tests use the migrated schema. They do not create tables, run schema sync, or use `drizzle-kit push`.

Apply reviewed SQL migrations before running repository/database-service
integration tests:

```sh
docker-compose exec backend pnpm migration:run
docker-compose exec backend pnpm test:integration
```
