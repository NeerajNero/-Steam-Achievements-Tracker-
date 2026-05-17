import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { RedisCacheService } from '../../cache/redis-cache.service';
import { CachedSteamApiClient } from '../cached-steam-api.client';
import type { SteamApiClient } from '../steam-api.client';

describe('CachedSteamApiClient', () => {
  let steamApiClient: {
    getPlayerSummaries: ReturnType<typeof vi.fn>;
    getOwnedGames: ReturnType<typeof vi.fn>;
    getRecentlyPlayedGames: ReturnType<typeof vi.fn>;
    getPlayerAchievements: ReturnType<typeof vi.fn>;
    getSchemaForGame: ReturnType<typeof vi.fn>;
    getGlobalAchievementPercentages: ReturnType<typeof vi.fn>;
  };
  let cacheService: {
    enabled: boolean;
    namespace: string;
    getJson: ReturnType<typeof vi.fn>;
    setJson: ReturnType<typeof vi.fn>;
  };
  let client: CachedSteamApiClient;

  beforeEach(() => {
    process.env.STEAM_API_CACHE_PLAYER_ACHIEVEMENTS_TTL_SECONDS = '120';
    process.env.STEAM_API_CACHE_SCHEMA_TTL_SECONDS = '1209600';
    process.env.STEAM_API_CACHE_GLOBAL_PERCENTAGES_TTL_SECONDS = '43200';
    steamApiClient = {
      getPlayerSummaries: vi.fn(async () => [createProfile()]),
      getOwnedGames: vi.fn(async () => [createOwnedGame()]),
      getRecentlyPlayedGames: vi.fn(async () => [createRecentlyPlayedGame()]),
      getPlayerAchievements: vi.fn(async () => createPlayerAchievements()),
      getSchemaForGame: vi.fn(async () => createSchema()),
      getGlobalAchievementPercentages: vi.fn(async () => [
        { apiName: 'ACH_WIN', globalPercentage: 12.5 },
      ]),
    };
    cacheService = {
      enabled: true,
      namespace: 'steam:v1',
      getJson: vi.fn(async () => null),
      setJson: vi.fn(),
    };
    client = new CachedSteamApiClient(
      steamApiClient as unknown as SteamApiClient,
      cacheService as unknown as RedisCacheService,
    );
  });

  it('cache miss calls SteamApiClient and stores normalized result with TTL', async () => {
    await expect(client.getOwnedGames('76561198000000000')).resolves.toEqual([
      createOwnedGame(),
    ]);

    expect(cacheService.getJson).toHaveBeenCalledWith(
      'steam:v1:owned-games:76561198000000000',
      expect.any(Function),
    );
    expect(steamApiClient.getOwnedGames).toHaveBeenCalledWith(
      '76561198000000000',
    );
    expect(cacheService.setJson).toHaveBeenCalledWith(
      'steam:v1:owned-games:76561198000000000',
      [createOwnedGame()],
      1_800,
    );
  });

  it('cache hit returns cached result without calling SteamApiClient', async () => {
    cacheService.getJson.mockResolvedValue([createOwnedGame()]);

    await expect(client.getOwnedGames('76561198000000000')).resolves.toEqual([
      createOwnedGame(),
    ]);

    expect(steamApiClient.getOwnedGames).not.toHaveBeenCalled();
    expect(cacheService.setJson).not.toHaveBeenCalled();
  });

  it('does not cache Steam API errors', async () => {
    const error = new Error('upstream failed');
    steamApiClient.getOwnedGames.mockRejectedValue(error);

    await expect(client.getOwnedGames('76561198000000000')).rejects.toBe(error);
    expect(cacheService.setJson).not.toHaveBeenCalled();
  });

  it('falls back to SteamApiClient when cache read or write fails', async () => {
    cacheService.getJson.mockRejectedValue(new Error('redis read failed'));
    cacheService.setJson.mockRejectedValue(new Error('redis write failed'));

    await expect(client.getPlayerSummaries(['76561198000000000'])).resolves.toEqual([
      createProfile(),
    ]);

    expect(steamApiClient.getPlayerSummaries).toHaveBeenCalledWith([
      '76561198000000000',
    ]);
  });

  it('cache disabled bypasses Redis', async () => {
    cacheService.enabled = false;

    await client.getOwnedGames('76561198000000000');

    expect(cacheService.getJson).not.toHaveBeenCalled();
    expect(cacheService.setJson).not.toHaveBeenCalled();
    expect(steamApiClient.getOwnedGames).toHaveBeenCalledWith(
      '76561198000000000',
    );
  });

  it('uses short player-achievement TTL and longer schema/global TTLs', async () => {
    await client.getPlayerAchievements({
      steamId: '76561198000000000',
      appId: 910001,
    });
    await client.getSchemaForGame({ appId: 910001 });
    await client.getGlobalAchievementPercentages(910001);

    expect(cacheService.setJson).toHaveBeenCalledWith(
      'steam:v1:player-achievements:76561198000000000:910001:english',
      createPlayerAchievements(),
      120,
    );
    expect(cacheService.setJson).toHaveBeenCalledWith(
      'steam:v1:schema:910001:english',
      createSchema(),
      1_209_600,
    );
    expect(cacheService.setJson).toHaveBeenCalledWith(
      'steam:v1:global-achievements:910001',
      [{ apiName: 'ACH_WIN', globalPercentage: 12.5 }],
      43_200,
    );
    expect(client.playerAchievementTtlSeconds).toBeLessThan(
      client.globalPercentagesTtlSeconds,
    );
    expect(client.globalPercentagesTtlSeconds).toBeLessThan(
      client.schemaTtlSeconds,
    );
  });

  it('caches recently played games with the recent-games TTL', async () => {
    process.env.STEAM_API_CACHE_RECENT_GAMES_TTL_SECONDS = '300';
    client = new CachedSteamApiClient(
      steamApiClient as unknown as SteamApiClient,
      cacheService as unknown as RedisCacheService,
    );

    await expect(
      client.getRecentlyPlayedGames({
        steamId: '76561198000000000',
        count: 5,
      }),
    ).resolves.toEqual([createRecentlyPlayedGame()]);

    expect(cacheService.getJson).toHaveBeenCalledWith(
      'steam:v1:recent-games:76561198000000000:5',
      expect.any(Function),
    );
    expect(steamApiClient.getRecentlyPlayedGames).toHaveBeenCalledWith({
      steamId: '76561198000000000',
      count: 5,
    });
    expect(cacheService.setJson).toHaveBeenCalledWith(
      'steam:v1:recent-games:76561198000000000:5',
      [createRecentlyPlayedGame()],
      300,
    );
  });
});

function createProfile() {
  return {
    steamId: '76561198000000000',
    personaName: 'Player',
    avatarUrl: null,
    profileUrl: null,
    visibilityState: 3,
  };
}

function createOwnedGame() {
  return {
    appId: 910001,
    gameName: 'Cached Game',
    iconUrl: null,
    logoUrl: null,
    playtimeMinutes: 120,
    playtimeTwoWeeksMinutes: 0,
    lastPlayedAt: new Date('2026-01-01T00:00:00.000Z'),
  };
}

function createRecentlyPlayedGame() {
  return {
    appId: 910001,
    gameName: 'Cached Game',
    iconUrl: null,
    logoUrl: null,
    playtimeMinutes: 120,
    playtimeTwoWeeksMinutes: 45,
  };
}

function createSchema() {
  return {
    appId: 910001,
    gameName: 'Cached Game',
    achievements: [
      {
        apiName: 'ACH_WIN',
        displayName: 'Win',
        description: 'Win once',
        iconUrl: null,
        iconGrayUrl: null,
        hidden: false,
      },
    ],
  };
}

function createPlayerAchievements() {
  return {
    steamId: '76561198000000000',
    appId: 910001,
    achievements: [
      {
        apiName: 'ACH_WIN',
        achieved: true,
        unlockedAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    ],
    isPrivateOrUnavailable: false,
  };
}
