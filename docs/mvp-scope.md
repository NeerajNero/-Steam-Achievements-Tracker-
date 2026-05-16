# MVP Scope

## MVP Goal

Deliver a Steam Achievement Intelligence Tracker foundation that can sync a Steam profile, store achievement progress, and present useful completion-focused summaries from the database.

## MVP Includes

- Steam profile sync.
- Owned games sync.
- Achievement metadata sync.
- User achievement unlock sync.
- Dashboard summary.
- Game library list.
- Game details.
- Nearest 100% games.
- Rarest unlocked achievements.
- Sync history and status.

## MVP Excludes

- Auth.
- Friends and social features.
- Leaderboards.
- AI recommendations.
- Frontend polish beyond basic screens.
- Multi-platform support.
- Guide integration.

## Backend Scope

- Controllers expose thin endpoints for profile, game, achievement, and sync reads/actions.
- Services orchestrate use cases.
- Feature services use database-facing services for persistence.
- Repositories read and write PostgreSQL data behind the database-service
  boundary.
- Steam external calls are isolated in a Steam API client/provider.
- Dashboard and details endpoints read from the database only.

## Data Scope

- Store Steam profile identity and visibility state.
- Store canonical game records.
- Store profile-owned game progress records.
- Store canonical achievement metadata where available.
- Store profile achievement unlock state.
- Store sync run status and failure details.

## Decision

The MVP should include nearest 100% games and rarest unlocked achievements, even though more advanced recommendations are deferred.

## Why

Those two features make the product feel like an intelligence tracker instead of a plain achievement mirror, while still relying on straightforward synced data and deterministic queries.

## Out Of Scope Until Later

- User accounts.
- Saved goals.
- Public profile pages.
- Friend graph imports.
- Cross-user comparison.
- AI-generated planning.
- External guide data.
