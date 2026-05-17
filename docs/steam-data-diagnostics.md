# Steam Data Diagnostics

Use the safe diagnostics script when real Steam sync appears to fetch only a
partial profile, such as owned-game counts without playtime or achievement
detail.

```sh
docker-compose exec -T backend pnpm steam:data-diagnostics -- <STEAM64_ID> --app-ids=550,203160
```

The script prints safe counts and status codes only. It does not print
`STEAM_API_KEY`, raw Steam URLs, cookies, session tokens, OpenID payloads, or
cache values.

## What It Checks

- normalized owned games count;
- owned games with lifetime playtime;
- owned games with two-week playtime;
- normalized recently played games count from `GetRecentlyPlayedGames`;
- latest stored sync status;
- PostgreSQL row counts for games, profile games, achievements, and profile
  achievements;
- Redis cache key presence only;
- per selected app:
  - schema achievement count;
  - global achievement percentage count;
  - player achievement count or safe unavailable reason;
  - persisted achievement/profile-achievement counts;
  - stored profile game progress.

## Reading The Result

- Owned games count is present but playtime counts are zero:
  Steam may not expose game details for that profile, or the persistence path is
  not updating `profile_games.playtime_minutes`.
- Recently played count is zero:
  the profile may not have recent activity, Steam may not expose recent games,
  or the recent endpoint may be unavailable for that profile.
- Schema/global counts are non-zero but player achievement count is unavailable:
  metadata sync can still persist achievements and frontend should show
  `unknown` unlock state instead of locked.
- Player achievement count is non-zero but profile achievement rows remain zero:
  the issue is in achievement persistence or progress refresh.
- Database counts are correct but frontend is empty:
  inspect SDK regeneration, query hooks, and route rendering rather than Steam
  API access.

## Privacy Limitations

Steam exposes owned games, recent games, and player achievement unlock state
based on the user's privacy settings and the specific game's API behavior. The
platform treats those sources separately:

- owned games and playtime;
- recently played games and two-week playtime;
- achievement schema metadata;
- global rarity percentages;
- player unlock state.

Metadata-only achievement sync is expected for some profiles/apps. In that case
the frontend must display achievement metadata with `unknown` unlock state.

## UI Data States

Profile game and global game responses expose achievement data state fields so
the UI does not treat missing data as a real zero:

- `not_synced`: no canonical achievement metadata is stored yet.
- `metadata_only`: canonical achievement metadata exists, but player unlock
  state is unavailable for that profile/app.
- `unlock_state_synced`: metadata and at least one profile unlock-state row are
  stored.
- `no_achievements`: reserved for confirmed zero-achievement games when the
  backend can derive that state safely.

When `achievementMetadataCount > 0` and `knownUnlockStateCount = 0`, achievement
lists should show names, icons, descriptions, and rarity with “Unknown unlock
state.” They must not show every achievement as locked.
