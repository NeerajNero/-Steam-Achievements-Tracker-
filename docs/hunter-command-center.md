# Hunter Command Center

The Hunter Command Center is the signed-in dashboard at `/dashboard`. It is
Steam-only and answers what a hunter should do next using stored profile data,
not live Steam requests.

## Data Source

The frontend calls `DashboardApi.getMyDashboard`, backed by:

```txt
GET /dashboard/me
```

The backend endpoint requires an auth session, resolves the signed-in user's
linked primary Steam profile, and performs DB-only reads across profile summary,
sync runs, activity, milestones, badges, guides, sessions, and data-quality
state. It does not call Steam Web API.

If the user has no linked Steam profile, the endpoint returns `status:
link_required` with empty dashboard sections.

The response also includes `activeTargets.games` and
`activeTargets.achievements`, which are the signed-in user's saved private
completion targets from `game_targets` and `achievement_targets`.
Only `status = active` rows are returned here, so completed targets disappear
from the dashboard after sync confirms completion.

## Deterministic Target Rules

`nextTargets` are ordered deterministically:

1. closest completion games;
2. recently played incomplete games;
3. high-playtime unfinished games;
4. games with achievement metadata but unknown unlock state;
5. games with achievement metadata not yet synced;
6. games with guides available;
7. upcoming sessions for owned games.

Each target includes a short reason, for example `Only 3 achievements remaining`
or `Recently played and incomplete`. There are no AI recommendations yet.

Saved active targets are not AI recommendations. They are explicit user choices
and are ordered high priority first, due date soon first, then recently created
first.
Completed targets remain available through the account targets list by filtering
for `status = completed`; they are intentionally excluded from the dashboard's
active target section.

## Data Quality States

- `metadata_only`: achievement metadata is available, but Steam did not provide
  player unlock state.
- `not_synced`: achievement metadata has not been synced for the game yet.
- `unlock_state_synced`: player achievement rows exist and can drive
  unlocked/locked progress.
- `no_achievements`: Steam data indicates the game has no achievements.

The UI must not display `unknown` as locked. Metadata-only games are surfaced as
sync attention because Steam can expose achievement definitions without player
unlock state.

## Sync Actions

Dashboard sync buttons enqueue existing backend sync jobs through the generated
SDK. The frontend never calls Steam directly.

Supported actions:

- Sync Profile
- Sync Games
- Sync Achievements

After enqueueing a sync, the page refreshes the dashboard query so new sync runs
and updated progress can appear. This includes active targets dropping out when
sync auto-completes a saved game or achievement target.

## Smoke Coverage

Automated smoke coverage verifies:

- `/dashboard` renders in the web smoke for guests;
- `GET /dashboard/me` returns `401` without an auth session in `api:smoke`.

Signed-in dashboard verification still requires a browser session created by
Steam login. Manual smoke should sign in, open `/dashboard`, and verify the
linked profile summary, next targets, recent progress, sync actions, guides,
sessions, and sync attention sections.
