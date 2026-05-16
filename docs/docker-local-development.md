# Docker Local Development

This project is Docker-first. Local backend services should run in Docker containers.

## Services

- `postgres`: PostgreSQL database for local development.
- `redis`: Redis for BullMQ background jobs.
- `backend`: NestJS backend in watch mode.
- `web`: Next.js frontend in dev mode.

## Start Containers

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
- If `docker compose` is unavailable, install the Docker Compose v2 plugin or use `docker-compose` until the local Docker installation is upgraded.
- pnpm is only required on the host if you run backend scripts outside Docker.

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
