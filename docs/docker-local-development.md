# Docker Local Development

This project is Docker-first. Local backend services should run in Docker containers.

## Services

- `postgres`: PostgreSQL database for local development.
- `redis`: Redis for BullMQ background jobs.
- `backend`: NestJS backend in watch mode.
- `web`: Next.js frontend in dev mode.

## Start Containers

Run the Docker preflight before app-service startup:

```sh
pnpm docker:preflight
docker-compose config --quiet
```

The default validated app-service command is:

```sh
docker-compose up -d postgres redis backend web
```

This repo's `backend` and `web` services are built from local Dockerfiles, so a
working Compose v2 plus `buildx` is required for app-image builds.

Compose keeps backend `dist` output and web `.next` output in named volumes so
the container watch processes do not fight the bind-mounted workspace.

Check the local Docker toolchain explicitly:

```sh
docker compose version
docker buildx version
docker-compose version
```

```sh
docker compose up
```

If your local Docker install still uses the legacy standalone command:

```sh
docker-compose up
```

Run in the background:

```sh
docker compose up -d
```

If `docker-compose up -d postgres redis backend web` reports a message such as
`Docker Compose requires buildx plugin to be installed`, Compose can still
validate config and may still run prebuilt-image services, but local `backend`
and `web` image builds are blocked until `buildx` is installed.

## Buildx Requirement

Supported local Docker setups:

- Docker Desktop with Compose v2 and `buildx`
- Docker Engine with the Compose v2 plugin and the `buildx` plugin
- A compatible standalone `docker-compose` install that can delegate builds to
  `buildx`

If `docker buildx version` fails:

- update Docker Desktop; or
- install the Docker `buildx` plugin for the local Docker Engine; or
- use the host-run fallback below until the local Docker install is fixed.

## Stop Containers

```sh
docker compose down
```

Stop containers and remove the PostgreSQL data volume:

```sh
docker compose down -v
```

Only use `-v` when you intentionally want to delete local database data.

## Rebuild

```sh
docker compose build
docker compose up
```

Or rebuild while starting:

```sh
docker compose up --build
```

If build commands fail before the repo Dockerfiles start, confirm `docker buildx version`
works locally. A missing `buildx` plugin blocks `backend` and `web` image
builds even when `docker-compose` itself is present.

## View Logs

All services:

```sh
docker compose logs -f
```

Backend only:

```sh
docker compose logs -f backend
```

Postgres only:

```sh
docker compose logs -f postgres
```

Redis only:

```sh
docker compose logs -f redis
```

## Ports

- Backend tools home: `http://localhost:3000`
- Backend health check: `http://localhost:3000/health`
- Swagger UI: `http://localhost:3000/docs`
- OpenAPI JSON: `http://localhost:3000/openapi.json`
- BullMQ dashboard: `http://localhost:3000/queues`
- Frontend: `http://localhost:3001`
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`

The host ports can be changed with `BACKEND_PORT`, `POSTGRES_PORT`, and
`REDIS_PORT` in a local `.env` file. The frontend port can be changed with
`WEB_PORT`.

The frontend browser API base URL should remain:

```txt
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
```

Do not use the Docker hostname `backend` for browser-side SDK calls.

## Backend Environment

Backend runtime environment for local Docker development lives in:

```txt
apps/backend/.env
```

Create it from:

```txt
apps/backend/.env.example
```

The file is intentionally ignored by Git and must never be committed. Put
local-only backend secrets there, including `STEAM_API_KEY`. Docker Compose
loads this file into the `backend` service with `env_file`.

Do not paste `.env` contents, `STEAM_API_KEY`, or rendered Compose config that
includes secrets into logs, docs, or tickets. Prefer:

```sh
docker-compose config --quiet
docker-compose exec -T backend pnpm steam:config-check
```

The config check prints only safe booleans, such as whether `STEAM_API_KEY` is
configured. It does not call Steam and does not print env values.

After changing `apps/backend/.env`, recreate the backend container:

```sh
docker-compose up -d --force-recreate backend
```

Or recreate the full local stack:

```sh
docker-compose up -d postgres redis backend web
```

## Database URL Inside Docker

Inside Docker, the backend must connect to PostgreSQL through the Compose service name:

```txt
postgresql://postgres:postgres@postgres:5432/steam_tracker
```

The hostname is `postgres` because Compose creates a private network where services can reach each other by service name. Do not use `localhost` in the backend container `DATABASE_URL`; inside the backend container, `localhost` means the backend container itself, not the PostgreSQL container.

From the host machine, database tools can connect through the published port:

```txt
postgresql://postgres:postgres@localhost:5432/steam_tracker
```

## Redis Inside Docker

Inside Docker, the backend connects to Redis through the Compose service name:

```txt
REDIS_HOST=redis
REDIS_PORT=6379
```

Do not use `localhost` for Redis inside the backend container. Inside a
container, `localhost` means the backend container itself.

From the host machine, Redis tools can connect through the published port:

```txt
localhost:6379
```

## Startup Ordering

The backend service uses `depends_on` with `condition: service_healthy`.
PostgreSQL has a `pg_isready` healthcheck, and Redis has a `redis-cli ping`
healthcheck, so the backend container waits until both services report healthy
before starting.

This startup ordering does not apply migrations and does not guarantee the
schema exists. It only ensures the database and Redis servers are accepting
connections.

## Migrations

Migrations are SQL-first and live under:

```txt
apps/backend/src/db/migrations
```

Migrations are not executed automatically on container startup. They are run manually with the backend migration scripts:

```sh
docker compose exec backend pnpm migration:status
docker compose exec backend pnpm migration:pending
docker compose exec backend pnpm migration:run
```

See `docs/migrations.md` for the full migration workflow.

## Queue Jobs

Sync jobs use BullMQ with Redis. The local queue name is configured by:

```txt
SYNC_QUEUE_NAME=steam-sync
```

Redis is only operational job infrastructure. User-visible sync status and
history live in PostgreSQL `sync_runs`.

The backend exposes a local Bull Board UI at:

```txt
http://localhost:3000/queues
```

The root backend URL also links to Swagger UI and the queue dashboard:

```txt
http://localhost:3000
```

A future dedicated migration service can still be added. It should:

- depend on healthy `postgres`;
- use the same Docker network and `DATABASE_URL`;
- run explicitly when requested;
- record applied migrations;
- avoid ORM schema sync.

## Local Prerequisites

- Docker Desktop or Docker Engine with Compose v2.
- Docker `buildx` support for local `backend` and `web` image builds.
- If `docker compose` is unavailable, install the Docker Compose v2 plugin or
  use `docker-compose` until the local Docker installation is upgraded.
- pnpm is only required on the host if you run backend scripts outside Docker.

## Host Fallback

Docker-first remains the default. If app-service builds are blocked by missing
`buildx`, a safe temporary fallback is to run only PostgreSQL and Redis in
Docker, then run the backend and web from the host.

Start infra only:

```sh
POSTGRES_PORT=55432 REDIS_PORT=56379 docker-compose up -d postgres redis
```

Validated host commands:

```sh
DATABASE_URL=postgresql://postgres:postgres@localhost:55432/steam_tracker REDIS_HOST=localhost REDIS_PORT=56379 pnpm --filter @steam-achievement/backend migration:status
DATABASE_URL=postgresql://postgres:postgres@localhost:55432/steam_tracker REDIS_HOST=localhost REDIS_PORT=56379 pnpm --filter @steam-achievement/backend seed:dev
DATABASE_URL=postgresql://postgres:postgres@localhost:55432/steam_tracker REDIS_HOST=localhost REDIS_PORT=56379 pnpm --filter @steam-achievement/backend milestones:backfill-dev
DATABASE_URL=postgresql://postgres:postgres@localhost:55432/steam_tracker REDIS_HOST=localhost REDIS_PORT=56379 pnpm --filter @steam-achievement/backend badges:backfill-dev
```

Then run the app processes from the host with matching localhost settings. Keep
`NEXT_PUBLIC_API_BASE_URL=http://localhost:3000` for the browser SDK client.

## Redis Troubleshooting

Check Redis health:

```sh
docker compose ps redis
docker compose logs redis
```

If Redis is unhealthy, restart it:

```sh
docker compose restart redis
```

With legacy Compose:

```sh
docker-compose restart redis
```
