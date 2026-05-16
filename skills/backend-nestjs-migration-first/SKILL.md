---
name: backend:nestjs-migration-first
description: Use when building or modifying the Steam Achievement Tracker NestJS backend with PostgreSQL and SQL migration-first workflow. Triggers for migrations, repositories, modules, services, DTOs, controllers, database schema, and backend smoke tests.
---

# Backend NestJS Migration-First Skill

## Trigger
Use this skill whenever creating or changing backend code in `apps/backend`, especially schema changes, NestJS modules, controllers, services, repositories, DTOs, and database migrations.

## Core rules
1. Migration first: design and write SQL before module/service code.
2. No ORM schema sync.
3. Controllers are thin and delegate to services.
4. Services contain business rules and orchestration.
5. Repositories contain all SQL/database access.
6. No direct DB access from controllers.
7. No Steam API calls from repositories.
8. No `any`; use strict types and DTOs.
9. Keep files/folders kebab-case.
10. Add indexes for every frequent lookup/filter.

## Recommended structure

```txt
apps/backend/src/
  modules/{domain}/
    {domain}.module.ts
    {domain}.controller.ts
    {domain}.service.ts
    dto/
    interfaces/
  db/repositories/{domain}/
    {domain}.repository.ts
  db/migrations/
```

## Migration workflow
1. Read current migrations/schema.
2. Identify existing tables and constraints.
3. Create a new SQL migration with a clear ordered name.
4. Include table comments explaining purpose and lifecycle.
5. Add primary keys, foreign keys, unique constraints, and indexes.
6. Prefer `TIMESTAMPTZ` for dates.
7. Prefer lifecycle `status` or soft-archive fields over hard deletes for business records.
8. Apply migration locally.
9. Regenerate/introspect ORM schema only after SQL is applied.
10. Run typecheck/lint/tests.

## Base schema for Steam tracker MVP
Use these tables unless the repo already has equivalent names:

- `steam_profiles`
- `games`
- `profile_games`
- `achievements`
- `profile_achievements`
- `sync_runs`

## SQL standards
- Use `UUID PRIMARY KEY DEFAULT gen_random_uuid()` for internal IDs.
- Store Steam app IDs as integers.
- Store Steam 64-bit IDs as text.
- Add `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`.
- Add `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()` where records can change.
- Add unique constraints:
  - `steam_profiles(steam_id)`
  - `games(steam_app_id)`
  - `profile_games(profile_id, game_id)`
  - `achievements(steam_app_id, api_name)`
  - `profile_achievements(profile_id, achievement_id)`

## Repository pattern
Repositories should expose methods like:

```ts
findProfileBySteamId(steamId: string)
upsertSteamProfile(input: UpsertSteamProfileInput)
upsertGame(input: UpsertGameInput)
upsertProfileGame(input: UpsertProfileGameInput)
upsertAchievement(input: UpsertAchievementInput)
upsertProfileAchievement(input: UpsertProfileAchievementInput)
createSyncRun(input: CreateSyncRunInput)
completeSyncRun(input: CompleteSyncRunInput)
failSyncRun(input: FailSyncRunInput)
```

## Controller pattern
- Use DTOs for params/query/body.
- Validate `steamId` format as string, not UUID.
- Validate `appId` as integer.
- Return response DTOs, not raw database rows if transformation is needed.

## Sync rules
- Sync operations must be idempotent.
- Partial failures must be recorded in `sync_runs`.
- Do not fail the whole sync because one game has no achievements.
- Private profiles should return a clear domain error.

## Done checklist
- Migration exists and applies cleanly.
- Required indexes exist.
- Repository methods are typed.
- Controller has validation.
- Error cases are handled.
- `pnpm type-check`, `pnpm lint`, and relevant tests pass.
