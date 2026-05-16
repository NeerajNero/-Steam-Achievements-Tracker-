# Database Decisions

## Workflow

This project uses migration-first PostgreSQL development.

1. Design the data shape and indexes.
2. Write a reviewed SQL migration.
3. Apply the migration locally.
4. Update the Drizzle schema mirror under `apps/backend/src/db/schema`.
5. Add repository methods that use Drizzle against the migrated schema.
6. Add or update database-facing services under `apps/backend/src/db/services`.
7. Add feature service and controller code after the persistence boundary exists.

## Current State

The initial MVP schema has been created by
`apps/backend/src/db/migrations/0001-create-mvp-schema.sql`.

Future schema changes should be added as new reviewed SQL migration files under
`apps/backend/src/db/migrations`.

## Rules

- Do not enable ORM schema sync.
- Do not generate unchecked migrations.
- Prefer SQL migrations as the schema source of truth.
- Use Drizzle ORM as the type-safe query layer.
- Do not use `drizzle-kit push`.
- Keep SQL/database access in repositories.
- Keep repositories internal to `DatabaseModule`; feature modules must import
  database-facing services from `src/db/services`, not repositories directly.
- Use idempotent writes for future sync operations.
- Keep durable relational calculations in PostgreSQL where practical.
- Prefer explicit PostgreSQL functions or views over repeated heavy TypeScript
  calculations when the result is derived from persisted relational data.
- Avoid heavy row-by-row triggers for sync recalculation. Sync workflows should
  call explicit functions after their write batch is complete.

## Drizzle Decision

Drizzle schema files mirror the already-applied SQL migrations. They exist for TypeScript inference and query safety, not for database mutation.

Repositories should use Drizzle query builder by default. Raw `pg` access is reserved for the migration runner and low-level driver setup. Database-facing services wrap repositories so other backend modules do not depend on repository classes directly.

## PostgreSQL Calculation Decision

`0002-add-achievement-progress-refresh-function.sql` adds
`refresh_profile_game_achievement_progress(profile_id, steam_app_id)`.

Achievement sync upserts canonical achievements and profile unlock state, then
calls the function once per synced game. PostgreSQL derives:
- total achievements;
- unlocked achievements;
- completion percentage;
- `games.has_achievements`.

This keeps dashboard-critical progress fields consistent with the persisted
rows they summarize.
