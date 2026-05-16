export interface SteamApiCacheTtlConfig {
  profileSeconds: number;
  ownedGamesSeconds: number;
  schemaSeconds: number;
  globalPercentagesSeconds: number;
  playerAchievementsSeconds: number;
}

export function getSteamApiCacheTtlConfigFromEnv(): SteamApiCacheTtlConfig {
  return {
    profileSeconds: parsePositiveInteger(
      process.env.STEAM_API_CACHE_PROFILE_TTL_SECONDS,
      600,
    ),
    ownedGamesSeconds: parsePositiveInteger(
      process.env.STEAM_API_CACHE_OWNED_GAMES_TTL_SECONDS,
      1_800,
    ),
    schemaSeconds: parsePositiveInteger(
      process.env.STEAM_API_CACHE_SCHEMA_TTL_SECONDS,
      1_209_600,
    ),
    globalPercentagesSeconds: parsePositiveInteger(
      process.env.STEAM_API_CACHE_GLOBAL_PERCENTAGES_TTL_SECONDS,
      43_200,
    ),
    playerAchievementsSeconds: parsePositiveInteger(
      process.env.STEAM_API_CACHE_PLAYER_ACHIEVEMENTS_TTL_SECONDS,
      120,
    ),
  };
}

function parsePositiveInteger(
  value: string | undefined,
  fallback: number,
): number {
  const parsed = Number(value);

  if (Number.isInteger(parsed) && parsed > 0) {
    return parsed;
  }

  return fallback;
}
