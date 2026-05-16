# Steam API Client

The backend isolates Steam Web API calls behind `SteamApiClient` in
`apps/backend/src/modules/steam`. Controllers must not call Steam directly.

## Supported Methods

- `ISteamUser/GetPlayerSummaries/v2`
  - Client method: `getPlayerSummaries(steamIds)`
  - Fetches Steam profile metadata for one or more Steam IDs.

- `IPlayerService/GetOwnedGames/v1`
  - Client method: `getOwnedGames(steamId)`
  - Fetches owned games with `include_appinfo=true` and
    `include_played_free_games=true`.

- `ISteamUserStats/GetPlayerAchievements/v1`
  - Client method: `getPlayerAchievements({ steamId, appId, language })`
  - Fetches profile achievement unlock state for one game. Sync treats this as
    separate from schema/global metadata because Steam may deny player state
    while still returning canonical metadata.

- `ISteamUserStats/GetSchemaForGame/v2`
  - Client method: `getSchemaForGame({ appId, language })`
  - Fetches game achievement metadata.

- `ISteamUserStats/GetGlobalAchievementPercentagesForApp/v2`
  - Client method: `getGlobalAchievementPercentages(appId)`
  - Fetches global achievement rarity percentages. The client sends the app ID
    as `gameid`, which is the parameter name used by this endpoint shape.

## Environment

- `STEAM_API_KEY`
  - Required for methods that use keyed Steam Web API endpoints.
  - Never logged or included unredacted in error messages.

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

## Public Host vs Partner Host

Local development can use the public Steam Web API host. The base URL remains
configurable so a partner host can be used later where needed. The client does
not force a partner host.

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
- game schema: 14 days;
- global achievement percentages: 12 hours;
- player achievements: 120 seconds.

## Tests

Unit tests mock the HTTP fetch function and do not call the live Steam API. They
cover URL construction, keyed and unkeyed calls, normalization, retry behavior,
non-retryable responses, and timeout behavior.
