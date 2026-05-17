import { NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import type { AchievementsDataService } from '../../db/services/achievements-data.service';
import type { GamesDataService } from '../../db/services/games-data.service';
import type { ProfileGamesDataService } from '../../db/services/profile-games-data.service';
import type { ProfilesService } from '../profiles/profiles.service';
import {
  GameLibrarySortDto,
  GameLibraryStatusDto,
  SortOrderDto,
} from './dto/game-library-query.dto';
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
          achievementMetadataCount: 8,
          achievementDataState: 'metadata_only',
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
        achievementMetadataCount: 8,
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

  it('returns metadata-only state when achievement metadata exists without player unlock rows', async () => {
    const service = createService({
      profileGameRow: createProfileGameRow({
        achievementMetadataCount: 39,
        knownUnlockStateCount: 0,
        profileTotalAchievements: 0,
      }),
    });

    await expect(service.getGameDetail('76561198000000000', 2669320)).resolves
      .toMatchObject({
        steamAppId: 2669320,
        totalAchievements: 39,
        achievementMetadataCount: 39,
        knownUnlockStateCount: 0,
        achievementDataState: 'metadata_only',
        achievementsSummary: {
          total: 39,
          unlocked: 0,
          locked: 0,
        },
      });
  });

  it('returns not-synced state when no achievement metadata exists yet', async () => {
    const service = createService({
      profileGameRow: createProfileGameRow({
        achievementMetadataCount: 0,
        knownUnlockStateCount: 0,
        profileTotalAchievements: 0,
      }),
    });

    await expect(
      service.getLibrary('76561198000000000', {
        status: GameLibraryStatusDto.All,
        sort: GameLibrarySortDto.Completion,
        order: SortOrderDto.Desc,
        limit: 25,
        offset: 0,
      }),
    ).resolves.toMatchObject({
      items: [
        {
          steamAppId: 2669320,
          totalAchievements: 0,
          achievementMetadataCount: 0,
          achievementDataState: 'not_synced',
        },
      ],
    });
  });
});

const now = new Date('2026-01-01T00:00:00.000Z');

function createService(
  options: {
    gameRow?: ReturnType<typeof createGameRow> | null;
    profileGameRow?: ReturnType<typeof createProfileGameRow>;
  } = {},
) {
  const gameRow = options.gameRow === undefined ? createGameRow() : options.gameRow;
  const profileGameRow = options.profileGameRow ?? createProfileGameRow();
  const profilesService = {
    resolveProfile: vi.fn(async () => ({
      id: 'profile-id',
      steamId: '76561198000000000',
    })),
  };
  const gamesDataService = {
    findGlobalGames: vi.fn(async () => (gameRow === null ? [] : [gameRow])),
    countGlobalGames: vi.fn(async () => (gameRow === null ? 0 : 1)),
    findGlobalGameBySteamAppId: vi.fn(async () => gameRow),
    findBySteamAppId: vi.fn(async () => gameRow?.game ?? null),
  };
  const profileGamesDataService = {
    findProfileGameBySteamAppId: vi.fn(async () => profileGameRow),
    findLibraryByProfileId: vi.fn(async () => [profileGameRow]),
    countLibraryByProfileId: vi.fn(async () => 1),
    findPublicTrackedPlayersForGame: vi.fn(async () => [
      {
        steamId: '76561198000000000',
        personaName: 'Demo Player',
        avatarUrl: null,
        profileUrl: null,
        playtimeMinutes: 120,
        playtimeTwoWeeksMinutes: 15,
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
    profilesService as unknown as ProfilesService,
    profileGamesDataService as unknown as ProfileGamesDataService,
    gamesDataService as unknown as GamesDataService,
    achievementsDataService as unknown as AchievementsDataService,
  );
}

function createProfileGameRow(
  options: {
    achievementMetadataCount?: number;
    knownUnlockStateCount?: number;
    profileTotalAchievements?: number;
  } = {},
) {
  const totalAchievements = options.profileTotalAchievements ?? 8;

  return {
    profileGame: {
      id: 'profile-game-id',
      profileId: 'profile-id',
      gameId: 'game-id',
      playtimeMinutes: 300,
      playtimeTwoWeeksMinutes: 20,
      totalAchievements,
      unlockedAchievements: 0,
      completionPercentage: 0,
      lastPlayedAt: now,
      lastSyncedAt: now,
      createdAt: now,
      updatedAt: now,
    },
    game: {
      id: 'game-id',
      steamAppId: 2669320,
      name: 'Metadata-only Game',
      iconUrl: null,
      logoUrl: null,
      hasAchievements: totalAchievements > 0,
      createdAt: now,
      updatedAt: now,
    },
    achievementMetadataCount: options.achievementMetadataCount ?? totalAchievements,
    knownUnlockStateCount: options.knownUnlockStateCount ?? totalAchievements,
  };
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
    achievementMetadataCount: 8,
    averageCompletionPercentage: 75.5,
    totalPlaytimeMinutes: 500,
    averagePlaytimeMinutes: 250,
  };
}
