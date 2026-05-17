import { Injectable } from '@nestjs/common';
import { and, asc, eq, inArray } from 'drizzle-orm';
import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';

import { DatabaseService } from '../database.service';
import { achievements, gamingSessionAchievements } from '../schema';
import type { Achievement } from './achievements.repository';

export type GamingSessionAchievement = InferSelectModel<
  typeof gamingSessionAchievements
>;
export type NewGamingSessionAchievement = InferInsertModel<
  typeof gamingSessionAchievements
>;

export interface SessionAchievementWithAchievement {
  mapping: GamingSessionAchievement;
  achievement: Achievement;
}

@Injectable()
export class GamingSessionAchievementsRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async findBySessionId(
    sessionId: string,
  ): Promise<SessionAchievementWithAchievement[]> {
    return this.databaseService.db
      .select({
        mapping: gamingSessionAchievements,
        achievement: achievements,
      })
      .from(gamingSessionAchievements)
      .innerJoin(
        achievements,
        eq(achievements.id, gamingSessionAchievements.achievementId),
      )
      .where(eq(gamingSessionAchievements.sessionId, sessionId))
      .orderBy(asc(achievements.globalPercentage), asc(achievements.apiName));
  }

  async findAchievementIdsForSteamApp(
    steamAppId: number,
    achievementIds: string[],
  ): Promise<string[]> {
    if (achievementIds.length === 0) {
      return [];
    }

    const rows = await this.databaseService.db
      .select({ id: achievements.id })
      .from(achievements)
      .where(
        and(
          eq(achievements.steamAppId, steamAppId),
          inArray(achievements.id, achievementIds),
        ),
      );

    return rows.map((row) => row.id);
  }

  async addMany(
    sessionId: string,
    achievementIds: string[],
  ): Promise<GamingSessionAchievement[]> {
    if (achievementIds.length === 0) {
      return [];
    }

    return this.databaseService.db
      .insert(gamingSessionAchievements)
      .values(
        achievementIds.map((achievementId) => ({
          sessionId,
          achievementId,
        })),
      )
      .onConflictDoNothing({
        target: [
          gamingSessionAchievements.sessionId,
          gamingSessionAchievements.achievementId,
        ],
      })
      .returning();
  }

  async remove(sessionId: string, achievementId: string): Promise<boolean> {
    const rows = await this.databaseService.db
      .delete(gamingSessionAchievements)
      .where(
        and(
          eq(gamingSessionAchievements.sessionId, sessionId),
          eq(gamingSessionAchievements.achievementId, achievementId),
        ),
      )
      .returning({ id: gamingSessionAchievements.id });

    return rows.length > 0;
  }
}
