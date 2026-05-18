import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { AchievementsDataService } from '../../db/services/achievements-data.service';
import { GamesDataService } from '../../db/services/games-data.service';
import { ProfileAchievementsDataService } from '../../db/services/profile-achievements-data.service';
import {
  TargetsDataService,
  type AchievementTargetRow,
  type GameTargetRow,
  type TargetListFilters,
  type TargetPriority,
  type TargetStatus,
} from '../../db/services/targets-data.service';
import type { AuthenticatedUserContext } from '../auth/authenticated-user.types';
import type { AchievementDataState } from '../games/dto/achievement-data-state.dto';
import {
  CreateAchievementTargetDto,
  CreateGameTargetDto,
  ListAccountTargetsQueryDto,
  TargetPriorityDto,
  TargetStatusDto,
  TargetTypeDto,
  UpdateAchievementTargetDto,
  UpdateGameTargetDto,
} from './dto/target-request.dto';
import {
  type AccountTargetResponseDto,
  type AccountTargetsResponseDto,
  TargetAchievementUnlockStateDto,
  TargetResponseTypeDto,
} from './dto/target-response.dto';

@Injectable()
export class TargetsService {
  constructor(
    private readonly targetsDataService: TargetsDataService,
    private readonly gamesDataService: GamesDataService,
    private readonly achievementsDataService: AchievementsDataService,
    private readonly profileAchievementsDataService: ProfileAchievementsDataService,
  ) {}

  async listAccountTargets(
    currentUser: AuthenticatedUserContext,
    query: ListAccountTargetsQueryDto,
  ): Promise<AccountTargetsResponseDto> {
    const filters: TargetListFilters = {
      status: query.status,
      type: query.type,
      limit: query.limit,
      offset: query.offset,
    };

    const [gameTotal, achievementTotal] = await Promise.all([
      filters.type === TargetTypeDto.Achievement
        ? Promise.resolve(0)
        : this.targetsDataService.countGameTargetsByUser(currentUser.userId, {
            status: filters.status,
          }),
      filters.type === TargetTypeDto.Game
        ? Promise.resolve(0)
        : this.targetsDataService.countAchievementTargetsByUser(currentUser.userId, {
            status: filters.status,
          }),
    ]);

    if (filters.type === TargetTypeDto.Game) {
      const gameTargets = await this.targetsDataService.findGameTargetsByUser(
        currentUser.userId,
        filters,
      );

      return {
        items: gameTargets.map(mapGameTarget),
        total: gameTotal,
        limit: filters.limit,
        offset: filters.offset,
      };
    }

    if (filters.type === TargetTypeDto.Achievement) {
      const achievementTargets =
        await this.targetsDataService.findAchievementTargetsByUser(
          currentUser.userId,
          filters,
        );

      return {
        items: achievementTargets.map(mapAchievementTarget),
        total: achievementTotal,
        limit: filters.limit,
        offset: filters.offset,
      };
    }

    const fetchLimit = filters.offset + filters.limit;
    const [gameTargets, achievementTargets] = await Promise.all([
      this.targetsDataService.findGameTargetsByUser(currentUser.userId, {
        ...filters,
        type: TargetTypeDto.Game,
        limit: fetchLimit,
        offset: 0,
      }),
      this.targetsDataService.findAchievementTargetsByUser(currentUser.userId, {
        ...filters,
        type: TargetTypeDto.Achievement,
        limit: fetchLimit,
        offset: 0,
      }),
    ]);

    const items = [
      ...gameTargets.map(mapGameTarget),
      ...achievementTargets.map(mapAchievementTarget),
    ]
      .sort(compareTargets)
      .slice(filters.offset, filters.offset + filters.limit);

    return {
      items,
      total: gameTotal + achievementTotal,
      limit: filters.limit,
      offset: filters.offset,
    };
  }

  async createGameTarget(
    currentUser: AuthenticatedUserContext,
    body: CreateGameTargetDto,
  ): Promise<AccountTargetResponseDto> {
    const steamProfileId = requireLinkedSteamProfile(currentUser);
    const game = await this.gamesDataService.findBySteamAppId(body.steamAppId);

    if (game === null) {
      throw new NotFoundException(`Game ${body.steamAppId} was not found.`);
    }

    const target = await this.targetsDataService.upsertGameTarget({
      userId: currentUser.userId,
      steamProfileId,
      gameId: game.id,
      priority: body.priority,
      notes: body.notes,
      targetCompletionPercentage: body.targetCompletionPercentage,
      dueDate: body.dueDate,
    });
    const row = await this.targetsDataService.findGameTargetByIdForUser(
      currentUser.userId,
      target.id,
    );

    if (row === null) {
      throw new NotFoundException('Created game target was not found.');
    }

    return mapGameTarget(row);
  }

  async updateGameTarget(
    currentUser: AuthenticatedUserContext,
    targetId: string,
    body: UpdateGameTargetDto,
  ): Promise<AccountTargetResponseDto> {
    const updated = await this.targetsDataService.updateGameTargetForUser(
      currentUser.userId,
      targetId,
      {
        status: body.status,
        priority: body.priority,
        notes: body.notes,
        targetCompletionPercentage: body.targetCompletionPercentage,
        dueDate: body.dueDate,
      },
    );

    if (updated === null) {
      throw new NotFoundException('Game target was not found.');
    }

    const row = await this.targetsDataService.findGameTargetByIdForUser(
      currentUser.userId,
      updated.id,
    );

    if (row === null) {
      throw new NotFoundException('Game target was not found.');
    }

    return mapGameTarget(row);
  }

  async archiveGameTarget(
    currentUser: AuthenticatedUserContext,
    targetId: string,
  ): Promise<AccountTargetResponseDto> {
    return this.updateGameTarget(currentUser, targetId, {
      status: TargetStatusDto.Archived,
    });
  }

  async createAchievementTarget(
    currentUser: AuthenticatedUserContext,
    body: CreateAchievementTargetDto,
  ): Promise<AccountTargetResponseDto> {
    const steamProfileId = requireLinkedSteamProfile(currentUser);
    const achievement = await this.achievementsDataService.findById(
      body.achievementId,
    );

    if (achievement === null) {
      throw new NotFoundException(`Achievement ${body.achievementId} was not found.`);
    }

    const profileAchievement =
      await this.profileAchievementsDataService.findByProfileAndAchievement(
        steamProfileId,
        achievement.id,
      );

    if (profileAchievement?.achieved === true) {
      throw new ConflictException(
        'Achievement is already unlocked and cannot be added as an active target.',
      );
    }

    const target = await this.targetsDataService.upsertAchievementTarget({
      userId: currentUser.userId,
      steamProfileId,
      achievementId: achievement.id,
      priority: body.priority,
      notes: body.notes,
      dueDate: body.dueDate,
    });
    const row = await this.targetsDataService.findAchievementTargetByIdForUser(
      currentUser.userId,
      target.id,
    );

    if (row === null) {
      throw new NotFoundException('Created achievement target was not found.');
    }

    return mapAchievementTarget(row);
  }

  async updateAchievementTarget(
    currentUser: AuthenticatedUserContext,
    targetId: string,
    body: UpdateAchievementTargetDto,
  ): Promise<AccountTargetResponseDto> {
    const updated = await this.targetsDataService.updateAchievementTargetForUser(
      currentUser.userId,
      targetId,
      {
        status: body.status,
        priority: body.priority,
        notes: body.notes,
        dueDate: body.dueDate,
      },
    );

    if (updated === null) {
      throw new NotFoundException('Achievement target was not found.');
    }

    const row = await this.targetsDataService.findAchievementTargetByIdForUser(
      currentUser.userId,
      updated.id,
    );

    if (row === null) {
      throw new NotFoundException('Achievement target was not found.');
    }

    return mapAchievementTarget(row);
  }

  async archiveAchievementTarget(
    currentUser: AuthenticatedUserContext,
    targetId: string,
  ): Promise<AccountTargetResponseDto> {
    return this.updateAchievementTarget(currentUser, targetId, {
      status: TargetStatusDto.Archived,
    });
  }
}

export function mapGameTarget(row: GameTargetRow): AccountTargetResponseDto {
  const totalAchievements =
    row.achievementMetadataCount > 0
      ? row.achievementMetadataCount
      : row.profileGame?.totalAchievements ?? 0;
  const unlockedAchievements = row.profileGame?.unlockedAchievements ?? 0;
  const achievementDataState = getAchievementDataState(
    row.achievementMetadataCount,
    row.knownUnlockStateCount,
  );

  return {
    id: row.target.id,
    type: TargetResponseTypeDto.Game,
    status: row.target.status as TargetStatusDto,
    priority: row.target.priority as TargetPriorityDto,
    notes: row.target.notes,
    targetCompletionPercentage: row.target.targetCompletionPercentage,
    dueDate: row.target.dueDate,
    createdAt: row.target.createdAt.toISOString(),
    updatedAt: row.target.updatedAt.toISOString(),
    game: {
      id: row.game.id,
      steamAppId: row.game.steamAppId,
      name: row.game.name,
      iconUrl: row.game.iconUrl,
      logoUrl: row.game.logoUrl,
      totalAchievements,
      unlockedAchievements,
      remainingAchievements:
        achievementDataState === 'metadata_only'
          ? 0
          : Math.max(totalAchievements - unlockedAchievements, 0),
      completionPercentage: row.profileGame?.completionPercentage ?? 0,
      achievementDataState,
    },
    achievement: null,
  };
}

export function mapAchievementTarget(
  row: AchievementTargetRow,
): AccountTargetResponseDto {
  return {
    id: row.target.id,
    type: TargetResponseTypeDto.Achievement,
    status: row.target.status as TargetStatusDto,
    priority: row.target.priority as TargetPriorityDto,
    notes: row.target.notes,
    targetCompletionPercentage: null,
    dueDate: row.target.dueDate,
    createdAt: row.target.createdAt.toISOString(),
    updatedAt: row.target.updatedAt.toISOString(),
    game: {
      id: row.game.id,
      steamAppId: row.game.steamAppId,
      name: row.game.name,
      iconUrl: row.game.iconUrl,
      logoUrl: row.game.logoUrl,
      totalAchievements: 0,
      unlockedAchievements: 0,
      remainingAchievements: 0,
      completionPercentage: 0,
      achievementDataState: 'not_synced',
    },
    achievement: {
      id: row.achievement.id,
      steamAppId: row.achievement.steamAppId,
      apiName: row.achievement.apiName,
      displayName: row.achievement.displayName,
      description: row.achievement.description,
      iconUrl: row.achievement.iconUrl,
      iconGrayUrl: row.achievement.iconGrayUrl,
      globalPercentage: row.achievement.globalPercentage,
      hidden: row.achievement.hidden,
      unlockState: getAchievementUnlockState(row),
      unlockedAt: toIsoOrNull(row.profileAchievement?.unlockedAt ?? null),
    },
  };
}

function requireLinkedSteamProfile(currentUser: AuthenticatedUserContext): string {
  if (currentUser.steamAccount === null) {
    throw new BadRequestException('A linked Steam profile is required.');
  }

  return currentUser.steamAccount.steamProfileId;
}

function getAchievementDataState(
  achievementMetadataCount: number,
  knownUnlockStateCount: number,
): AchievementDataState {
  if (achievementMetadataCount > 0 && knownUnlockStateCount > 0) {
    return 'unlock_state_synced';
  }

  if (achievementMetadataCount > 0) {
    return 'metadata_only';
  }

  return 'not_synced';
}

function getAchievementUnlockState(
  row: AchievementTargetRow,
): TargetAchievementUnlockStateDto {
  if (row.profileAchievement === null) {
    return TargetAchievementUnlockStateDto.Unknown;
  }

  return row.profileAchievement.achieved
    ? TargetAchievementUnlockStateDto.Unlocked
    : TargetAchievementUnlockStateDto.Locked;
}

function compareTargets(
  left: AccountTargetResponseDto,
  right: AccountTargetResponseDto,
): number {
  const priorityDelta =
    priorityRank(left.priority) - priorityRank(right.priority);

  if (priorityDelta !== 0) {
    return priorityDelta;
  }

  const dueDelta = dueDateRank(left.dueDate) - dueDateRank(right.dueDate);

  if (dueDelta !== 0) {
    return dueDelta;
  }

  return right.createdAt.localeCompare(left.createdAt);
}

function priorityRank(priority: TargetPriority): number {
  switch (priority) {
    case 'high':
      return 0;
    case 'medium':
      return 1;
    case 'low':
    default:
      return 2;
  }
}

function dueDateRank(value: string | null): number {
  return value === null ? Number.MAX_SAFE_INTEGER : Date.parse(value);
}

function toIsoOrNull(value: Date | null): string | null {
  return value === null ? null : value.toISOString();
}
