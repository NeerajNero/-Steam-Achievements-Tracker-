import { getRedisCacheConfigFromEnv } from '../modules/cache/cache.config';
import { getSteamApiConfigFromEnv } from '../modules/steam/steam-api.config';

function main(): void {
  const steamConfig = getSteamApiConfigFromEnv();
  const cacheConfig = getRedisCacheConfigFromEnv();
  const apiKeyConfigured = steamConfig.apiKey !== null;
  const baseUrlConfiguredOrDefaulted = steamConfig.baseUrl.trim().length > 0;

  console.log(`STEAM_API_KEY configured: ${apiKeyConfigured}`);
  console.log(
    `STEAM_API_BASE_URL configured/defaulted: ${baseUrlConfiguredOrDefaulted}`,
  );
  console.log(`STEAM_API_CACHE_ENABLED: ${cacheConfig.enabled}`);

  if (!apiKeyConfigured) {
    process.exitCode = 1;
  }
}

main();
