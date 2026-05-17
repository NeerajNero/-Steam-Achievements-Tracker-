import { describe, expect, it } from 'vitest';

import {
  normalizeGlobalAchievementPercentages,
  normalizeOwnedGames,
  normalizePlayerAchievements,
  normalizePlayerSummaries,
  normalizeRecentlyPlayedGames,
  normalizeSchemaForGame,
} from '../steam-api.normalizers';

describe('Steam API normalizers', () => {
  it('normalizes player summaries and missing optional fields', () => {
    expect(
      normalizePlayerSummaries({
        response: {
          players: [
            {
              steamid: '76561198000000000',
              personaname: 'Demo',
              avatarfull: '',
              profileurl: 'https://steamcommunity.com/profiles/demo',
              communityvisibilitystate: 3,
            },
          ],
        },
      }),
    ).toEqual([
      {
        steamId: '76561198000000000',
        personaName: 'Demo',
        avatarUrl: null,
        profileUrl: 'https://steamcommunity.com/profiles/demo',
        visibilityState: 3,
      },
    ]);
  });

  it('normalizes owned games and Unix timestamps', () => {
    expect(
      normalizeOwnedGames({
        response: {
          games: [
            {
              appid: 10,
              name: 'Counter-Strike',
              img_icon_url: 'iconhash',
              img_logo_url: 'logohash',
              playtime_forever: 90,
              playtime_2weeks: 5,
              rtime_last_played: 1_700_000_000,
            },
          ],
        },
      }),
    ).toEqual([
      {
        appId: 10,
        gameName: 'Counter-Strike',
        iconUrl:
          'https://media.steampowered.com/steamcommunity/public/images/apps/10/iconhash.jpg',
        logoUrl:
          'https://media.steampowered.com/steamcommunity/public/images/apps/10/logohash.jpg',
        playtimeMinutes: 90,
        playtimeTwoWeeksMinutes: 5,
        lastPlayedAt: new Date(1_700_000_000 * 1000),
      },
    ]);
  });

  it('normalizes recently played games without inventing last played timestamps', () => {
    expect(
      normalizeRecentlyPlayedGames({
        response: {
          games: [
            {
              appid: 550,
              name: 'Left 4 Dead 2',
              img_icon_url: 'recenticon',
              playtime_forever: 1200,
              playtime_2weeks: 35,
            },
          ],
        },
      }),
    ).toEqual([
      {
        appId: 550,
        gameName: 'Left 4 Dead 2',
        iconUrl:
          'https://media.steampowered.com/steamcommunity/public/images/apps/550/recenticon.jpg',
        logoUrl: null,
        playtimeMinutes: 1200,
        playtimeTwoWeeksMinutes: 35,
      },
    ]);
  });

  it('normalizes player achievements and private unavailable responses', () => {
    expect(
      normalizePlayerAchievements(
        {
          playerstats: {
            steamID: '76561198000000000',
            success: true,
            achievements: [
              { apiname: 'WIN_ONE', achieved: 1, unlocktime: 1_600_000_000 },
              { apiname: 'LOCKED_ONE', achieved: 0, unlocktime: 0 },
            ],
          },
        },
        { steamId: 'fallback', appId: 20 },
      ),
    ).toEqual({
      steamId: '76561198000000000',
      appId: 20,
      achievements: [
        {
          apiName: 'WIN_ONE',
          achieved: true,
          unlockedAt: new Date(1_600_000_000 * 1000),
        },
        { apiName: 'LOCKED_ONE', achieved: false, unlockedAt: null },
      ],
      isPrivateOrUnavailable: false,
    });

    expect(
      normalizePlayerAchievements(
        { playerstats: { success: false } },
        { steamId: 'fallback', appId: 20 },
      ),
    ).toEqual({
      steamId: 'fallback',
      appId: 20,
      achievements: [],
      isPrivateOrUnavailable: true,
    });
  });

  it('normalizes game schema and empty achievement arrays', () => {
    expect(normalizeSchemaForGame({ game: { gameName: 'No Achievements' } }, 30))
      .toEqual({
        appId: 30,
        gameName: 'No Achievements',
        achievements: [],
      });

    expect(
      normalizeSchemaForGame(
        {
          game: {
            gameName: 'Schema Game',
            availableGameStats: {
              achievements: [
                {
                  name: 'SECRET',
                  displayName: 'Secret',
                  description: 'Hidden achievement',
                  icon: 'https://example.com/icon.jpg',
                  icongray: 'https://example.com/gray.jpg',
                  hidden: '1',
                },
              ],
            },
          },
        },
        31,
      ),
    ).toEqual({
      appId: 31,
      gameName: 'Schema Game',
      achievements: [
        {
          apiName: 'SECRET',
          displayName: 'Secret',
          description: 'Hidden achievement',
          iconUrl: 'https://example.com/icon.jpg',
          iconGrayUrl: 'https://example.com/gray.jpg',
          hidden: true,
        },
      ],
    });
  });

  it('normalizes global achievement percentages', () => {
    expect(
      normalizeGlobalAchievementPercentages({
        achievementpercentages: {
          achievements: [
            { name: 'COMMON', percent: 87.1 },
            { name: 'RARE', percent: '0.7' },
          ],
        },
      }),
    ).toEqual([
      { apiName: 'COMMON', globalPercentage: 87.1 },
      { apiName: 'RARE', globalPercentage: 0.7 },
    ]);
  });
});
