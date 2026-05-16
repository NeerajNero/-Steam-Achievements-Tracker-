import { Injectable } from '@nestjs/common';

import { RedisCacheService } from '../cache/redis-cache.service';
import { SteamApiClient } from './steam-api.client';
import {
  getSteamApiCacheTtlConfigFromEnv,
  type SteamApiCacheTtlConfig,
} from './steam-api-cache.config';
import type {
  SteamGameSchema,
  SteamGameSchemaAchievement,
  SteamGlobalAchievementPercentage,
  SteamOwnedGame,
  SteamPlayerAchievement,
  SteamPlayerAchievementResult,
  SteamPlayerSummary,
} from './steam-api.types';

@Injectable()
export class CachedSteamApiClient {
  private readonly ttl: SteamApiCacheTtlConfig;

  constructor(
    private readonly steamApiClient: SteamApiClient,
    private readonly cacheService: RedisCacheService,
  ) {
    this.ttl = getSteamApiCacheTtlConfigFromEnv();
  }

  get playerAchievementTtlSeconds(): number {
    return this.ttl.playerAchievementsSeconds;
  }

  get schemaTtlSeconds(): number {
    return this.ttl.schemaSeconds;
  }

  get globalPercentagesTtlSeconds(): number {
    return this.ttl.globalPercentagesSeconds;
  }

  async getPlayerSummaries(steamIds: string[]): Promise<SteamPlayerSummary[]> {
    if (steamIds.length !== 1) {
      return this.steamApiClient.getPlayerSummaries(steamIds);
    }

    const steamId = steamIds[0];

    return this.getOrSet(
      this.cacheKey(`profile:${steamId}`),
      this.ttl.profileSeconds,
      decodePlayerSummaries,
      () => this.steamApiClient.getPlayerSummaries(steamIds),
    );
  }

  async getOwnedGames(steamId: string): Promise<SteamOwnedGame[]> {
    return this.getOrSet(
      this.cacheKey(`owned-games:${steamId}`),
      this.ttl.ownedGamesSeconds,
      decodeOwnedGames,
      () => this.steamApiClient.getOwnedGames(steamId),
    );
  }

  async getPlayerAchievements(input: {
    steamId: string;
    appId: number;
    language?: string;
  }): Promise<SteamPlayerAchievementResult> {
    const language = input.language ?? 'english';

    return this.getOrSet(
      this.cacheKey(
        `player-achievements:${input.steamId}:${input.appId}:${language}`,
      ),
      this.ttl.playerAchievementsSeconds,
      decodePlayerAchievementResult,
      () => this.steamApiClient.getPlayerAchievements({ ...input, language }),
    );
  }

  async getSchemaForGame(input: {
    appId: number;
    language?: string;
  }): Promise<SteamGameSchema> {
    const language = input.language ?? 'english';

    return this.getOrSet(
      this.cacheKey(`schema:${input.appId}:${language}`),
      this.ttl.schemaSeconds,
      decodeGameSchema,
      () => this.steamApiClient.getSchemaForGame({ ...input, language }),
    );
  }

  async getGlobalAchievementPercentages(
    appId: number,
  ): Promise<SteamGlobalAchievementPercentage[]> {
    return this.getOrSet(
      this.cacheKey(`global-achievements:${appId}`),
      this.ttl.globalPercentagesSeconds,
      decodeGlobalAchievementPercentages,
      () => this.steamApiClient.getGlobalAchievementPercentages(appId),
    );
  }

  private async getOrSet<T>(
    key: string,
    ttlSeconds: number,
    decoder: (value: unknown) => T | null,
    fetcher: () => Promise<T>,
  ): Promise<T> {
    if (!this.cacheService.enabled) {
      return fetcher();
    }

    const cached = await this.readCache(key, decoder);

    if (cached !== null) {
      return cached;
    }

    const fresh = await fetcher();
    await this.writeCache(key, fresh, ttlSeconds);
    return fresh;
  }

  private async readCache<T>(
    key: string,
    decoder: (value: unknown) => T | null,
  ): Promise<T | null> {
    try {
      return await this.cacheService.getJson(key, decoder);
    } catch {
      return null;
    }
  }

  private async writeCache(
    key: string,
    value: unknown,
    ttlSeconds: number,
  ): Promise<void> {
    try {
      await this.cacheService.setJson(key, value, ttlSeconds);
    } catch {
      // Cache writes must never fail sync work.
    }
  }

  private cacheKey(suffix: string): string {
    return `${this.cacheService.namespace}:${suffix}`;
  }
}

function decodePlayerSummaries(value: unknown): SteamPlayerSummary[] | null {
  const summaries = asArray(value)
    .map((item): SteamPlayerSummary | null => {
      if (!isRecord(item)) {
        return null;
      }

      const steamId = stringOrNull(item.steamId);

      if (steamId === null) {
        return null;
      }

      return {
        steamId,
        personaName: stringOrNull(item.personaName),
        avatarUrl: stringOrNull(item.avatarUrl),
        profileUrl: stringOrNull(item.profileUrl),
        visibilityState: numberOrNull(item.visibilityState),
      };
    })
    .filter(isPresent);

  return summaries;
}

function decodeOwnedGames(value: unknown): SteamOwnedGame[] | null {
  return asArray(value)
    .map((item): SteamOwnedGame | null => {
      if (!isRecord(item)) {
        return null;
      }

      const appId = numberOrNull(item.appId);
      const gameName = stringOrNull(item.gameName);
      const playtimeMinutes = numberOrNull(item.playtimeMinutes);
      const playtimeTwoWeeksMinutes = numberOrNull(item.playtimeTwoWeeksMinutes);

      if (
        appId === null ||
        gameName === null ||
        playtimeMinutes === null ||
        playtimeTwoWeeksMinutes === null
      ) {
        return null;
      }

      return {
        appId,
        gameName,
        playtimeMinutes,
        playtimeTwoWeeksMinutes,
        lastPlayedAt: dateOrNull(item.lastPlayedAt),
      };
    })
    .filter(isPresent);
}

function decodePlayerAchievementResult(
  value: unknown,
): SteamPlayerAchievementResult | null {
  if (!isRecord(value)) {
    return null;
  }

  const steamId = stringOrNull(value.steamId);
  const appId = numberOrNull(value.appId);

  if (steamId === null || appId === null) {
    return null;
  }

  return {
    steamId,
    appId,
    achievements: decodePlayerAchievements(value.achievements),
    isPrivateOrUnavailable: booleanOrFalse(value.isPrivateOrUnavailable),
  };
}

function decodeGameSchema(value: unknown): SteamGameSchema | null {
  if (!isRecord(value)) {
    return null;
  }

  const appId = numberOrNull(value.appId);

  if (appId === null) {
    return null;
  }

  return {
    appId,
    gameName: stringOrNull(value.gameName),
    achievements: decodeSchemaAchievements(value.achievements),
  };
}

function decodeGlobalAchievementPercentages(
  value: unknown,
): SteamGlobalAchievementPercentage[] | null {
  return asArray(value)
    .map((item): SteamGlobalAchievementPercentage | null => {
      if (!isRecord(item)) {
        return null;
      }

      const apiName = stringOrNull(item.apiName);
      const globalPercentage = numberOrNull(item.globalPercentage);

      return apiName === null || globalPercentage === null
        ? null
        : { apiName, globalPercentage };
    })
    .filter(isPresent);
}

function decodePlayerAchievements(value: unknown): SteamPlayerAchievement[] {
  return asArray(value)
    .map((item): SteamPlayerAchievement | null => {
      if (!isRecord(item)) {
        return null;
      }

      const apiName = stringOrNull(item.apiName);

      if (apiName === null) {
        return null;
      }

      return {
        apiName,
        achieved: booleanOrFalse(item.achieved),
        unlockedAt: dateOrNull(item.unlockedAt),
      };
    })
    .filter(isPresent);
}

function decodeSchemaAchievements(value: unknown): SteamGameSchemaAchievement[] {
  return asArray(value)
    .map((item): SteamGameSchemaAchievement | null => {
      if (!isRecord(item)) {
        return null;
      }

      const apiName = stringOrNull(item.apiName);

      if (apiName === null) {
        return null;
      }

      return {
        apiName,
        displayName: stringOrNull(item.displayName),
        description: stringOrNull(item.description),
        iconUrl: stringOrNull(item.iconUrl),
        iconGrayUrl: stringOrNull(item.iconGrayUrl),
        hidden: booleanOrFalse(item.hidden),
      };
    })
    .filter(isPresent);
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function stringOrNull(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function numberOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function booleanOrFalse(value: unknown): boolean {
  return typeof value === 'boolean' ? value : false;
}

function dateOrNull(value: unknown): Date | null {
  if (value === null) {
    return null;
  }

  if (typeof value !== 'string') {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isPresent<T>(value: T | null): value is T {
  return value !== null;
}
