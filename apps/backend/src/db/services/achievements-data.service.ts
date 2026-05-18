import { Injectable } from '@nestjs/common';

import {
  AchievementsRepository,
  type Achievement,
  type GlobalAchievementFilters,
  type UpsertAchievementInput,
} from '../repositories/achievements.repository';

export type {
  Achievement,
  GlobalAchievementFilters,
  GlobalAchievementHiddenFilter,
  GlobalAchievementSort,
  NewAchievement,
  SortOrder,
  UpsertAchievementInput,
} from '../repositories/achievements.repository';

@Injectable()
export class AchievementsDataService {
  constructor(private readonly achievementsRepository: AchievementsRepository) {}

  async findById(id: string): Promise<Achievement | null> {
    return this.achievementsRepository.findById(id);
  }

  async findBySteamAppIdAndApiName(
    steamAppId: number,
    apiName: string,
  ): Promise<Achievement | null> {
    return this.achievementsRepository.findBySteamAppIdAndApiName(
      steamAppId,
      apiName,
    );
  }

  async upsertAchievement(
    input: UpsertAchievementInput,
  ): Promise<Achievement> {
    return this.achievementsRepository.upsertAchievement(input);
  }

  async findByGameSteamAppId(steamAppId: number): Promise<Achievement[]> {
    return this.achievementsRepository.findByGameSteamAppId(steamAppId);
  }

  async findGlobalGameAchievements(
    steamAppId: number,
    filters: GlobalAchievementFilters,
  ): Promise<Achievement[]> {
    return this.achievementsRepository.findGlobalGameAchievements(
      steamAppId,
      filters,
    );
  }

  async countGlobalGameAchievements(
    steamAppId: number,
    filters: Pick<GlobalAchievementFilters, 'search' | 'hidden'>,
  ): Promise<number> {
    return this.achievementsRepository.countGlobalGameAchievements(
      steamAppId,
      filters,
    );
  }
}
