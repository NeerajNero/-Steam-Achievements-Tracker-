# Backend Architecture

The backend is a NestJS application under `apps/backend`.

## Module Layout

- `database` owns database wiring and migration-first persistence conventions.
- `steam` will isolate Steam Web API integration behind a dedicated client/provider.
- `profiles` will own Steam profile read models and profile-facing endpoints.
- `games` will own game catalog and profile game views.
- `achievements` will own canonical and profile achievement views.
- `sync` will orchestrate future Steam synchronization flows.

## Boundaries

- Controllers stay thin and delegate to services.
- Services own orchestration and domain rules.
- Feature modules import database-facing services from `src/db/services`.
- Database-facing services wrap repositories and are the only persistence
  providers exported by `DatabaseModule`.
- Repositories own SQL and database access, but remain internal to the database
  module.
- Steam Web API calls stay isolated in the Steam module.
- The Steam API key is backend-only and must never be exposed to a frontend.

Business logic, auth, frontend code, and Steam API integration are intentionally not
implemented in this foundation step.
