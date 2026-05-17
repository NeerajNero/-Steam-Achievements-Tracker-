import { Injectable } from '@nestjs/common';

import {
  GamingSessionAchievementsRepository,
  type GamingSessionAchievement,
  type SessionAchievementWithAchievement,
} from '../repositories/gaming-session-achievements.repository';

export type {
  GamingSessionAchievement,
  SessionAchievementWithAchievement,
} from '../repositories/gaming-session-achievements.repository';

@Injectable()
export class GamingSessionAchievementsDataService {
  constructor(
    private readonly gamingSessionAchievementsRepository: GamingSessionAchievementsRepository,
  ) {}

  async findBySessionId(
    sessionId: string,
  ): Promise<SessionAchievementWithAchievement[]> {
    return this.gamingSessionAchievementsRepository.findBySessionId(sessionId);
  }

  async findAchievementIdsForSteamApp(
    steamAppId: number,
    achievementIds: string[],
  ): Promise<string[]> {
    return this.gamingSessionAchievementsRepository.findAchievementIdsForSteamApp(
      steamAppId,
      achievementIds,
    );
  }

  async addMany(
    sessionId: string,
    achievementIds: string[],
  ): Promise<GamingSessionAchievement[]> {
    return this.gamingSessionAchievementsRepository.addMany(
      sessionId,
      achievementIds,
    );
  }

  async remove(sessionId: string, achievementId: string): Promise<boolean> {
    return this.gamingSessionAchievementsRepository.remove(sessionId, achievementId);
  }
}
