import { getRedisConnectionConfig } from '../queue/queue.config';

export interface RedisCacheConfig {
  enabled: boolean;
  namespace: string;
  redis: {
    host: string;
    port: number;
    password?: string;
  };
}

export function getRedisCacheConfigFromEnv(): RedisCacheConfig {
  return {
    enabled: parseBoolean(process.env.STEAM_API_CACHE_ENABLED, true),
    namespace: normalizeOptionalEnv(process.env.STEAM_API_CACHE_NAMESPACE) ?? 'steam:v1',
    redis: getRedisConnectionConfig(),
  };
}

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value.trim().length === 0) {
    return fallback;
  }

  return value.trim().toLowerCase() !== 'false';
}

function normalizeOptionalEnv(value: string | undefined): string | undefined {
  if (value === undefined || value.trim().length === 0) {
    return undefined;
  }

  return value.trim();
}
