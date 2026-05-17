import { Injectable } from '@nestjs/common';
import { and, asc, eq, inArray } from 'drizzle-orm';
import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';

import { DatabaseService } from '../database.service';
import { achievements, guideAchievements } from '../schema';
import type { Achievement } from './achievements.repository';

export type GuideAchievement = InferSelectModel<typeof guideAchievements>;
export type NewGuideAchievement = InferInsertModel<typeof guideAchievements>;

export interface GuideAchievementWithAchievement {
  mapping: GuideAchievement;
  achievement: Achievement;
}

@Injectable()
export class GuideAchievementsRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async findByGuideId(guideId: string): Promise<GuideAchievementWithAchievement[]> {
    return this.databaseService.db
      .select({
        mapping: guideAchievements,
        achievement: achievements,
      })
      .from(guideAchievements)
      .innerJoin(achievements, eq(achievements.id, guideAchievements.achievementId))
      .where(eq(guideAchievements.guideId, guideId))
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
    guideId: string,
    achievementIds: string[],
  ): Promise<GuideAchievement[]> {
    if (achievementIds.length === 0) {
      return [];
    }

    return this.databaseService.db
      .insert(guideAchievements)
      .values(
        achievementIds.map((achievementId) => ({
          guideId,
          achievementId,
        })),
      )
      .onConflictDoNothing({
        target: [guideAchievements.guideId, guideAchievements.achievementId],
      })
      .returning();
  }

  async remove(guideId: string, achievementId: string): Promise<boolean> {
    const rows = await this.databaseService.db
      .delete(guideAchievements)
      .where(
        and(
          eq(guideAchievements.guideId, guideId),
          eq(guideAchievements.achievementId, achievementId),
        ),
      )
      .returning({ id: guideAchievements.id });

    return rows.length > 0;
  }
}
