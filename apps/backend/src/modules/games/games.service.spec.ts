import { NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import type { AchievementsDataService } from '../../db/services/achievements-data.service';
import type { GamesDataService } from '../../db/services/games-data.service';
import type { ProfileGamesDataService } from '../../db/services/profile-games-data.service';
import type { ProfilesService } from '../profiles/profiles.service';
import { SortOrderDto } from './dto/game-library-query.dto';
import {
  GlobalGameAchievementHiddenDto,
  GlobalGameAchievementSortDto,
} from './dto/global-game-achievements-query.dto';
import {
  GlobalGamePlayerSortDto,
  GlobalGamePlayerStatusDto,
} from './dto/global-game-players-query.dto';
import { GlobalGameSortDto } from './dto/global-game-query.dto';
import { GamesService } from './games.service';

describe('GamesService global game endpoints', () => {
  it('lists global games with aggregate stats', async () => {
    const service = createService();

    await expect(
      service.getGlobalGames({
        sort: GlobalGameSortDto.TrackedPlayers,
        order: SortOrderDto.Desc,
        limit: 25,
        offset: 0,
      }),
    ).resolves.toMatchObject({
      total: 1,
      items: [
        {
          steamAppId: 910001,
          trackedPlayers: 2,
          totalAchievements: 8,
          averageCompletionPercentage: 75.5,
          completedPlayers: 1,
        },
      ],
    });
  });

  it('returns global game detail stats', async () => {
    const service = createService();

    await expect(service.getGlobalGame(910001)).resolves.toMatchObject({
      game: {
        steamAppId: 910001,
        name: 'Demo First Steps',
      },
      stats: {
        trackedPlayers: 2,
        completedPlayers: 1,
        totalAchievements: 8,
        averageCompletionPercentage: 75.5,
      },
    });
  });

  it('returns 404 for missing global games', async () => {
    const service = createService({ gameRow: null });

    await expect(service.getGlobalGame(999999)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('lists global achievement metadata', async () => {
    const service = createService();

    await expect(
      service.getGlobalGameAchievements(910001, {
        hidden: GlobalGameAchievementHiddenDto.Visible,
        sort: GlobalGameAchievementSortDto.Rarity,
        order: SortOrderDto.Asc,
        limit: 100,
        offset: 0,
      }),
    ).resolves.toMatchObject({
      total: 1,
      items: [
        {
          apiName: 'ACH_ONE',
          displayName: 'First Step',
          hidden: false,
          globalPercentage: 12.345,
        },
      ],
    });
  });

  it('lists tracked players without exposing account or session fields', async () => {
    const service = createService();
    const result = await service.getGlobalGamePlayers(910001, {
      status: GlobalGamePlayerStatusDto.Completed,
      sort: GlobalGamePlayerSortDto.Completion,
      order: SortOrderDto.Desc,
      limit: 25,
      offset: 0,
    });

    expect(result.total).toBe(1);
    expect(result.items[0]).toMatchObject({
      steamId: '76561198000000000',
      publicSlug: 'demo',
      completionPercentage: 100,
    });
    expect(Object.keys(result.items[0])).not.toEqual(
      expect.arrayContaining(['userId', 'sessionTokenHash', 'session_token_hash']),
    );
  });
});

const now = new Date('2026-01-01T00:00:00.000Z');

function createService(options: { gameRow?: ReturnType<typeof createGameRow> | null } = {}) {
  const gameRow = options.gameRow === undefined ? createGameRow() : options.gameRow;
  const gamesDataService = {
    findGlobalGames: vi.fn(async () => (gameRow === null ? [] : [gameRow])),
    countGlobalGames: vi.fn(async () => (gameRow === null ? 0 : 1)),
    findGlobalGameBySteamAppId: vi.fn(async () => gameRow),
    findBySteamAppId: vi.fn(async () => gameRow?.game ?? null),
  };
  const profileGamesDataService = {
    findPublicTrackedPlayersForGame: vi.fn(async () => [
      {
        steamId: '76561198000000000',
        personaName: 'Demo Player',
        avatarUrl: null,
        profileUrl: null,
        playtimeMinutes: 120,
        totalAchievements: 8,
        unlockedAchievements: 8,
        completionPercentage: 100,
        lastPlayedAt: now,
        publicSlug: 'demo',
      },
    ]),
    countPublicTrackedPlayersForGame: vi.fn(async () => 1),
  };
  const achievementsDataService = {
    findGlobalGameAchievements: vi.fn(async () => [
      {
        id: 'achievement-id',
        steamAppId: 910001,
        apiName: 'ACH_ONE',
        displayName: 'First Step',
        description: 'Start playing.',
        iconUrl: null,
        iconGrayUrl: null,
        globalPercentage: 12.345,
        hidden: false,
        createdAt: now,
        updatedAt: now,
      },
    ]),
    countGlobalGameAchievements: vi.fn(async () => 1),
  };

  return new GamesService(
    {} as ProfilesService,
    profileGamesDataService as unknown as ProfileGamesDataService,
    gamesDataService as unknown as GamesDataService,
    achievementsDataService as unknown as AchievementsDataService,
  );
}

function createGameRow() {
  return {
    game: {
      id: 'game-id',
      steamAppId: 910001,
      name: 'Demo First Steps',
      iconUrl: null,
      logoUrl: null,
      hasAchievements: true,
      createdAt: now,
      updatedAt: now,
    },
    trackedPlayers: 2,
    completedPlayers: 1,
    totalAchievements: 8,
    averageCompletionPercentage: 75.5,
    totalPlaytimeMinutes: 500,
    averagePlaytimeMinutes: 250,
  };
}
