# Repositories

Repository classes live here and own SQL/database access.

Controllers must not query the database directly. Feature services orchestrate
domain flows and call database-facing services for persistence. Database-facing
services wrap repository calls.

Feature modules should not import repositories directly. Export database-facing
providers from `src/db/services` and let those services wrap repository calls.
