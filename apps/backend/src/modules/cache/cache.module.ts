import { Module } from '@nestjs/common';

import { getRedisCacheConfigFromEnv } from './cache.config';
import { REDIS_CACHE_CONFIG } from './cache.constants';
import { RedisCacheService } from './redis-cache.service';

@Module({
  providers: [
    {
      provide: REDIS_CACHE_CONFIG,
      useFactory: getRedisCacheConfigFromEnv,
    },
    RedisCacheService,
  ],
  exports: [RedisCacheService],
})
export class CacheModule {}
