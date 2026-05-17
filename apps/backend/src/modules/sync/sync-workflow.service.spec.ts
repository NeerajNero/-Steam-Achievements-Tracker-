import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AchievementSyncDataService } from '../../db/services/achievement-sync-data.service';
import type { GamesDataService } from '../../db/services/games-data.service';
import type { ProfileGamesDataService } from '../../db/services/profile-games-data.service';
import type { ProfileSnapshotsDataService } from '../../db/services/profile-snapshots-data.service';
import type {
  SteamProfile,
  SteamProfilesDataService,
} from '../../db/services/steam-profiles-data.service';
import type {
  SyncRun,
  SyncRunsDataService,
} from '../../db/services/sync-runs-data.service';
import type { CachedSteamApiClient } from '../steam/cached-steam-api.client';
import { SteamApiRequestError } from '../steam/steam-api.errors';
import type { SteamOwnedGame } from '../steam/steam-api.types';
import { SyncWorkflowService } from './sync-workflow.service';

describe('SyncWorkflowService', () => {
  let mocks: SyncWorkflowMocks;
  let service: SyncWorkflowService;

  beforeEach(() => {
    mocks = createMocks();
    service = createService(mocks);
  });

  it('syncProfileBySteamId upserts profile and marks success', async () => {
    mocks.steamApiClient.getPlayerSummaries.mockResolvedValue([
      {
        steamId: '76561198000000000',
        personaName: 'Player',
        avatarUrl: 'https://example.com/avatar.jpg',
        profileUrl: 'https://steamcommunity.com/profiles/76561198000000000',
        visibilityState: 3,
      },
    ]);
    mocks.steamProfilesRepository.upsertProfile.mockResolvedValue(createProfile());

    await expect(
      service.syncProfileBySteamId('sync-run-id', '76561198000000000'),
    ).resolves.toMatchObject({
      status: 'success',
      metadata: { profilesSynced: 1 },
    });
    expect(mocks.steamProfilesRepository.upsertProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        steamId: '76561198000000000',
        personaName: 'Player',
        isPrivate: false,
      }),
    );
    expect(mocks.syncRunsRepository.markSuccess).toHaveBeenCalledWith(
      'sync-run-id',
      { profilesSynced: 1 },
    );
  });

  it('syncOwnedGamesBySteamId ensures profile and upserts games/profile games', async () => {
    mocks.steamProfilesRepository.findBySteamId.mockResolvedValue(null);
    mocks.steamApiClient.getPlayerSummaries.mockResolvedValue([
      {
        steamId: '76561198000000000',
        personaName: 'Player',
        avatarUrl: null,
        profileUrl: null,
        visibilityState: 3,
      },
    ]);
    mocks.steamProfilesRepository.upsertProfile.mockResolvedValue(createProfile());
    mocks.steamApiClient.getOwnedGames.mockResolvedValue([createOwnedGame()]);

    await expect(
      service.syncOwnedGamesBySteamId('sync-run-id', '76561198000000000'),
    ).resolves.toMatchObject({
      status: 'success',
      metadata: { gamesSynced: 1, profileGamesSynced: 1 },
    });
    expect(mocks.steamApiClient.getPlayerSummaries).toHaveBeenCalledWith([
      '76561198000000000',
    ]);
    expect(mocks.gamesRepository.upsertOwnedGame).toHaveBeenCalledWith({
      steamAppId: 10,
      name: 'Owned Game',
      iconUrl: null,
      logoUrl: null,
    });
    expect(
      mocks.profileGamesRepository
        .upsertOwnedGameProgressPreservingAchievementStats,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        profileId: 'profile-id',
        gameId: 'game-id',
        playtimeMinutes: 120,
        playtimeTwoWeeksMinutes: 15,
      }),
    );
  });

  it('games sync preserves achievement progress fields', async () => {
    mocks.steamProfilesRepository.findBySteamId.mockResolvedValue(createProfile());
    mocks.steamApiClient.getOwnedGames.mockResolvedValue([createOwnedGame()]);

    await service.syncOwnedGamesBySteamId('sync-run-id', '76561198000000000');

    expect(
      mocks.profileGamesRepository
        .upsertOwnedGameProgressPreservingAchievementStats,
    ).toHaveBeenCalledWith(
      expect.not.objectContaining({
        totalAchievements: expect.any(Number),
        unlockedAchievements: expect.any(Number),
        completionPercentage: expect.any(Number),
      }),
    );
  });

  it('creates a profile snapshot after games sync when profile games exist', async () => {
    mocks.steamProfilesRepository.findBySteamId.mockResolvedValue(createProfile());
    mocks.steamApiClient.getOwnedGames.mockResolvedValue([createOwnedGame()]);
    mocks.profileGamesRepository.getProfileGameSummary.mockResolvedValue({
      totalGames: 1,
      completedGames: 0,
      totalAchievements: 0,
      unlockedAchievements: 0,
    });

    await service.syncOwnedGamesBySteamId('sync-run-id', '76561198000000000');

    expect(mocks.profileSnapshotsRepository.createForProfileId).toHaveBeenCalledWith(
      'profile-id',
      'sync_completed',
    );
  });

  it('does not create duplicate sync snapshots inside the dedupe window', async () => {
    mocks.steamProfilesRepository.findBySteamId.mockResolvedValue(createProfile());
    mocks.steamApiClient.getOwnedGames.mockResolvedValue([createOwnedGame()]);
    mocks.profileGamesRepository.getProfileGameSummary.mockResolvedValue({
      totalGames: 1,
      completedGames: 0,
      totalAchievements: 0,
      unlockedAchievements: 0,
    });
    mocks.profileSnapshotsRepository.findLatestBySteamProfileId.mockResolvedValue({
      id: 'snapshot-id',
      steamProfileId: 'profile-id',
      totalGames: 1,
      completedGames: 0,
      totalAchievements: 0,
      unlockedAchievements: 0,
      remainingAchievements: 0,
      averageCompletionPercentage: 0,
      totalPlaytimeMinutes: 0,
      rarestUnlockedGlobalPercentage: null,
      snapshotReason: 'sync_completed',
      createdAt: new Date(),
    });

    await service.syncOwnedGamesBySteamId('sync-run-id', '76561198000000000');

    expect(
      mocks.profileSnapshotsRepository.createForProfileId,
    ).not.toHaveBeenCalled();
  });

  it('Steam API failure is thrown for the processor to handle retry/final failure', async () => {
    const error = new SteamApiRequestError('upstream failed', 503);
    mocks.steamApiClient.getPlayerSummaries.mockRejectedValue(error);

    await expect(
      service.syncProfileBySteamId('sync-run-id', '76561198000000000'),
    ).rejects.toBe(error);
    expect(mocks.syncRunsRepository.markFailed).not.toHaveBeenCalled();
  });

  it('missing or unavailable profile marks the run failed safely', async () => {
    mocks.steamApiClient.getPlayerSummaries.mockResolvedValue([]);

    await expect(
      service.syncProfileBySteamId('sync-run-id', '76561198000000000'),
    ).resolves.toMatchObject({
      status: 'failed',
      errorMessage: 'Steam profile is missing, private, or unavailable.',
      metadata: { profilesSynced: 0 },
    });
    expect(mocks.syncRunsRepository.markFailed).toHaveBeenCalledWith(
      'sync-run-id',
      'Steam profile is missing, private, or unavailable.',
      { profilesSynced: 0 },
    );
  });

  it('achievement workflow fails safely when profile is missing', async () => {
    mocks.steamProfilesRepository.findBySteamId.mockResolvedValue(null);

    await expect(
      service.syncAchievementsBySteamId('sync-run-id', '76561198000000000', [
        910001,
      ]),
    ).resolves.toMatchObject({
      status: 'failed',
      errorMessage:
        'Steam profile must be synced before achievements can be synced.',
      metadata: expect.objectContaining({
        gamesRequested: 1,
        gamesProcessed: 0,
        gamesSucceeded: 0,
        gamesFailed: 1,
      }),
    });
    expect(mocks.steamApiClient.getSchemaForGame).not.toHaveBeenCalled();
    expect(mocks.syncRunsRepository.markFailed).toHaveBeenCalledWith(
      'sync-run-id',
      'Steam profile must be synced before achievements can be synced.',
      expect.objectContaining({
        appIds: [910001],
        gamesFailed: 1,
      }),
    );
  });

  it('achievement workflow syncs one game successfully', async () => {
    mocks.steamProfilesRepository.findBySteamId.mockResolvedValue(createProfile());
    mocks.profileGamesRepository.findProfileGamesForAchievementSync.mockResolvedValue([
      createProfileGameWithGame(910001),
    ]);
    mocks.steamApiClient.getSchemaForGame.mockResolvedValue({
      appId: 910001,
      gameName: 'Achievement Game',
      achievements: [
        createSchemaAchievement('ACH_WIN', 'Win', false),
        createSchemaAchievement('ACH_RARE', 'Rare Win', true),
      ],
    });
    mocks.steamApiClient.getGlobalAchievementPercentages.mockResolvedValue([
      { apiName: 'ACH_WIN', globalPercentage: 80.1 },
      { apiName: 'ACH_RARE', globalPercentage: 2.5 },
    ]);
    mocks.steamApiClient.getPlayerAchievements.mockResolvedValue({
      steamId: '76561198000000000',
      appId: 910001,
      isPrivateOrUnavailable: false,
      achievements: [
        {
          apiName: 'ACH_WIN',
          achieved: true,
          unlockedAt: new Date('2026-01-01T00:00:00.000Z'),
        },
        { apiName: 'ACH_RARE', achieved: false, unlockedAt: null },
      ],
    });

    await expect(
      service.syncAchievementsBySteamId('sync-run-id', '76561198000000000', [
        910001,
      ]),
    ).resolves.toMatchObject({
      status: 'success',
      metadata: expect.objectContaining({
        gamesRequested: 1,
        gamesProcessed: 1,
        gamesSucceeded: 1,
        gamesMetadataOnly: 0,
        gamesNoAchievements: 0,
        gamesFailed: 0,
        achievementsSynced: 2,
        profileAchievementsSynced: 2,
      }),
    });
    expect(
      mocks.achievementSyncRepository.applyGameAchievementSync,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        profileId: 'profile-id',
        steamAppId: 910001,
        achievements: [
          expect.objectContaining({
            apiName: 'ACH_RARE',
            hidden: true,
            globalPercentage: 2.5,
          }),
          expect.objectContaining({
            apiName: 'ACH_WIN',
            hidden: false,
            globalPercentage: 80.1,
          }),
        ],
        profileAchievements: [
          expect.objectContaining({ apiName: 'ACH_WIN', achieved: true }),
          expect.objectContaining({ apiName: 'ACH_RARE', achieved: false }),
        ],
      }),
    );
    expect(
      mocks.achievementSyncRepository.applyGameAchievementMetadata,
    ).toHaveBeenCalledWith({
      steamAppId: 910001,
      achievements: [
        expect.objectContaining({ apiName: 'ACH_RARE' }),
        expect.objectContaining({ apiName: 'ACH_WIN' }),
      ],
    });
    expect(
      mocks.achievementSyncRepository.applyGameAchievementSync,
    ).toHaveBeenCalledWith(
      expect.not.objectContaining({
        totalAchievements: expect.any(Number),
        unlockedAchievements: expect.any(Number),
        completionPercentage: expect.any(Number),
        progress: expect.any(Object),
      }),
    );
  });

  it('achievement workflow persists metadata when player achievements are unavailable', async () => {
    mocks.steamProfilesRepository.findBySteamId.mockResolvedValue(createProfile());
    mocks.profileGamesRepository.findProfileGamesForAchievementSync.mockResolvedValue([
      createProfileGameWithGame(550),
    ]);
    mocks.steamApiClient.getSchemaForGame.mockResolvedValue({
      appId: 550,
      gameName: 'Left 4 Dead 2',
      achievements: [createSchemaAchievement('ACH_SURVIVE', 'Survive', false)],
    });
    mocks.steamApiClient.getGlobalAchievementPercentages.mockResolvedValue([
      { apiName: 'ACH_SURVIVE', globalPercentage: 12.3 },
    ]);
    mocks.steamApiClient.getPlayerAchievements.mockRejectedValue(
      new SteamApiRequestError('player achievements denied', 403),
    );

    await expect(
      service.syncAchievementsBySteamId('sync-run-id', '76561198000000000', [
        550,
      ]),
    ).resolves.toMatchObject({
      status: 'partial_success',
      errorMessage: 'Achievement sync completed with partial failures.',
      metadata: expect.objectContaining({
        gamesRequested: 1,
        gamesProcessed: 1,
        gamesSucceeded: 0,
        gamesMetadataOnly: 1,
        gamesNoAchievements: 0,
        gamesFailed: 0,
        achievementsSynced: 1,
        profileAchievementsSynced: 0,
        unlockStateUnavailableApps: [
          {
            appId: 550,
            reason: 'Player achievements unavailable',
          },
        ],
        failedApps: [],
      }),
    });
    expect(
      mocks.achievementSyncRepository.applyGameAchievementMetadata,
    ).toHaveBeenCalledWith({
      steamAppId: 550,
      achievements: [
        expect.objectContaining({
          apiName: 'ACH_SURVIVE',
          globalPercentage: 12.3,
        }),
      ],
    });
    expect(
      mocks.achievementSyncRepository.applyGameAchievementSync,
    ).not.toHaveBeenCalled();
  });

  it('achievement workflow handles zero-achievement game as success', async () => {
    mocks.steamProfilesRepository.findBySteamId.mockResolvedValue(createProfile());
    mocks.profileGamesRepository.findProfileGamesForAchievementSync.mockResolvedValue([
      createProfileGameWithGame(910002),
    ]);
    mocks.steamApiClient.getSchemaForGame.mockResolvedValue({
      appId: 910002,
      gameName: 'No Achievements',
      achievements: [],
    });
    mocks.steamApiClient.getGlobalAchievementPercentages.mockResolvedValue([]);
    mocks.steamApiClient.getPlayerAchievements.mockResolvedValue({
      steamId: '76561198000000000',
      appId: 910002,
      isPrivateOrUnavailable: false,
      achievements: [],
    });

    await expect(
      service.syncAchievementsBySteamId('sync-run-id', '76561198000000000', [
        910002,
      ]),
    ).resolves.toMatchObject({
      status: 'success',
      metadata: expect.objectContaining({
        gamesSucceeded: 0,
        gamesMetadataOnly: 0,
        gamesNoAchievements: 1,
        gamesFailed: 0,
        achievementsSynced: 0,
        profileAchievementsSynced: 0,
      }),
    });
    expect(
      mocks.achievementSyncRepository.applyGameAchievementSync,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        achievements: [],
        profileAchievements: [],
      }),
    );
    expect(
      mocks.achievementSyncRepository.applyGameAchievementMetadata,
    ).not.toHaveBeenCalled();
  });

  it('achievement workflow handles one success and one failure as partial_success', async () => {
    mocks.steamProfilesRepository.findBySteamId.mockResolvedValue(createProfile());
    mocks.profileGamesRepository.findProfileGamesForAchievementSync.mockResolvedValue([
      createProfileGameWithGame(910001),
      createProfileGameWithGame(910002),
    ]);
    mocks.steamApiClient.getSchemaForGame.mockImplementation(
      async (input: { appId: number }) => {
        if (input.appId === 910002) {
          throw new SteamApiRequestError('upstream failed', 503);
        }

        return {
          appId: input.appId,
          gameName: 'Achievement Game',
          achievements: [createSchemaAchievement('ACH_WIN', 'Win', false)],
        };
      },
    );
    mocks.steamApiClient.getGlobalAchievementPercentages.mockResolvedValue([]);
    mocks.steamApiClient.getPlayerAchievements.mockResolvedValue({
      steamId: '76561198000000000',
      appId: 910001,
      isPrivateOrUnavailable: false,
      achievements: [{ apiName: 'ACH_WIN', achieved: true, unlockedAt: null }],
    });

    await expect(
      service.syncAchievementsBySteamId('sync-run-id', '76561198000000000'),
    ).resolves.toMatchObject({
      status: 'partial_success',
      errorMessage: 'Achievement sync completed with partial failures.',
      metadata: expect.objectContaining({
        gamesRequested: 2,
        gamesProcessed: 2,
        gamesSucceeded: 1,
        gamesMetadataOnly: 0,
        gamesNoAchievements: 0,
        gamesFailed: 1,
      }),
    });
    expect(mocks.syncRunsRepository.markPartialSuccess).toHaveBeenCalledWith(
      'sync-run-id',
      'Achievement sync completed with partial failures.',
      expect.objectContaining({
        gamesSucceeded: 1,
        gamesMetadataOnly: 0,
        gamesNoAchievements: 0,
        gamesFailed: 1,
        failedApps: [
          {
            appId: 910002,
            reason:
              'Steam API request failed while syncing achievements for this game.',
          },
        ],
      }),
    );
  });

  it('achievement workflow handles all failures as failed', async () => {
    mocks.steamProfilesRepository.findBySteamId.mockResolvedValue(createProfile());
    mocks.profileGamesRepository.findProfileGamesForAchievementSync.mockResolvedValue([
      createProfileGameWithGame(910001),
    ]);
    mocks.steamApiClient.getSchemaForGame.mockRejectedValue(
      new SteamApiRequestError('upstream failed', 503),
    );

    await expect(
      service.syncAchievementsBySteamId('sync-run-id', '76561198000000000'),
    ).resolves.toMatchObject({
      status: 'failed',
      errorMessage: 'Achievement sync failed for all requested games.',
      metadata: expect.objectContaining({
        gamesSucceeded: 0,
        gamesMetadataOnly: 0,
        gamesNoAchievements: 0,
        gamesFailed: 1,
      }),
    });
  });

  it('achievement workflow does not delete existing achievement data on partial API response', async () => {
    mocks.steamProfilesRepository.findBySteamId.mockResolvedValue(createProfile());
    mocks.profileGamesRepository.findProfileGamesForAchievementSync.mockResolvedValue([
      createProfileGameWithGame(910001),
    ]);
    mocks.steamApiClient.getSchemaForGame.mockResolvedValue({
      appId: 910001,
      gameName: 'Partial Data Game',
      achievements: [createSchemaAchievement('ACH_ONLY_RETURNED', 'Returned', false)],
    });
    mocks.steamApiClient.getGlobalAchievementPercentages.mockResolvedValue([]);
    mocks.steamApiClient.getPlayerAchievements.mockResolvedValue({
      steamId: '76561198000000000',
      appId: 910001,
      isPrivateOrUnavailable: false,
      achievements: [
        { apiName: 'ACH_ONLY_RETURNED', achieved: true, unlockedAt: null },
      ],
    });

    await service.syncAchievementsBySteamId(
      'sync-run-id',
      '76561198000000000',
      [910001],
    );

    expect(
      mocks.achievementSyncRepository.applyGameAchievementSync,
    ).toHaveBeenCalledTimes(1);
    expect(mocks.achievementSyncRepository.delete).toBeUndefined();
  });
});

interface SyncWorkflowMocks {
  steamApiClient: {
    getPlayerSummaries: ReturnType<typeof vi.fn>;
    getOwnedGames: ReturnType<typeof vi.fn>;
    getSchemaForGame: ReturnType<typeof vi.fn>;
    getGlobalAchievementPercentages: ReturnType<typeof vi.fn>;
    getPlayerAchievements: ReturnType<typeof vi.fn>;
  };
  steamProfilesRepository: {
    findBySteamId: ReturnType<typeof vi.fn>;
    upsertProfile: ReturnType<typeof vi.fn>;
    updateSyncState: ReturnType<typeof vi.fn>;
  };
  gamesRepository: {
    upsertOwnedGame: ReturnType<typeof vi.fn>;
  };
  profileGamesRepository: {
    upsertOwnedGameProgressPreservingAchievementStats: ReturnType<typeof vi.fn>;
    findProfileGamesForAchievementSync: ReturnType<typeof vi.fn>;
    getProfileGameSummary: ReturnType<typeof vi.fn>;
  };
  profileSnapshotsRepository: {
    createForProfileId: ReturnType<typeof vi.fn>;
    findLatestBySteamProfileId: ReturnType<typeof vi.fn>;
  };
  achievementSyncRepository: {
    applyGameAchievementMetadata: ReturnType<typeof vi.fn>;
    applyGameAchievementSync: ReturnType<typeof vi.fn>;
    delete?: ReturnType<typeof vi.fn>;
  };
  syncRunsRepository: {
    assignProfile: ReturnType<typeof vi.fn>;
    markSuccess: ReturnType<typeof vi.fn>;
    markPartialSuccess: ReturnType<typeof vi.fn>;
    markFailed: ReturnType<typeof vi.fn>;
  };
}

function createService(mocks: SyncWorkflowMocks): SyncWorkflowService {
  return new SyncWorkflowService(
    mocks.steamApiClient as unknown as CachedSteamApiClient,
    mocks.steamProfilesRepository as unknown as SteamProfilesDataService,
    mocks.gamesRepository as unknown as GamesDataService,
    mocks.profileGamesRepository as unknown as ProfileGamesDataService,
    mocks.profileSnapshotsRepository as unknown as ProfileSnapshotsDataService,
    mocks.achievementSyncRepository as unknown as AchievementSyncDataService,
    mocks.syncRunsRepository as unknown as SyncRunsDataService,
  );
}

function createMocks(): SyncWorkflowMocks {
  return {
    steamApiClient: {
      getPlayerSummaries: vi.fn(),
      getOwnedGames: vi.fn(async () => []),
      getSchemaForGame: vi.fn(),
      getGlobalAchievementPercentages: vi.fn(),
      getPlayerAchievements: vi.fn(),
    },
    steamProfilesRepository: {
      findBySteamId: vi.fn(),
      upsertProfile: vi.fn(),
      updateSyncState: vi.fn(),
    },
    gamesRepository: {
      upsertOwnedGame: vi.fn(async () => ({
        id: 'game-id',
        steamAppId: 10,
        name: 'Owned Game',
        iconUrl: null,
        logoUrl: null,
        hasAchievements: false,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      })),
    },
    profileGamesRepository: {
      upsertOwnedGameProgressPreservingAchievementStats: vi.fn(),
      findProfileGamesForAchievementSync: vi.fn(async () => []),
      getProfileGameSummary: vi.fn(async () => ({
        totalGames: 0,
        completedGames: 0,
        totalAchievements: 0,
        unlockedAchievements: 0,
      })),
    },
    profileSnapshotsRepository: {
      createForProfileId: vi.fn(),
      findLatestBySteamProfileId: vi.fn(async () => null),
    },
    achievementSyncRepository: {
      applyGameAchievementMetadata: vi.fn(async (input) => ({
        achievementsSynced: input.achievements.length,
      })),
      applyGameAchievementSync: vi.fn(async (input) => ({
        achievementsSynced: input.achievements.length,
        profileAchievementsSynced: input.profileAchievements?.length ?? 0,
        progress: {
          totalAchievements: input.achievements.length,
          unlockedAchievements:
            input.profileAchievements?.filter(
              (achievement: { achieved: boolean }) => achievement.achieved,
            ).length ?? 0,
          completionPercentage: 0,
        },
      })),
    },
    syncRunsRepository: {
      assignProfile: vi.fn(async () => createSyncRun('running')),
      markSuccess: vi.fn(async (_id: string, metadata: Record<string, unknown>) =>
        createSyncRun('success', null, metadata),
      ),
      markPartialSuccess: vi.fn(
        async (_id: string, errorMessage: string, metadata) =>
          createSyncRun('partial_success', errorMessage, metadata),
      ),
      markFailed: vi.fn(async (_id: string, errorMessage: string, metadata) =>
        createSyncRun('failed', errorMessage, metadata),
      ),
    },
  };
}

function createSyncRun(
  status: SyncRun['status'],
  errorMessage: string | null = null,
  metadata: Record<string, unknown> = {},
): SyncRun {
  const now = new Date('2026-01-01T00:00:00.000Z');

  return {
    id: 'sync-run-id',
    profileId: null,
    syncType: 'profile',
    status,
    startedAt: now,
    finishedAt: status === 'queued' || status === 'running' ? null : now,
    errorMessage,
    metadata,
    createdAt: now,
  };
}

function createProfile(): SteamProfile {
  const now = new Date('2026-01-01T00:00:00.000Z');

  return {
    id: 'profile-id',
    steamId: '76561198000000000',
    personaName: 'Player',
    avatarUrl: null,
    profileUrl: null,
    visibilityState: 3,
    isPrivate: false,
    lastSyncedAt: now,
    createdAt: now,
    updatedAt: now,
  };
}

function createOwnedGame(): SteamOwnedGame {
  return {
    appId: 10,
    gameName: 'Owned Game',
    playtimeMinutes: 120,
    playtimeTwoWeeksMinutes: 15,
    lastPlayedAt: new Date('2026-01-01T00:00:00.000Z'),
  };
}

function createProfileGameWithGame(steamAppId: number) {
  const now = new Date('2026-01-01T00:00:00.000Z');

  return {
    profileGame: {
      id: `profile-game-id-${steamAppId}`,
      profileId: 'profile-id',
      gameId: `game-id-${steamAppId}`,
      playtimeMinutes: 120,
      playtimeTwoWeeksMinutes: 0,
      totalAchievements: 0,
      unlockedAchievements: 0,
      completionPercentage: 0,
      lastPlayedAt: null,
      lastSyncedAt: null,
      createdAt: now,
      updatedAt: now,
    },
    game: {
      id: `game-id-${steamAppId}`,
      steamAppId,
      name: `Game ${steamAppId}`,
      iconUrl: null,
      logoUrl: null,
      hasAchievements: false,
      createdAt: now,
      updatedAt: now,
    },
  };
}

function createSchemaAchievement(
  apiName: string,
  displayName: string,
  hidden: boolean,
) {
  return {
    apiName,
    displayName,
    description: `${displayName} description`,
    iconUrl: null,
    iconGrayUrl: null,
    hidden,
  };
}
