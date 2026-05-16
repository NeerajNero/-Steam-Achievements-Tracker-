import { Module } from '@nestjs/common';

import { CacheModule } from '../cache/cache.module';
import { CachedSteamApiClient } from './cached-steam-api.client';
import {
  createSteamFetch,
  getSteamApiConfigFromEnv,
  STEAM_API_CONFIG,
  STEAM_API_FETCH,
} from './steam-api.config';
import { SteamApiClient } from './steam-api.client';

@Module({
  imports: [CacheModule],
  providers: [
    {
      provide: STEAM_API_CONFIG,
      useFactory: getSteamApiConfigFromEnv,
    },
    {
      provide: STEAM_API_FETCH,
      useFactory: createSteamFetch,
    },
    SteamApiClient,
    CachedSteamApiClient,
  ],
  exports: [SteamApiClient, CachedSteamApiClient],
})
export class SteamModule {}
