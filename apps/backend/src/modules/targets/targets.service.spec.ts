import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import type { AchievementsDataService } from '../../db/services/achievements-data.service';
import type { GamesDataService } from '../../db/services/games-data.service';
import type { ProfileAchievementsDataService } from '../../db/services/profile-achievements-data.service';
import type { TargetsDataService } from '../../db/services/targets-data.service';
import type { AuthenticatedUserContext } from '../auth/authenticated-user.types';
import { TargetPriorityDto, TargetStatusDto } from './dto/target-request.dto';
import { TargetAchievementUnlockStateDto } from './dto/target-response.dto';
import { TargetsService } from './targets.service';

describe('TargetsService', () => {
  it('requires a linked Steam profile to create a game target', async () => {
    const service = createService().service;

    await expect(
      service.createGameTarget(createUser({ linked: false }), {
        steamAppId: 910001,
        priority: TargetPriorityDto.Medium,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('upserts an existing game target for known games', async () => {
    const { service, targetsDataService } = createService();

    const target = await service.createGameTarget(createUser(), {
      steamAppId: 910001,
      priority: TargetPriorityDto.High,
      notes: 'Finish this one',
      targetCompletionPercentage: 100,
      dueDate: '2026-06-01',
    });

    expect(target).toMatchObject({
      id: 'game-target-id',
      type: 'game',
      priority: TargetPriorityDto.High,
      notes: 'Finish this one',
      targetCompletionPercentage: 100,
      game: {
        steamAppId: 910001,
        achievementDataState: 'unlock_state_synced',
      },
    });
    expect(targetsDataService.upsertGameTarget).toHaveBeenCalledWith({
      userId: 'user-id',
      steamProfileId: 'profile-id',
      gameId: 'game-id',
      priority: TargetPriorityDto.High,
      notes: 'Finish this one',
      targetCompletionPercentage: 100,
      dueDate: '2026-06-01',
    });
  });

  it('rejects unknown games', async () => {
    const service = createService({ game: null }).service;

    await expect(
      service.createGameTarget(createUser(), {
        steamAppId: 999999,
        priority: TargetPriorityDto.Medium,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('allows owners to update and archive game targets', async () => {
    const { service, targetsDataService } = createService();

    await expect(
      service.updateGameTarget(createUser(), 'game-target-id', {
        status: TargetStatusDto.Paused,
        priority: TargetPriorityDto.Low,
      }),
    ).resolves.toMatchObject({
      id: 'game-target-id',
      status: TargetStatusDto.Active,
    });
    expect(targetsDataService.updateGameTargetForUser).toHaveBeenCalledWith(
      'user-id',
      'game-target-id',
      expect.objectContaining({
        status: TargetStatusDto.Paused,
        priority: TargetPriorityDto.Low,
      }),
    );

    await service.archiveGameTarget(createUser(), 'game-target-id');
    expect(targetsDataService.updateGameTargetForUser).toHaveBeenCalledWith(
      'user-id',
      'game-target-id',
      expect.objectContaining({ status: TargetStatusDto.Archived }),
    );
  });

  it('does not update another user target', async () => {
    const service = createService({ updateGameTarget: null }).service;

    await expect(
      service.updateGameTarget(createUser(), 'other-target-id', {
        priority: TargetPriorityDto.High,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('creates achievement targets even when unlock state is unknown', async () => {
    const { service, targetsDataService } = createService();

    const target = await service.createAchievementTarget(createUser(), {
      achievementId: 'achievement-id',
      priority: TargetPriorityDto.High,
      notes: 'Practice route',
      dueDate: '2026-06-02',
    });

    expect(target).toMatchObject({
      id: 'achievement-target-id',
      type: 'achievement',
      priority: TargetPriorityDto.High,
      achievement: {
        id: 'achievement-id',
        unlockState: TargetAchievementUnlockStateDto.Unknown,
      },
    });
    expect(targetsDataService.upsertAchievementTarget).toHaveBeenCalledWith({
      userId: 'user-id',
      steamProfileId: 'profile-id',
      achievementId: 'achievement-id',
      priority: TargetPriorityDto.High,
      notes: 'Practice route',
      dueDate: '2026-06-02',
    });
  });

  it('creates achievement targets when the achievement is known locked', async () => {
    const { service, targetsDataService } = createService({
      profileAchievement: createProfileAchievement({ achieved: false }),
    });

    await expect(
      service.createAchievementTarget(createUser(), {
        achievementId: 'achievement-id',
        priority: TargetPriorityDto.Medium,
      }),
    ).resolves.toMatchObject({
      achievement: {
        unlockState: TargetAchievementUnlockStateDto.Unknown,
      },
    });
    expect(targetsDataService.upsertAchievementTarget).toHaveBeenCalled();
  });

  it('rejects achievement targets when the signed-in profile already unlocked it', async () => {
    const { service, targetsDataService } = createService({
      profileAchievement: createProfileAchievement({ achieved: true }),
    });

    await expect(
      service.createAchievementTarget(createUser(), {
        achievementId: 'achievement-id',
        priority: TargetPriorityDto.High,
      }),
    ).rejects.toThrow(ConflictException);
    expect(targetsDataService.upsertAchievementTarget).not.toHaveBeenCalled();
  });
});

const now = new Date('2026-05-18T12:00:00.000Z');

function createService(options: {
  game?: ReturnType<typeof createGame> | null;
  profileAchievement?: ReturnType<typeof createProfileAchievement> | null;
  updateGameTarget?: ReturnType<typeof createGameTarget> | null;
} = {}) {
  const game = options.game === undefined ? createGame() : options.game;
  const updateGameTarget =
    options.updateGameTarget === undefined
      ? createGameTarget()
      : options.updateGameTarget;
  const gameTargetRow = createGameTargetRow(updateGameTarget ?? createGameTarget());
  const achievementTargetRow = createAchievementTargetRow();
  const targetsDataService = {
    upsertGameTarget: vi.fn(async () => createGameTarget()),
    upsertAchievementTarget: vi.fn(async () => createAchievementTarget()),
    findGameTargetByIdForUser: vi.fn(async () => gameTargetRow),
    findAchievementTargetByIdForUser: vi.fn(async () => achievementTargetRow),
    updateGameTargetForUser: vi.fn(async () => updateGameTarget),
    updateAchievementTargetForUser: vi.fn(async () => createAchievementTarget()),
    findGameTargetsByUser: vi.fn(async () => [gameTargetRow]),
    findAchievementTargetsByUser: vi.fn(async () => [achievementTargetRow]),
    countGameTargetsByUser: vi.fn(async () => 1),
    countAchievementTargetsByUser: vi.fn(async () => 1),
    findActiveGameTargetsForDashboard: vi.fn(async () => [gameTargetRow]),
    findActiveAchievementTargetsForDashboard: vi.fn(async () => [
      achievementTargetRow,
    ]),
  };
  const gamesDataService = {
    findBySteamAppId: vi.fn(async () => game),
  };
  const achievementsDataService = {
    findById: vi.fn(async () => createAchievement()),
  };
  const profileAchievement =
    options.profileAchievement === undefined ? null : options.profileAchievement;
  const profileAchievementsDataService = {
    findByProfileAndAchievement: vi.fn(async () => profileAchievement),
  };
  const service = new TargetsService(
    targetsDataService as unknown as TargetsDataService,
    gamesDataService as unknown as GamesDataService,
    achievementsDataService as unknown as AchievementsDataService,
    profileAchievementsDataService as unknown as ProfileAchievementsDataService,
  );

  return {
    service,
    targetsDataService,
    gamesDataService,
    achievementsDataService,
    profileAchievementsDataService,
  };
}

function createUser(input: { linked?: boolean } = {}): AuthenticatedUserContext {
  const linked = input.linked ?? true;

  return {
    userId: 'user-id',
    user: {
      id: 'user-id',
      displayName: 'Hunter',
      avatarUrl: null,
      role: 'user',
      status: 'active',
    },
    steamAccount: linked
      ? {
          steamId: '76561198000000000',
          steamProfileId: 'profile-id',
          personaName: 'Hunter',
          avatarUrl: null,
          isPrimary: true,
        }
      : null,
    publicProfile: null,
  };
}

function createGame() {
  return {
    id: 'game-id',
    steamAppId: 910001,
    name: 'Demo Complete Quest',
    iconUrl: null,
    logoUrl: null,
    hasAchievements: true,
    createdAt: now,
    updatedAt: now,
  };
}

function createAchievement() {
  return {
    id: 'achievement-id',
    steamAppId: 910001,
    apiName: 'ACH_DEMO',
    displayName: 'Demo Achievement',
    description: 'Unlock this.',
    iconUrl: null,
    iconGrayUrl: null,
    globalPercentage: 10,
    hidden: false,
    createdAt: now,
    updatedAt: now,
  };
}

function createGameTarget() {
  return {
    id: 'game-target-id',
    userId: 'user-id',
    steamProfileId: 'profile-id',
    gameId: 'game-id',
    status: 'active',
    priority: 'high',
    notes: 'Finish this one',
    targetCompletionPercentage: 100,
    dueDate: '2026-06-01',
    createdAt: now,
    updatedAt: now,
  };
}

function createAchievementTarget() {
  return {
    id: 'achievement-target-id',
    userId: 'user-id',
    steamProfileId: 'profile-id',
    achievementId: 'achievement-id',
    status: 'active',
    priority: 'high',
    notes: 'Practice route',
    dueDate: '2026-06-02',
    createdAt: now,
    updatedAt: now,
  };
}

function createGameTargetRow(target: ReturnType<typeof createGameTarget>) {
  return {
    target,
    game: createGame(),
    profileGame: {
      id: 'profile-game-id',
      profileId: 'profile-id',
      gameId: 'game-id',
      playtimeMinutes: 120,
      playtimeTwoWeeksMinutes: 20,
      totalAchievements: 10,
      unlockedAchievements: 7,
      completionPercentage: 70,
      lastPlayedAt: now,
      createdAt: now,
      updatedAt: now,
    },
    achievementMetadataCount: 10,
    knownUnlockStateCount: 10,
  };
}

function createAchievementTargetRow() {
  return {
    target: createAchievementTarget(),
    achievement: createAchievement(),
    game: createGame(),
    profileAchievement: null,
  };
}

function createProfileAchievement(input: { achieved: boolean }) {
  return {
    id: 'profile-achievement-id',
    profileId: 'profile-id',
    achievementId: 'achievement-id',
    achieved: input.achieved,
    unlockedAt: input.achieved ? now : null,
    lastSyncedAt: now,
    createdAt: now,
    updatedAt: now,
  };
}
