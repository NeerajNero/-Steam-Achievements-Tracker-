import { DEFAULT_SYNC_QUEUE_NAME } from './queue.constants';

export interface QueueRedisConfig {
  host: string;
  port: number;
  password?: string;
  maxRetriesPerRequest?: null;
}

export function getRedisConnectionConfig(): QueueRedisConfig {
  const password = normalizeOptionalEnv(process.env.REDIS_PASSWORD);

  return {
    host: normalizeOptionalEnv(process.env.REDIS_HOST) ?? 'redis',
    port: parsePort(process.env.REDIS_PORT, 6379),
    ...(password === undefined ? {} : { password }),
  };
}

export function getBullMqConnectionConfig(): QueueRedisConfig {
  return {
    ...getRedisConnectionConfig(),
    maxRetriesPerRequest: null,
  };
}

export function getSyncQueueName(): string {
  return normalizeOptionalEnv(process.env.SYNC_QUEUE_NAME) ?? DEFAULT_SYNC_QUEUE_NAME;
}

function normalizeOptionalEnv(value: string | undefined): string | undefined {
  if (value === undefined || value.trim().length === 0) {
    return undefined;
  }

  return value.trim();
}

function parsePort(value: string | undefined, fallback: number): number {
  const parsed = Number(value);

  if (Number.isInteger(parsed) && parsed > 0 && parsed <= 65_535) {
    return parsed;
  }

  return fallback;
}
