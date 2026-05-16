import { Injectable } from '@nestjs/common';

import {
  AchievementsRepository,
  type Achievement,
  type UpsertAchievementInput,
} from '../repositories/achievements.repository';

export type {
  Achievement,
  NewAchievement,
  UpsertAchievementInput,
} from '../repositories/achievements.repository';

@Injectable()
export class AchievementsDataService {
  constructor(private readonly achievementsRepository: AchievementsRepository) {}

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
}
