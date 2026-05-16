import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

import type { RedisCacheConfig } from './cache.config';
import { REDIS_CACHE_CONFIG } from './cache.constants';

type CacheDecoder<T> = (value: unknown) => T | null;

@Injectable()
export class RedisCacheService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisCacheService.name);
  private readonly redis: Redis | null;
  private hasWarned = false;

  constructor(
    @Inject(REDIS_CACHE_CONFIG) private readonly config: RedisCacheConfig,
  ) {
    this.redis = config.enabled
      ? new Redis({
          host: config.redis.host,
          port: config.redis.port,
          ...(config.redis.password === undefined
            ? {}
            : { password: config.redis.password }),
          commandTimeout: 1_000,
          enableOfflineQueue: false,
          lazyConnect: true,
          maxRetriesPerRequest: 1,
        })
      : null;
  }

  get enabled(): boolean {
    return this.config.enabled;
  }

  get namespace(): string {
    return this.config.namespace;
  }

  async getJson<T>(
    key: string,
    decoder: CacheDecoder<T>,
  ): Promise<T | null> {
    if (this.redis === null) {
      return null;
    }

    try {
      await this.connectIfNeeded();
      const cached = await this.redis.get(key);

      if (cached === null) {
        return null;
      }

      return decoder(JSON.parse(cached) as unknown);
    } catch (error: unknown) {
      this.warnOnce('Redis cache read failed; falling back to live Steam API.', error);
      return null;
    }
  }

  async setJson(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    if (this.redis === null) {
      return;
    }

    try {
      await this.connectIfNeeded();
      await this.redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch (error: unknown) {
      this.warnOnce('Redis cache write failed; continuing without cache.', error);
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.redis !== null) {
      this.redis.disconnect();
    }
  }

  private async connectIfNeeded(): Promise<void> {
    if (this.redis === null || this.redis.status === 'ready') {
      return;
    }

    if (this.redis.status === 'wait') {
      await this.redis.connect();
    }
  }

  private warnOnce(message: string, error: unknown): void {
    if (this.hasWarned) {
      return;
    }

    this.hasWarned = true;
    const detail = error instanceof Error ? error.message : 'Unknown Redis error';
    this.logger.warn(`${message} ${detail}`);
  }
}
