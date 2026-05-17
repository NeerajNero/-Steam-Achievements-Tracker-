import { Injectable } from '@nestjs/common';

import {
  GuideAchievementsRepository,
  type GuideAchievement,
  type GuideAchievementWithAchievement,
  type NewGuideAchievement,
} from '../repositories/guide-achievements.repository';

export type {
  GuideAchievement,
  GuideAchievementWithAchievement,
  NewGuideAchievement,
} from '../repositories/guide-achievements.repository';

@Injectable()
export class GuideAchievementsDataService {
  constructor(
    private readonly guideAchievementsRepository: GuideAchievementsRepository,
  ) {}

  async findByGuideId(
    guideId: string,
  ): Promise<GuideAchievementWithAchievement[]> {
    return this.guideAchievementsRepository.findByGuideId(guideId);
  }

  async findAchievementIdsForSteamApp(
    steamAppId: number,
    achievementIds: string[],
  ): Promise<string[]> {
    return this.guideAchievementsRepository.findAchievementIdsForSteamApp(
      steamAppId,
      achievementIds,
    );
  }

  async addMany(
    guideId: string,
    achievementIds: string[],
  ): Promise<GuideAchievement[]> {
    return this.guideAchievementsRepository.addMany(guideId, achievementIds);
  }

  async remove(guideId: string, achievementId: string): Promise<boolean> {
    return this.guideAchievementsRepository.remove(guideId, achievementId);
  }
}
