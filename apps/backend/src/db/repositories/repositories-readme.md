# Repositories

Repository classes live here and own SQL/database access.

Controllers must not query the database directly. Services orchestrate domain flows and
call repositories for persistence.

Feature modules should not import repositories directly. Export database-facing
providers from `src/db/services` and let those services wrap repository calls.
