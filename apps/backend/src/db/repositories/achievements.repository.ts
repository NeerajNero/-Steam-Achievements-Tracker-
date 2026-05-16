import { Injectable } from '@nestjs/common';
import { and, asc, eq, sql } from 'drizzle-orm';
import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';

import { DatabaseService } from '../database.service';
import { achievements } from '../schema';

export type Achievement = InferSelectModel<typeof achievements>;
export type NewAchievement = InferInsertModel<typeof achievements>;

export type UpsertAchievementInput = Pick<
  NewAchievement,
  'steamAppId' | 'apiName'
> &
  Partial<
    Pick<
      NewAchievement,
      | 'displayName'
      | 'description'
      | 'iconUrl'
      | 'iconGrayUrl'
      | 'globalPercentage'
      | 'hidden'
    >
  >;

@Injectable()
export class AchievementsRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async findBySteamAppIdAndApiName(
    steamAppId: number,
    apiName: string,
  ): Promise<Achievement | null> {
    const rows = await this.databaseService.db
      .select()
      .from(achievements)
      .where(
        and(
          eq(achievements.steamAppId, steamAppId),
          eq(achievements.apiName, apiName),
        ),
      )
      .limit(1);

    return rows[0] ?? null;
  }

  async upsertAchievement(input: UpsertAchievementInput): Promise<Achievement> {
    const rows = await this.databaseService.db
      .insert(achievements)
      .values(input)
      .onConflictDoUpdate({
        target: [achievements.steamAppId, achievements.apiName],
        set: {
          displayName: input.displayName,
          description: input.description,
          iconUrl: input.iconUrl,
          iconGrayUrl: input.iconGrayUrl,
          globalPercentage: input.globalPercentage,
          hidden: input.hidden,
          updatedAt: sql`now()`,
        },
      })
      .returning();

    return rows[0];
  }

  async findByGameSteamAppId(steamAppId: number): Promise<Achievement[]> {
    return this.databaseService.db
      .select()
      .from(achievements)
      .where(eq(achievements.steamAppId, steamAppId))
      .orderBy(asc(achievements.apiName));
  }
}
