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

## Proving Player Unlock-State Support

Use a Steam64 ID for a profile that is intentionally public and whose game
details are public. Do not add personal Steam IDs to source, seed data, tests, or
docs. Pass the Steam64 ID only as a local command argument.

1. Sync the profile and owned games so app selection is based on stored owned
   games, not guesses:

   ```sh
   docker-compose exec -T backend pnpm real-sync:smoke -- <STEAM64_ID>
   ```

2. Choose one to three owned app IDs that have achievement metadata. Prefer
   games returned by the owned-games sync and avoid app IDs that are not stored
   for the profile.

3. Sync selected achievements, then run diagnostics:

   ```sh
   docker-compose exec -T backend pnpm real-sync:smoke -- <STEAM64_ID> --app-ids=<APP1>,<APP2>
   docker-compose exec -T backend pnpm steam:data-diagnostics -- <STEAM64_ID> --app-ids=<APP1>,<APP2>
   ```

Player unlock-state is proven for that profile/app combination when each tested
app reports non-zero schema metadata, global percentages, player achievements,
and persisted profile achievements:

```txt
app.<APP_ID>.schemaCount: 39
app.<APP_ID>.schemaStatus: ok
app.<APP_ID>.globalPercentageCount: 39
app.<APP_ID>.globalPercentageStatus: ok
app.<APP_ID>.playerAchievementCount: 39
app.<APP_ID>.playerAchievementStatus: ok
app.<APP_ID>.dbAchievementsCount: 39
app.<APP_ID>.dbProfileAchievementsCount: 39
app.<APP_ID>.dbProfileGameProgress: total=39 unlocked=4 completion=10.26
```

If `playerAchievementCount` is non-zero but `dbProfileAchievementsCount` stays
zero after achievement sync, investigate mapping or persistence. If
`playerAchievementStatus` is `steam_not_found_or_private`,
`player_unlock_state_unavailable`, `steam_request_failed`, or
`steam_rate_limited`, treat the app as not proven and inspect the safe status
before changing code. HTTP 403/private/unavailable responses are Steam API
availability limits for that profile/app unless another owned public profile
shows the same endpoint succeeds but persistence fails.

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

## Endpoint Matrix

| Data needed | Steam endpoint | Params verified by diagnostics/tests | DB target |
| --- | --- | --- | --- |
| Profile metadata | `ISteamUser/GetPlayerSummaries/v2` | `key`, `steamids` | `steam_profiles` |
| Owned games | `IPlayerService/GetOwnedGames/v1` | `key`, `steamid`, `include_appinfo`, `include_played_free_games` | `games`, `profile_games` |
| Recent games | `IPlayerService/GetRecentlyPlayedGames/v1` | `key`, `steamid`, `count` | `profile_games.playtime_two_weeks_minutes` |
| Achievement metadata | `ISteamUserStats/GetSchemaForGame/v2` | `key`, `appid`, `l` | `achievements` |
| Player unlock state | `ISteamUserStats/GetPlayerAchievements/v1` | `key`, `steamid`, `appid`, `l` | `profile_achievements` |
| Global rarity | `ISteamUserStats/GetGlobalAchievementPercentagesForApp/v2` | `gameid`; no key on public host | `achievements.global_percentage` |

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
- Player achievement count and profile achievement rows are both non-zero:
  unlock state was fetched and persisted. The game should report
  `unlock_state_synced`.
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

When `achievementDataState` is `metadata_only`, progress numbers are not known
for that profile/app even though metadata exists. The UI should show unknown
progress and unknown unlock-state badges. When it is `unlock_state_synced`,
`unlockedAchievements`, `remainingAchievements`, `completionPercentage`, and
achievement `unlockState` values can be displayed as real player progress.
