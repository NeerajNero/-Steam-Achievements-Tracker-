import { describe, expect, it } from 'vitest';

import { SteamApiClient } from '../steam-api.client';
import type { SteamApiConfig, SteamFetch } from '../steam-api.config';
import {
  SteamApiConfigError,
  SteamApiRequestError,
} from '../steam-api.errors';

describe('SteamApiClient', () => {
  it('constructs player summary URLs with an API key', async () => {
    const calls: string[] = [];
    const client = createClient(
      async (url) => {
        calls.push(url);
        return jsonResponse({
          response: { players: [{ steamid: '1', personaname: 'One' }] },
        });
      },
      { apiKey: 'test-key' },
    );

    await expect(client.getPlayerSummaries(['1', '2'])).resolves.toHaveLength(1);

    const url = new URL(calls[0]);
    expect(url.pathname).toBe('/ISteamUser/GetPlayerSummaries/v2/');
    expect(url.searchParams.get('key')).toBe('test-key');
    expect(url.searchParams.get('steamids')).toBe('1,2');
  });

  it('does not require or send an API key for global percentages', async () => {
    const calls: string[] = [];
    const client = createClient(async (url) => {
      calls.push(url);
      return jsonResponse({
        achievementpercentages: {
          achievements: [{ name: 'RARE', percent: 1.2 }],
        },
      });
    });

    await expect(client.getGlobalAchievementPercentages(440)).resolves.toEqual([
      { apiName: 'RARE', globalPercentage: 1.2 },
    ]);

    const url = new URL(calls[0]);
    expect(url.pathname).toBe(
      '/ISteamUserStats/GetGlobalAchievementPercentagesForApp/v2/',
    );
    expect(url.searchParams.get('gameid')).toBe('440');
    expect(url.searchParams.has('key')).toBe(false);
  });

  it('throws a config error when a key-required method has no API key', async () => {
    const client = createClient(async () => jsonResponse({}));

    await expect(client.getOwnedGames('76561198000000000')).rejects.toBeInstanceOf(
      SteamApiConfigError,
    );
  });

  it('normalizes owned games, achievements, and schema responses', async () => {
    const responses = [
      jsonResponse({
        response: {
          games: [
            {
              appid: 10,
              name: 'Game',
              playtime_forever: 120,
              playtime_2weeks: 20,
              rtime_last_played: 1_700_000_000,
            },
          ],
        },
      }),
      jsonResponse({
        playerstats: {
          steamID: '76561198000000000',
          success: true,
          achievements: [{ apiname: 'WIN', achieved: 1, unlocktime: 1 }],
        },
      }),
      jsonResponse({
        game: {
          gameName: 'Game',
          availableGameStats: {
            achievements: [{ name: 'WIN', displayName: 'Win', hidden: 0 }],
          },
        },
      }),
    ];
    const client = createClient(async () => shiftResponse(responses), {
      apiKey: 'test-key',
    });

    await expect(client.getOwnedGames('76561198000000000')).resolves.toEqual([
      {
        appId: 10,
        gameName: 'Game',
        playtimeMinutes: 120,
        playtimeTwoWeeksMinutes: 20,
        lastPlayedAt: new Date(1_700_000_000 * 1000),
      },
    ]);
    await expect(
      client.getPlayerAchievements({
        steamId: '76561198000000000',
        appId: 10,
      }),
    ).resolves.toMatchObject({
      steamId: '76561198000000000',
      appId: 10,
      achievements: [{ apiName: 'WIN', achieved: true }],
    });
    await expect(client.getSchemaForGame({ appId: 10 })).resolves.toMatchObject({
      appId: 10,
      gameName: 'Game',
      achievements: [{ apiName: 'WIN', displayName: 'Win', hidden: false }],
    });
  });

  it('handles private or unavailable achievement responses gracefully', async () => {
    const client = createClient(
      async () => jsonResponse({ playerstats: { success: false } }),
      { apiKey: 'test-key' },
    );

    await expect(
      client.getPlayerAchievements({
        steamId: '76561198000000000',
        appId: 10,
      }),
    ).resolves.toEqual({
      steamId: '76561198000000000',
      appId: 10,
      achievements: [],
      isPrivateOrUnavailable: true,
    });
  });

  it('retries transient 503 responses', async () => {
    const responses = [jsonResponse({}, 503), jsonResponse({ response: { players: [] } })];
    const calls: string[] = [];
    const client = createClient(
      async (url) => {
        calls.push(url);
        return shiftResponse(responses);
      },
      { apiKey: 'test-key', maxRetries: 1 },
    );

    await expect(client.getPlayerSummaries(['1'])).resolves.toEqual([]);
    expect(calls).toHaveLength(2);
  });

  it('does not retry forbidden responses', async () => {
    const calls: string[] = [];
    const client = createClient(
      async (url) => {
        calls.push(url);
        return jsonResponse({ error: 'forbidden' }, 403);
      },
      { apiKey: 'test-key', maxRetries: 2 },
    );

    await expect(client.getPlayerSummaries(['1'])).rejects.toBeInstanceOf(
      SteamApiRequestError,
    );
    expect(calls).toHaveLength(1);
  });

  it('times out requests', async () => {
    const client = createClient(
      () => new Promise<Response>(() => undefined),
      { apiKey: 'test-key', timeoutMs: 5, maxRetries: 0 },
    );

    await expect(client.getPlayerSummaries(['1'])).rejects.toThrow(
      'request timed out',
    );
  });
});

function createClient(
  fetchFn: SteamFetch,
  overrides: Partial<SteamApiConfig> = {},
): SteamApiClient {
  return new SteamApiClient(
    {
      apiKey: null,
      baseUrl: 'https://api.steampowered.com',
      timeoutMs: 1_000,
      maxRetries: 0,
      ...overrides,
    },
    fetchFn,
  );
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function shiftResponse(responses: Response[]): Response {
  const response = responses.shift();

  if (response === undefined) {
    throw new Error('No mocked response available.');
  }

  return response;
}
