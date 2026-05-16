import { Injectable } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';

import { DatabaseService } from '../database.service';
import { achievements, games, profileAchievements } from '../schema';

export interface SyncedAchievementInput {
  apiName: string;
  displayName: string | null;
  description: string | null;
  iconUrl: string | null;
  iconGrayUrl: string | null;
  globalPercentage: number | null;
  hidden: boolean;
}

export interface SyncedProfileAchievementInput {
  apiName: string;
  achieved: boolean;
  unlockedAt: Date | null;
}

export interface ApplyGameAchievementSyncInput {
  profileId: string;
  steamAppId: number;
  achievements: SyncedAchievementInput[];
  profileAchievements?: SyncedProfileAchievementInput[];
  lastSyncedAt: Date;
}

export interface ApplyGameAchievementSyncResult {
  achievementsSynced: number;
  profileAchievementsSynced: number;
  progress: AchievementProgressResult;
}

export interface ApplyGameAchievementMetadataInput {
  steamAppId: number;
  achievements: SyncedAchievementInput[];
}

export interface ApplyGameAchievementMetadataResult {
  achievementsSynced: number;
}

export interface AchievementProgressResult extends Record<string, unknown> {
  totalAchievements: number;
  unlockedAchievements: number;
  completionPercentage: number;
}

@Injectable()
export class AchievementSyncRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async applyGameAchievementMetadata(
    input: ApplyGameAchievementMetadataInput,
  ): Promise<ApplyGameAchievementMetadataResult> {
    return this.databaseService.db.transaction(async (tx) => {
      for (const achievement of input.achievements) {
        await tx
          .insert(achievements)
          .values({
            steamAppId: input.steamAppId,
            apiName: achievement.apiName,
            displayName: achievement.displayName,
            description: achievement.description,
            iconUrl: achievement.iconUrl,
            iconGrayUrl: achievement.iconGrayUrl,
            globalPercentage: achievement.globalPercentage,
            hidden: achievement.hidden,
          })
          .onConflictDoUpdate({
            target: [achievements.steamAppId, achievements.apiName],
            set: {
              displayName: achievement.displayName,
              description: achievement.description,
              iconUrl: achievement.iconUrl,
              iconGrayUrl: achievement.iconGrayUrl,
              globalPercentage: achievement.globalPercentage,
              hidden: achievement.hidden,
              updatedAt: sql`now()`,
            },
          });
      }

      await tx
        .update(games)
        .set({
          hasAchievements: input.achievements.length > 0,
          updatedAt: sql`now()`,
        })
        .where(eq(games.steamAppId, input.steamAppId));

      return {
        achievementsSynced: input.achievements.length,
      };
    });
  }

  async applyGameAchievementSync(
    input: ApplyGameAchievementSyncInput,
  ): Promise<ApplyGameAchievementSyncResult> {
    return this.databaseService.db.transaction(async (tx) => {
      const achievementIdByApiName = new Map<string, string>();

      for (const achievement of input.achievements) {
        const rows = await tx
          .insert(achievements)
          .values({
            steamAppId: input.steamAppId,
            apiName: achievement.apiName,
            displayName: achievement.displayName,
            description: achievement.description,
            iconUrl: achievement.iconUrl,
            iconGrayUrl: achievement.iconGrayUrl,
            globalPercentage: achievement.globalPercentage,
            hidden: achievement.hidden,
          })
          .onConflictDoUpdate({
            target: [achievements.steamAppId, achievements.apiName],
            set: {
              displayName: achievement.displayName,
              description: achievement.description,
              iconUrl: achievement.iconUrl,
              iconGrayUrl: achievement.iconGrayUrl,
              globalPercentage: achievement.globalPercentage,
              hidden: achievement.hidden,
              updatedAt: sql`now()`,
            },
          })
          .returning({ id: achievements.id });

        const row = rows[0];

        if (row !== undefined) {
          achievementIdByApiName.set(achievement.apiName, row.id);
        }
      }

      let profileAchievementsSynced = 0;

      for (const profileAchievement of input.profileAchievements ?? []) {
        const achievementId = achievementIdByApiName.get(profileAchievement.apiName);

        if (achievementId === undefined) {
          continue;
        }

        await tx
          .insert(profileAchievements)
          .values({
            profileId: input.profileId,
            achievementId,
            achieved: profileAchievement.achieved,
            unlockedAt: profileAchievement.unlockedAt,
            lastSyncedAt: input.lastSyncedAt,
          })
          .onConflictDoUpdate({
            target: [
              profileAchievements.profileId,
              profileAchievements.achievementId,
            ],
            set: {
              achieved: profileAchievement.achieved,
              unlockedAt: profileAchievement.unlockedAt,
              lastSyncedAt: input.lastSyncedAt,
              updatedAt: sql`now()`,
            },
          });
        profileAchievementsSynced += 1;
      }

      const progressRows = await tx.execute<AchievementProgressResult>(sql`
        SELECT
          total_achievements AS "totalAchievements",
          unlocked_achievements AS "unlockedAchievements",
          completion_percentage::float AS "completionPercentage"
        FROM refresh_profile_game_achievement_progress(
          ${input.profileId}::uuid,
          ${input.steamAppId}::integer
        )
      `);
      const progress = progressRows.rows[0];

      return {
        achievementsSynced: input.achievements.length,
        profileAchievementsSynced,
        progress: requireProgressResult(progress),
      };
    });
  }
}

function requireProgressResult(
  progress: AchievementProgressResult | undefined,
): AchievementProgressResult {
  if (progress === undefined) {
    throw new Error('Achievement progress refresh function returned no rows.');
  }

  return progress;
}
