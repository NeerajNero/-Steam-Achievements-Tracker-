# Activity Feed And Milestones

## Scope

Activity and milestones are a Steam-only foundation for public progress history.
They are database-backed and do not introduce notifications, real-time delivery,
uploads, share cards, or platform-neutral abstractions.

## Activity Events

`activity_events` stores public or private platform events with safe metadata.
Current public event types are:

- `profile_synced`
- `game_completed`
- `rare_achievement_synced`
- `guide_published`
- `guide_commented`
- `guide_voted`
- `session_created`
- `session_joined`
- `session_commented`
- `milestone_reached`

Only `visibility = 'public'` events are returned from public feed endpoints.
Metadata must contain public display context only. Do not store secrets, cookies,
session tokens, token hashes, raw OpenID payloads, or private account settings in
activity metadata.

## Milestones

`profile_milestones` stores one-time Steam profile achievements derived from
profile snapshots. Initial milestone types are:

- `first_sync`
- `first_completed_game`
- `completed_games_count`
- `unlocked_achievements_count`
- `completion_percentage`
- `rare_achievement`

The v1 generator creates milestones after snapshot creation for:

- first sync;
- first completed game;
- completed game counts at `1`, `5`, `10`, `25`, `50`, and `100`;
- unlocked achievement counts at `100`, `500`, `1000`, `2500`, and `5000`;
- average completion at `25`, `50`, `75`, `90`, and `100` percent.

Each milestone is inserted once per Steam profile/type/threshold. When a new
milestone is inserted, a public `milestone_reached` activity event is recorded.

## Backfill

Existing snapshots can be backfilled into milestones with:

```sh
docker-compose exec -T backend pnpm milestones:backfill-dev
```

To backfill one profile:

```sh
docker-compose exec -T backend pnpm milestones:backfill-dev -- 76561198000000000
```

The command is local/dev only. It reads the latest snapshot for each selected
Steam profile, creates only missing milestones, and records
`milestone_reached` activity only for newly inserted milestone rows. Repeated
runs are idempotent and print safe counts only:

- `profilesProcessed`
- `milestonesCreated`
- `activityEventsCreated`

Badge awards are generated from milestones after snapshot creation. Existing
milestones can be backfilled into badges with:

```sh
docker-compose exec -T backend pnpm badges:backfill-dev
```

New badge rows record `badge_earned` activity events. Repeated badge backfill
runs are idempotent.

## Event Recording

Current integrations record:

- `profile_synced` after successful or partial successful sync workflows;
- `guide_published` when a guide first transitions to published;
- `guide_commented` when a guide comment is created;
- `guide_voted` when a guide vote is upserted;
- `session_created` when a session is created;
- `session_joined` when a participant joins;
- `session_commented` when a session comment is created;
- `milestone_reached` when snapshot-derived milestones are created.
- `badge_earned` when a milestone-derived badge is newly awarded.

`game_completed` and `rare_achievement_synced` are reserved for a future pass
that can reliably detect newly completed games and newly synced rare unlocks.

## API

Public reads:

- `GET /activity`
- `GET /profiles/:steamId/activity`
- `GET /games/:steamAppId/activity`
- `GET /profiles/:steamId/milestones`

These endpoints return public feed data only and never expose auth sessions,
token hashes, private account fields, cookies, or Steam API keys.

## Frontend

Frontend routes and sections:

- `/activity` shows the latest public activity feed.
- `/profiles/:steamId` shows recent public activity and milestones.
- `/games/:steamAppId` shows recent game activity.
- `/u/:slug` shows activity and milestones for the public Steam profile when a
  Steam ID is available.

The frontend uses generated `ActivityApi` and `MilestonesApi` SDK clients. Do
not add raw fetch or Axios wrappers for these endpoints. Badge and showcase
sections use generated `BadgesApi` and `ShowcaseApi` clients.

Activity and milestone cards should use safe public metadata only. The frontend
must not render raw internal payloads, private account fields, session data, or
secrets in feed cards.

## Smoke Coverage

`api:smoke` verifies the activity and milestone read endpoints return HTTP 200,
and the seeded demo profile has at least one milestone after seed/backfill.

`guide:auth-smoke` verifies `guide_published` and `guide_commented` events.

`session:auth-smoke` verifies `session_created`, `session_joined`, and
`session_commented` events.

`web-smoke` verifies the `/activity` route renders.

## Deferred Work

- real-time feed transport;
- notifications and reminders;
- share-card or badge artwork;
- `game_completed` and `rare_achievement_synced` new-unlock detection;
- feed privacy controls beyond `public`/`private`;
- retention or pruning rules.
