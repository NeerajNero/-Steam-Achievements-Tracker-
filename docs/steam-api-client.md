# Steam API Client

The backend isolates Steam Web API calls behind `SteamApiClient` in
`apps/backend/src/modules/steam`. Controllers must not call Steam directly.

## Supported Methods

| Data needed | Endpoint | Params used | Persistence target | Known limitations |
| --- | --- | --- | --- | --- |
| Steam profile summaries | `ISteamUser/GetPlayerSummaries/v2` | `key`, `steamids` | `steam_profiles` | Profile fields vary by privacy settings. |
| Owned games and lifetime playtime | `IPlayerService/GetOwnedGames/v1` | `key`, `steamid`, `include_appinfo=true`, `include_played_free_games=true` | `games`, `profile_games.playtime_minutes`, `profile_games.playtime_two_weeks_minutes`, `profile_games.last_played_at` | Owned games/game details must be visible to the key. |
| Recently played games | `IPlayerService/GetRecentlyPlayedGames/v1` | `key`, `steamid`, `count` | `profile_games.playtime_two_weeks_minutes`; `playtime_minutes` when returned | Does not expose exact last-played timestamps, so sync does not invent one. |
| Achievement schema metadata | `ISteamUserStats/GetSchemaForGame/v2` | `key`, `appid`, `l=english` by default | `achievements` metadata fields | Some apps have no achievement schema. |
| Player achievement unlock state | `ISteamUserStats/GetPlayerAchievements/v1` | `key`, `steamid`, `appid`, `l=english` by default | `profile_achievements`, then `profile_games` progress refresh | May return 403/unavailable; metadata remains valid and is shown as unknown unlock state. |
| Global achievement rarity | `ISteamUserStats/GetGlobalAchievementPercentagesForApp/v2` | `gameid` with the Steam app ID value | `achievements.global_percentage` | Public endpoint does not require a key on the public host. |

`IPlayerService` is a Steam service interface. Steam documents `input_json`
support for service interfaces, but service methods also accept standard query
parameters. The client uses query parameters so paths and values are explicit in
unit tests.

## Environment

- `STEAM_API_KEY`
  - Required for methods that use keyed Steam Web API endpoints.
  - Never logged or included unredacted in error messages.
  - For local Docker development, set it in `apps/backend/.env`. Docker
    Compose loads that file into the `backend` service.

- `STEAM_API_BASE_URL`
  - Defaults to `https://api.steampowered.com`.
  - Can be changed for partner hosts or test hosts without changing client code.

- `STEAM_API_TIMEOUT_MS`
  - Optional timeout override.
  - Defaults to `10000`.

- `STEAM_API_MAX_RETRIES`
  - Optional retry count override.
  - Defaults to `2`.

- `STEAM_API_CACHE_ENABLED`
  - Enables cache-aside Redis reads for normalized Steam API responses.
  - Defaults to `true`.

Safe local config check:

```sh
docker-compose exec -T backend pnpm steam:config-check
```

The check reports only booleans such as `STEAM_API_KEY configured: true`.
It does not print env values and does not call Steam.

After changing `apps/backend/.env`, recreate the backend container:

```sh
docker-compose up -d --force-recreate backend
```

## Public Host vs Partner Host

Local development can use the public Steam Web API host. The base URL remains
configurable so a partner host can be used later where needed. The client does
not force a partner host.

The local default is `https://api.steampowered.com`. Valve's Web API overview
also documents `https://partner.steam-api.com` for secure server requests; that
host can require a publisher key even for methods that are unkeyed on the
public host. Keep `STEAM_API_BASE_URL` on the public host unless a publisher-key
partner setup has been explicitly tested.

## Error Handling

The client exposes typed errors:

- `SteamApiConfigError`
- `SteamApiRequestError`
- `SteamApiRateLimitError`
- `SteamApiNotFoundOrPrivateError`

Transient HTTP responses are retried:

- `429`
- `500`
- `502`
- `503`
- `504`

Client errors such as `400`, `401`, and `403` are not retried.

## Normalization

Raw Steam payloads are converted to internal result types before future sync
code sees them. The normalizers:

- convert Unix timestamps to `Date` or `null`;
- preserve Steam IDs, app IDs, profile metadata, playtime, achievement metadata,
  unlock state, and rarity percentages;
- handle missing optional fields safely;
- return empty arrays for missing game or achievement collections;
- flag private or unavailable player achievement responses without writing to
  the database.

For achievement sync, player-achievement failures such as HTTP 403 should not
discard already-fetched schema/global metadata. The sync workflow stores
metadata-only results and records a safe unavailable reason.

## Sync Use

Sync orchestration calls `CachedSteamApiClient`, which checks Redis first and
delegates misses to `SteamApiClient`. Current queued sync workflows use the
cached wrapper for:
- profile metadata;
- owned games;
- recently played games;
- achievement schema metadata;
- global achievement rarity percentages;
- profile achievement unlock state.

Read controllers continue to read from PostgreSQL only and do not call Steam
live.

## Cache Rules

The cache stores normalized response objects, not raw URLs or API keys. Errors
are not cached. Redis failures are logged as safe warnings and sync falls back
to `SteamApiClient`.

Default TTLs:
- profile summaries: 10 minutes;
- owned games: 30 minutes;
- recently played games: 10 minutes;
- game schema: 14 days;
- global achievement percentages: 12 hours;
- player achievements: 120 seconds.

## Tests

Unit tests mock the HTTP fetch function and do not call the live Steam API. They
cover URL construction, keyed and unkeyed calls, normalization, retry behavior,
non-retryable responses, and timeout behavior.
