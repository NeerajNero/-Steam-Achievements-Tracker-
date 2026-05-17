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

The current local/dev baseline schema is created by
`apps/backend/src/db/migrations/0001-initial-platform-schema.sql`.

The current forward migrations are:

```txt
0001-initial-platform-schema.sql
0002-add-profile-snapshots-and-leaderboards.sql
```

Future schema changes should be added as new reviewed SQL migration files under
`apps/backend/src/db/migrations`.

The baseline migration intentionally squashes the original MVP schema and
achievement progress function because the project is still local/dev only and
the local PostgreSQL volume can be reset. After this reset, applied migrations
should not be edited; future changes get new numbered forward migrations.

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

`0001-initial-platform-schema.sql` includes
`refresh_profile_game_achievement_progress(profile_id, steam_app_id)`.

Achievement sync upserts canonical achievements and profile unlock state, then
calls the function once per synced game. PostgreSQL derives:
- total achievements;
- unlocked achievements;
- completion percentage;
- `games.has_achievements`.

This keeps dashboard-critical progress fields consistent with the persisted
rows they summarize.

## Auth And Profile Claiming

The initial platform schema includes auth/profile-claiming tables, and the
backend implements Steam-only auth runtime.

- `app_users` stores internal application users.
- `user_steam_accounts` links app users to claimed Steam profiles.
- `auth_sessions` is reserved for server-managed sessions and stores hashed
  session tokens only.
- `user_preferences` stores authenticated user settings.
- `public_profiles` stores publishing settings and future slug support.

Sign in with Steam is the current auth method. User ownership, publishing
settings, and sessions stay separate from raw Steam sync data in
`steam_profiles`, `games`, `achievements`, and profile-specific sync tables.

## Media Asset Decision

Steam-provided avatars, game icons/logos, and achievement icons are stored as
URL strings from Steam data. PostgreSQL URL fields remain the media source of
truth for synced Steam images.

The app does not mirror Steam-provided images into Cloudinary. Cloudinary is
deferred until user-generated or generated media exists, such as profile
banners, guide images, share cards, or generated gamercards.

When that product surface exists, add a reviewed SQL migration for a dedicated
`media_assets` table. Keep user-owned/generated media separate from raw Steam
sync metadata.

## Snapshot And Leaderboard Decision

`0002-add-profile-snapshots-and-leaderboards.sql` adds
`profile_snapshots` and the explicit PostgreSQL function
`create_profile_snapshot(profile_id, reason)`.

Snapshots store periodic aggregate profile stats derived from persisted Steam
profile progress:
- total and completed games;
- total, unlocked, and remaining achievements;
- average completion percentage;
- total playtime;
- rarest unlocked global achievement percentage.

Leaderboards v1 query the latest snapshot per Steam profile instead of
recomputing every leaderboard directly from raw `profile_games` and
`profile_achievements` rows on each request. This keeps public ranking pages
fast, stable, and explainable while preserving PostgreSQL as the source of
truth.

`leaderboard_entries` was intentionally not added in v1. Materialized
leaderboard rows can be introduced later if live latest-snapshot queries become
too expensive or moderation/fairness rules require frozen ranking batches.

Manual snapshot creation is protected by auth/session ownership. A signed-in
user can create a manual snapshot only for a claimed Steam profile, while
`admin` and `moderator` roles can create for any profile. Sync-created
snapshots are internal workflow writes and use a five-minute dedupe window to
avoid excessive duplicate snapshots.

## Guides And Roadmaps Decision

`0003-add-guides-foundation.sql` adds Steam game guide tables:

- `guides` stores one game-scoped roadmap authored by an app user.
- `guide_sections` stores ordered plain-text sections.
- `guide_achievements` links guide content to canonical Steam achievement rows.

The schema uses `status` and `visibility` fields instead of destructive deletes.
Guide documents use `ON DELETE RESTRICT` foreign keys so user-authored content is
not accidentally removed with profile or game cleanup. Public guide reads return
only `published` + `public` guides, while account guide reads require auth and
return the current author's drafts and private/unlisted work.

Rich text, images, comments, votes, moderation workflows, and guide history are
deferred until they have reviewed data models and migrations.

## Gaming Sessions Decision

`0004-add-gaming-sessions-foundation.sql` adds Steam game session tables:

- `gaming_sessions` stores scheduled co-op/boosting sessions for one Steam app.
- `gaming_session_participants` stores host and participant membership state.
- `gaming_session_achievements` links sessions to canonical Steam achievements.

The schema is Steam-only and uses `steam_app_id` directly. It intentionally does
not add platform-neutral abstractions.

Session history uses status fields (`open`, `full`, `completed`, `cancelled`)
instead of destructive deletes. Foreign keys use `ON DELETE RESTRICT` so session
history is not removed accidentally when users, games, or achievements are
cleaned up later.

Chat, comments, reminders, calendar integrations, uploads, moderation, and
payments are deferred until each has its own reviewed data model.

## Community Interactions Decision

`0005-add-community-interactions.sql` adds lightweight community tables:

- `guide_votes` for one authenticated upvote/downvote per user per guide.
- `guide_comments` for flat guide comments.
- `session_comments` for flat gaming-session comments.
- `content_reports` for authenticated report intake.

Comments and reports use status fields instead of destructive deletes. Comment
deletes are soft deletes (`deleted`), and reports remain private intake records
for a future moderation dashboard.

The schema intentionally does not add nested threads, real-time chat,
notifications, uploads, or moderation action tables yet. Those features need
separate reviewed migrations when their workflows are designed.

## Activity And Milestones Decision

`0006-add-activity-feed-and-milestones.sql` adds:

- `activity_events` for public/private platform events with safe JSON metadata.
- `profile_milestones` for one-time profile milestones generated from snapshots.

Activity rows are append-only public history records. They intentionally store
display-safe metadata only and must not contain secrets, cookies, raw session
tokens, token hashes, OpenID payloads, or private account settings.

Milestones are generated after snapshot creation and deduped by Steam profile,
milestone type, and threshold. A new milestone also records a
`milestone_reached` activity event.

Notifications, real-time feed delivery, share cards, badge artwork, and richer
privacy controls are deferred to future reviewed migrations.

## Badges And Showcase Decision

`0007-add-badges-and-showcase.sql` adds:

- `badges` for product-defined badge definitions seeded by migration;
- `profile_badges` for milestone-derived badge awards;
- `profile_showcase_items` for owner-curated public/private profile showcase
  entries.

Badges are derived from milestone rows and deduped by Steam profile and badge.
Badge awarding records a `badge_earned` activity event only when a new badge is
inserted.

Showcase items are managed by the authenticated owner of the linked Steam
profile. V1 limits the showcase to six items and focuses the frontend editor on
earned badges. Image uploads, Cloudinary, generated share cards, notifications,
and badge artwork pipelines remain deferred.
