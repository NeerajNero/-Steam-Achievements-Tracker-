import { Injectable } from '@nestjs/common';

import {
  TargetsRepository,
  type AchievementTarget,
  type AchievementTargetRow,
  type CreateAchievementTargetInput,
  type CreateGameTargetInput,
  type GameTarget,
  type GameTargetRow,
  type NewAchievementTarget,
  type NewGameTarget,
  type TargetListFilters,
  type TargetListType,
  type TargetPriority,
  type TargetStatus,
  type UpdateAchievementTargetInput,
  type UpdateGameTargetInput,
} from '../repositories/targets.repository';

export type {
  AchievementTarget,
  AchievementTargetRow,
  CreateAchievementTargetInput,
  CreateGameTargetInput,
  GameTarget,
  GameTargetRow,
  NewAchievementTarget,
  NewGameTarget,
  TargetListFilters,
  TargetListType,
  TargetPriority,
  TargetStatus,
  UpdateAchievementTargetInput,
  UpdateGameTargetInput,
} from '../repositories/targets.repository';

@Injectable()
export class TargetsDataService {
  constructor(private readonly targetsRepository: TargetsRepository) {}

  async upsertGameTarget(input: CreateGameTargetInput): Promise<GameTarget> {
    return this.targetsRepository.upsertGameTarget(input);
  }

  async upsertAchievementTarget(
    input: CreateAchievementTargetInput,
  ): Promise<AchievementTarget> {
    return this.targetsRepository.upsertAchievementTarget(input);
  }

  async findGameTargetsByUser(
    userId: string,
    filters: TargetListFilters & { targetId?: string },
  ): Promise<GameTargetRow[]> {
    return this.targetsRepository.findGameTargetsByUser(userId, filters);
  }

  async findAchievementTargetsByUser(
    userId: string,
    filters: TargetListFilters & { targetId?: string },
  ): Promise<AchievementTargetRow[]> {
    return this.targetsRepository.findAchievementTargetsByUser(userId, filters);
  }

  async countGameTargetsByUser(
    userId: string,
    filters: Pick<TargetListFilters, 'status'>,
  ): Promise<number> {
    return this.targetsRepository.countGameTargetsByUser(userId, filters);
  }

  async countAchievementTargetsByUser(
    userId: string,
    filters: Pick<TargetListFilters, 'status'>,
  ): Promise<number> {
    return this.targetsRepository.countAchievementTargetsByUser(userId, filters);
  }

  async findGameTargetByIdForUser(
    userId: string,
    targetId: string,
  ): Promise<GameTargetRow | null> {
    return this.targetsRepository.findGameTargetByIdForUser(userId, targetId);
  }

  async findAchievementTargetByIdForUser(
    userId: string,
    targetId: string,
  ): Promise<AchievementTargetRow | null> {
    return this.targetsRepository.findAchievementTargetByIdForUser(
      userId,
      targetId,
    );
  }

  async findActiveGameTargetsForDashboard(
    userId: string,
    limit: number,
  ): Promise<GameTargetRow[]> {
    return this.targetsRepository.findActiveGameTargetsForDashboard(userId, limit);
  }

  async findActiveAchievementTargetsForDashboard(
    userId: string,
    limit: number,
  ): Promise<AchievementTargetRow[]> {
    return this.targetsRepository.findActiveAchievementTargetsForDashboard(
      userId,
      limit,
    );
  }

  async updateGameTargetForUser(
    userId: string,
    targetId: string,
    input: UpdateGameTargetInput,
  ): Promise<GameTarget | null> {
    return this.targetsRepository.updateGameTargetForUser(userId, targetId, input);
  }

  async updateAchievementTargetForUser(
    userId: string,
    targetId: string,
    input: UpdateAchievementTargetInput,
  ): Promise<AchievementTarget | null> {
    return this.targetsRepository.updateAchievementTargetForUser(
      userId,
      targetId,
      input,
    );
  }
}
