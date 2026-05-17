# Migrations

This project uses a simple node-postgres migration runner that executes reviewed SQL files in order.
Drizzle ORM is used only as the type-safe query layer after migrations are applied.

## Why Migration-First

- PostgreSQL schema changes are explicit and reviewable.
- SQL files are the source of truth.
- Application code is written after the database shape exists.
- ORM schema sync is not used.
- Drizzle schema files mirror the database for type-safe queries; they do not create or push schema changes.
- PostgreSQL functions, views, triggers, extensions, comments, and indexes also
  require numbered SQL migrations.

## How Migrations Work

- SQL files live in `apps/backend/src/db/migrations`.
- Files run in lexicographic filename order.
- Applied migrations are tracked in the `schema_migrations` table.
- The runner skips filenames already present in `schema_migrations`.
- Each migration runs inside a transaction where practical.
- The runner exits non-zero on SQL or connection failure.

The tracking table is created by `migration:run` if it does not already exist:

```sql
schema_migrations (
  id BIGSERIAL PRIMARY KEY,
  filename TEXT NOT NULL UNIQUE,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
)
```

Status and pending commands do not create the tracking table. If the table does not exist yet, every SQL file is treated as pending.

## Current Migrations

The current local/dev baseline is:

```txt
0001-initial-platform-schema.sql
```

This file intentionally squashes the original MVP schema and achievement
progress function into one initial platform schema because the project is still
local/dev only and the local PostgreSQL volume can be reset. It also includes
the auth/profile-claiming foundation tables.

If you have a database that previously applied the old local migrations, reset
that local database before applying the squashed baseline. Do not attempt to run
the squashed `0001` on top of a database that already has the old tables.

After this reset point, treat applied migrations as immutable again. Future
schema changes must be new numbered forward migrations.

The current forward migration after the baseline is:

```txt
0002-add-profile-snapshots-and-leaderboards.sql
```

It adds `profile_snapshots` and `create_profile_snapshot(...)` for snapshot and
leaderboard v1 reads.

The next forward migration is:

```txt
0003-add-guides-foundation.sql
```

It adds Steam game guides, ordered guide sections, and guide-to-achievement
mappings. The migration uses status/archive lifecycle fields instead of cascade
deletes or hard-deleting guide documents.

## Create A Migration

```sh
pnpm migration:create add-example-change
```

Inside Docker:

```sh
docker compose exec backend pnpm migration:create add-example-change
```

If your local Docker install uses the legacy Compose command:

```sh
docker-compose exec backend pnpm migration:create add-example-change
```

After creating the file, write and review the SQL manually before running it.

## Check Status

Host command:

```sh
pnpm migration:status
```

Docker command:

```sh
docker compose exec backend pnpm migration:status
```

The status output shows each migration as `applied` or `pending`.

## Show Pending Migrations

Host command:

```sh
pnpm migration:pending
```

Docker command:

```sh
docker compose exec backend pnpm migration:pending
```

## Run Migrations

Migrations are manual only. They are not run by `docker compose up` and are not run on backend startup.

Host command:

```sh
pnpm migration:run
```

Docker command:

```sh
docker compose exec backend pnpm migration:run
```

Run migrations only after:

- the SQL has been reviewed;
- Postgres is running and healthy;
- `DATABASE_URL` points at the intended database.

Inside Docker, `DATABASE_URL` must use the Compose service hostname:

```txt
postgresql://postgres:postgres@postgres:5432/steam_tracker
```

Do not use `localhost` inside the backend container.

## Expected Workflow

1. Create migration:

   ```sh
   pnpm migration:create add-example-change
   ```

2. Review and edit the SQL file.

3. Check pending migrations:

   ```sh
   pnpm migration:pending
   ```

4. Run migrations manually:

   ```sh
   pnpm migration:run
   ```

5. Verify status:

   ```sh
   pnpm migration:status
   ```

## Ordering

Use clear numbered filenames:

```txt
0001-initial-platform-schema.sql
0002-add-profile-snapshots-and-leaderboards.sql
0003-add-guides-foundation.sql
0004-add-gaming-sessions-foundation.sql
0005-add-community-interactions.sql
0006-add-activity-feed-and-milestones.sql
```

The runner sorts filenames lexicographically, so keep the zero-padded prefix.

## Do Not Edit Applied Migrations

Do not edit a migration after it has been applied to any shared or persistent database.

The only exception so far was the intentional local/dev squash to
`0001-initial-platform-schema.sql`. That required deleting the local PostgreSQL
volume and reapplying the new baseline from an empty database.

If a change is needed:

- create a new migration;
- make the correction explicitly;
- preserve the historical record of what actually ran.

## Rollback Philosophy

Rollback scripts are not implemented yet. Prefer forward-only corrective migrations for local and production consistency.

For future rollback support:

- add explicit `down` SQL files only when the rollback is safe and reviewed;
- avoid destructive rollback defaults;
- document data-loss risks in the rollback migration;
- keep rollback execution manual.

## No Schema Sync

Do not introduce Prisma, TypeORM, or ORM schema sync for this project. The migration runner executes raw SQL only.

Do not use `drizzle-kit push` or any other schema-push workflow. When a migration changes a table, update the matching Drizzle schema file in `apps/backend/src/db/schema` in the same change so repositories and database-facing services remain type-safe.

## Current Forward Migrations

- `0001-initial-platform-schema.sql`: Steam profile/game/achievement sync schema,
  auth/profile claiming foundation, and profile-game progress function.
- `0002-add-profile-snapshots-and-leaderboards.sql`: profile snapshots and
  leaderboard v1 support.
- `0003-add-guides-foundation.sql`: Steam game guides, guide sections, and guide
  achievement mapping.
- `0004-add-gaming-sessions-foundation.sql`: scheduled Steam game sessions,
  participants, and targeted session achievement mapping.
- `0005-add-community-interactions.sql`: guide votes, guide comments, session
  comments, and moderation report intake.
- `0006-add-activity-feed-and-milestones.sql`: public/private activity events
  and profile milestone history generated from snapshots.
