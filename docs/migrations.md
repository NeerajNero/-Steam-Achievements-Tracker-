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
0001-create-mvp-schema.sql
0002-add-achievement-progress-refresh-function.sql
0003-add-profile-snapshots.sql
0004-add-achievement-goals.sql
```

The runner sorts filenames lexicographically, so keep the zero-padded prefix.

## Do Not Edit Applied Migrations

Do not edit a migration after it has been applied to any shared or persistent database.

The applied `0001-create-mvp-schema.sql` migration must not be edited.
Achievement progress recalculation is added by
`0002-add-achievement-progress-refresh-function.sql`.

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
