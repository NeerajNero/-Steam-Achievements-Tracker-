# Targets And Planner

Targets are the private achievement to-do list foundation for signed-in Steam
users. V1 supports saved games and achievements only; it does not add AI,
notifications, calendar automation, or public target visibility.

## Data Model

Migration `0008-add-targets-foundation.sql` adds:

- `game_targets`: one target per `user_id` and Steam game.
- `achievement_targets`: one target per `user_id` and canonical achievement.

Both tables:
- use `ON DELETE RESTRICT`;
- store `steam_profile_id` from the signed-in user's linked primary Steam
  profile;
- use status values `active`, `paused`, `completed`, `ignored`, `archived`;
- use priority values `low`, `medium`, `high`;
- soft-delete through `status = archived`.

Game targets can optionally store a target completion percentage and due date.
Achievement targets can exist when player unlock state is locked or unknown.
Already unlocked achievements cannot be created or reactivated as active
targets.

## API

Targets are account-private and require an authenticated session.

- `GET /account/targets`
- `POST /account/targets/games`
- `PATCH /account/targets/games/:targetId`
- `DELETE /account/targets/games/:targetId`
- `POST /account/targets/achievements`
- `PATCH /account/targets/achievements/:targetId`
- `DELETE /account/targets/achievements/:targetId`

The create endpoints upsert/reactivate existing targets. Game target creation
requires the Steam game to already exist in `games`; achievement target creation
requires the canonical achievement UUID to exist.

Before creating an achievement target, the backend checks the signed-in user's
linked Steam profile unlock row. If `profile_achievements.achieved = true`, the
request is rejected with:

```txt
Achievement is already unlocked and cannot be added as an active target.
```

Missing profile achievement rows are treated as unknown unlock state and remain
targetable. Rows with `achieved = false` are also targetable.

## Dashboard Integration

`GET /dashboard/me` includes:

```json
{
  "activeTargets": {
    "games": [],
    "achievements": []
  }
}
```

Active targets are ordered by:

1. high priority first;
2. due date soon first;
3. recently created first.

These saved targets are separate from deterministic `nextTargets`, which remain
rule-based suggestions derived from synced Steam progress.

## Auto-Completion After Sync

Target completion is DB-backed and deterministic.

- After achievement sync persists `profile_achievements` for a game, active
  `achievement_targets` for the same `steam_profile_id` and Steam app are marked
  `completed` only when a matching persisted row has `achieved = true`.
- Missing `profile_achievements` rows and rows with `achieved = false` do not
  complete achievement targets. Unknown unlock state stays targetable and stays
  active.
- Only `status = active` targets auto-complete. Paused, ignored, archived, and
  already-completed rows are left unchanged.
- After `refresh_profile_game_achievement_progress(profile_id, steam_app_id)`
  runs, active `game_targets` auto-complete when stored
  `profile_games.completion_percentage` meets or exceeds the target threshold.
- `game_targets.target_completion_percentage = null` defaults to `100`.
- Games with `total_achievements = 0` do not auto-complete unless the target
  explicitly stores `target_completion_percentage = 0`.

## Frontend

The frontend consumes `TargetsApi` from `@steam-achievement/client-sdk`.

Routes and integrations:

- `/account/targets` shows active private targets.
- `/account/targets?status=completed` shows completed private targets.
- `/dashboard` surfaces active targets in the Hunter Command Center.
- Global and profile game pages include Add Target actions.
- Achievement lists include Add Target actions when the API returns an
  achievement UUID.

Unknown unlock state achievements can still be targeted. The UI must not treat
`unknown` as locked.

Profile achievement rows disable the Add Target action when
`unlockState = unlocked` and show an already-unlocked label instead. Global
achievement rows do not know the signed-in user's unlock state, so they still
show Add Target and render a friendly conflict message if the backend rejects
the request.

Notifications, activity-feed entries for target completion, calendar automation,
and AI suggestions remain deferred.

## Smoke

`pnpm targets:auth-smoke` exercises the deterministic demo account path:

1. create a game target;
2. create an achievement target;
3. list targets;
4. update target priority/status;
5. archive one target;
6. verify `/dashboard/me` contains the active target.

The smoke prints safe counts/statuses only and must not print tokens, cookies,
session hashes, Steam API keys, or keyed Steam URLs.
