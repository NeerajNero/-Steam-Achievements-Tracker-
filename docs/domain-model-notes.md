# Domain Model Notes

## Important Entities

### `steam_profiles`

- Stores Steam identity and profile metadata.
- Tracks profile visibility and private-profile state.
- Uses Steam 64-bit IDs as external identity values.

### `games`

- Stores canonical Steam app/game metadata.
- One row per Steam app ID.
- Shared across profiles.

### `profile_games`

- Stores user-specific ownership and progress for a game.
- Links a Steam profile to a canonical game.
- Holds completion counts and playtime-derived fields where available.

### `achievements`

- Stores canonical achievement metadata for a game.
- Separate from whether a specific profile unlocked the achievement.
- Should support missing or partial metadata from Steam.

### `profile_achievements`

- Stores profile-specific achievement unlock state.
- Links a Steam profile to a canonical achievement.
- Tracks unlocked state and unlock time where available.

### `sync_runs`

- Stores sync status, timing, scope, and safe error details.
- Used to explain freshness and failures.
- Should support partial failure reporting later.

### Future: `achievement_goals`

- Stores user-selected achievement or game completion goals.
- Supports planner workflows.

### Future: `profile_snapshots`

- Stores periodic aggregate profile stats.
- Supports progress history and analytics over time.

### Future: `profile_friends`

- Stores friend relationships or imported friend references.
- Supports social comparison once privacy rules are defined.

### Future: `public_profiles`

- Stores public profile publishing preferences and share settings.
- Keeps public profile behavior separate from raw Steam profile sync.

## Important Decisions

### Decision: Steam API calls are not made from controllers directly.

Why:

- Controllers should stay thin.
- External API concerns belong behind a Steam client/provider.
- This keeps retries, timeouts, normalization, and key handling in one place.

### Decision: Controllers call services.

Why:

- Services own application use cases.
- Controllers should translate HTTP input/output, not orchestrate business rules.

### Decision: The sync workflow fetches external Steam data and writes through database services.

Why:

- Sync is an orchestration workflow.
- Feature modules should depend on database-facing services, not repository
  classes.
- Repositories should persist data only and stay internal to the database module.
- Steam API payloads should be normalized before persistence.

### Decision: Dashboard reads from the database only.

Why:

- Dashboard views should be fast and stable.
- Live Steam API calls during dashboard reads would create rate-limit, timeout, and consistency problems.
- Sync freshness can be shown separately through `sync_runs`.

### Decision: Achievement metadata is separate from profile achievement unlock state.

Why:

- Achievement definitions are game-level data.
- Unlock state is profile-specific data.
- This separation supports multiple profiles, rarity analytics, and idempotent sync.

### Decision: Never use ORM schema sync.

Why:

- PostgreSQL schema changes must be explicit, reviewable, and reversible where practical.
- Migration-first flow prevents accidental schema drift.

### Decision: Use migration-first flow only.

Why:

- Tables, constraints, indexes, and comments should be designed before code depends on them.
- Repository code, database-facing service code, and feature service code should
  target an applied schema.

### Decision: Profile visibility and private data must be handled gracefully.

Why:

- Steam profiles can be private or partially unavailable.
- Sync should store a clear state instead of failing silently or corrupting profile analytics.

### Decision: Steam API payloads must be isolated from internal DB models.

Why:

- External response shapes can change and may be incomplete.
- Internal models should represent product needs, not raw API payload structure.
- Normalization keeps downstream services, database services, and repositories
  stable.

## TODO

- Decide whether future public profile URLs use Steam IDs, internal slugs, or both.
- Decide retention policy for long-term `sync_runs` and `profile_snapshots`.
