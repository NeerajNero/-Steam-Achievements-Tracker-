# Badges And Showcase

Badges are product-defined achievements earned from Steam profile milestones.
They are stored separately from raw Steam achievement data so public profiles can
show long-lived recognition without recalculating milestone history on every
page load.

## Badge Definitions

Badge definitions live in the `badges` table and are seeded by migration
`0007-add-badges-and-showcase.sql` with stable codes such as:

- `first-sync`
- `first-completed-game`
- `completed-games-1`, `completed-games-5`, `completed-games-10`,
  `completed-games-25`
- `achievements-100`, `achievements-500`, `achievements-1000`
- `completion-25`, `completion-50`, `completion-75`, `completion-90`,
  `completion-100`

These are product constants, so they are inserted by SQL migration with
`ON CONFLICT DO NOTHING`.

## Awarding

Milestones map to badges when the milestone threshold has a matching badge code.
Awarding is idempotent through `UNIQUE(steam_profile_id, badge_id)` on
`profile_badges`.

New snapshot-created milestones award badges automatically. Existing milestone
history can be backfilled locally:

```sh
docker-compose exec -T backend pnpm badges:backfill-dev
```

The command is local/dev only and prints safe counts only. It does not print
secrets, cookies, tokens, token hashes, or Steam API keys.

## Activity

When a badge is newly awarded, the backend records a public `badge_earned`
activity event with safe public metadata only. Re-running backfill does not
create duplicate badge rows or duplicate badge activity.

## Profile Showcase

`profile_showcase_items` lets the owner of a claimed Steam profile choose up to
six public or private showcase items. V1 focuses the frontend editor on earned
badges, while the schema also supports milestones, achievements, guides, and
gaming sessions for future UI expansion.

Rules:

- authenticated users can manage only their linked primary Steam profile;
- badge showcase items must reference earned `profile_badges`;
- milestone and achievement items must belong to the same Steam profile;
- guide and session items must be owned by the user, or public when showcased
  publicly;
- public endpoints return only items with `visibility = 'public'`;
- no account-private fields, sessions, cookies, or token hashes are exposed.

## Frontend

Public profile dashboards and `/u/:slug` pages show earned badges and profile
showcase items through SDK-backed hooks. Settings includes a simple showcase
editor for selecting earned badges. There is no drag-and-drop yet; ordering is
the selected badge order.

## Deferred

- image uploads and Cloudinary;
- generated share cards and gamercards;
- realtime notifications;
- drag-and-drop showcase editing;
- badge artwork beyond logical `icon_key` values.
