import { Inject, Injectable } from '@nestjs/common';

import {
  STEAM_API_CONFIG,
  STEAM_API_FETCH,
  type SteamApiConfig,
  type SteamFetch,
} from './steam-api.config';
import {
  SteamApiConfigError,
  SteamApiNotFoundOrPrivateError,
  SteamApiRateLimitError,
  SteamApiRequestError,
} from './steam-api.errors';
import {
  normalizeGlobalAchievementPercentages,
  normalizeOwnedGames,
  normalizePlayerAchievements,
  normalizePlayerSummaries,
  normalizeSchemaForGame,
} from './steam-api.normalizers';
import type {
  SteamGameSchema,
  SteamGlobalAchievementPercentage,
  SteamOwnedGame,
  SteamPlayerAchievementResult,
  SteamPlayerSummary,
} from './steam-api.types';

const TRANSIENT_STATUS_CODES = new Set([429, 500, 502, 503, 504]);

@Injectable()
export class SteamApiClient {
  constructor(
    @Inject(STEAM_API_CONFIG) private readonly config: SteamApiConfig,
    @Inject(STEAM_API_FETCH) private readonly fetchFn: SteamFetch,
  ) {}

  async getPlayerSummaries(steamIds: string[]): Promise<SteamPlayerSummary[]> {
    if (steamIds.length === 0) {
      return [];
    }

    const raw = await this.getJson('/ISteamUser/GetPlayerSummaries/v2/', {
      key: this.requireApiKey('getPlayerSummaries'),
      steamids: steamIds.join(','),
    });

    return normalizePlayerSummaries(raw);
  }

  async getOwnedGames(steamId: string): Promise<SteamOwnedGame[]> {
    const raw = await this.getJson('/IPlayerService/GetOwnedGames/v1/', {
      key: this.requireApiKey('getOwnedGames'),
      steamid: steamId,
      include_appinfo: 'true',
      include_played_free_games: 'true',
    });

    return normalizeOwnedGames(raw);
  }

  async getPlayerAchievements(input: {
    steamId: string;
    appId: number;
    language?: string;
  }): Promise<SteamPlayerAchievementResult> {
    const raw = await this.getJson('/ISteamUserStats/GetPlayerAchievements/v1/', {
      key: this.requireApiKey('getPlayerAchievements'),
      steamid: input.steamId,
      appid: String(input.appId),
      l: input.language ?? 'english',
    });

    return normalizePlayerAchievements(raw, {
      steamId: input.steamId,
      appId: input.appId,
    });
  }

  async getSchemaForGame(input: {
    appId: number;
    language?: string;
  }): Promise<SteamGameSchema> {
    const raw = await this.getJson('/ISteamUserStats/GetSchemaForGame/v2/', {
      key: this.requireApiKey('getSchemaForGame'),
      appid: String(input.appId),
      l: input.language ?? 'english',
    });

    return normalizeSchemaForGame(raw, input.appId);
  }

  async getGlobalAchievementPercentages(
    appId: number,
  ): Promise<SteamGlobalAchievementPercentage[]> {
    const raw = await this.getJson(
      '/ISteamUserStats/GetGlobalAchievementPercentagesForApp/v2/',
      { gameid: String(appId) },
    );

    return normalizeGlobalAchievementPercentages(raw);
  }

  private requireApiKey(methodName: string): string {
    if (this.config.apiKey === null) {
      throw new SteamApiConfigError(
        `STEAM_API_KEY is required for Steam API method ${methodName}.`,
      );
    }

    return this.config.apiKey;
  }

  private async getJson(
    path: string,
    query: Record<string, string>,
  ): Promise<unknown> {
    const url = this.buildUrl(path, query);

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt += 1) {
      try {
        const response = await this.fetchWithTimeout(url.toString());

        if (response.ok) {
          return (await response.json()) as unknown;
        }

        if (response.status === 404) {
          throw new SteamApiNotFoundOrPrivateError(
            `Steam API resource was not found or is private: ${redactUrl(url)}`,
            response.status,
          );
        }

        if (response.status === 429 && attempt === this.config.maxRetries) {
          throw new SteamApiRateLimitError(
            `Steam API rate limit response from ${redactUrl(url)}.`,
            response.status,
          );
        }

        if (
          TRANSIENT_STATUS_CODES.has(response.status) &&
          attempt < this.config.maxRetries
        ) {
          continue;
        }

        throw new SteamApiRequestError(
          `Steam API request failed with HTTP ${response.status} for ${redactUrl(url)}.`,
          response.status,
        );
      } catch (error: unknown) {
        if (error instanceof SteamApiRequestError) {
          throw error;
        }

        if (attempt < this.config.maxRetries) {
          continue;
        }

        const message = error instanceof Error ? error.message : 'Unknown error';
        throw new SteamApiRequestError(
          `Steam API request failed for ${redactUrl(url)}: ${message}`,
        );
      }
    }

    throw new SteamApiRequestError(
      `Steam API request failed for ${redactUrl(url)}.`,
    );
  }

  private buildUrl(path: string, query: Record<string, string>): URL {
    const baseUrl = this.config.baseUrl.endsWith('/')
      ? this.config.baseUrl
      : `${this.config.baseUrl}/`;
    const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
    const url = new URL(normalizedPath, baseUrl);

    for (const [key, value] of Object.entries(query)) {
      url.searchParams.set(key, value);
    }

    return url;
  }

  private async fetchWithTimeout(url: string): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      return await Promise.race([
        this.fetchFn(url, { signal: controller.signal }),
        timeoutAfter(this.config.timeoutMs),
      ]);
    } finally {
      clearTimeout(timeout);
    }
  }
}

function timeoutAfter(timeoutMs: number): Promise<Response> {
  return new Promise((_, reject) => {
    setTimeout(
      () => reject(new Error(`request timed out after ${timeoutMs}ms`)),
      timeoutMs,
    );
  });
}

function redactUrl(url: URL): string {
  const redacted = new URL(url.toString());

  if (redacted.searchParams.has('key')) {
    redacted.searchParams.set('key', '[redacted]');
  }

  return redacted.toString();
}
