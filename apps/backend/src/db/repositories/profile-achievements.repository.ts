import { Injectable } from '@nestjs/common';
import {
  and,
  asc,
  desc,
  eq,
  isNotNull,
  isNull,
  or,
  sql,
} from 'drizzle-orm';
import type { InferInsertModel, InferSelectModel, SQL } from 'drizzle-orm';

import { DatabaseService } from '../database.service';
import { achievements, profileAchievements } from '../schema';
import type { Achievement } from './achievements.repository';

export type ProfileAchievement = InferSelectModel<typeof profileAchievements>;
export type NewProfileAchievement = InferInsertModel<typeof profileAchievements>;

export type UpsertProfileAchievementInput = Pick<
  NewProfileAchievement,
  'profileId' | 'achievementId'
> &
  Partial<Pick<NewProfileAchievement, 'achieved' | 'unlockedAt' | 'lastSyncedAt'>>;

export interface RarestUnlockedAchievement {
  profileAchievement: ProfileAchievement;
  achievement: {
    id: string;
    steamAppId: number;
    apiName: string;
    displayName: string | null;
    description: string | null;
    iconUrl: string | null;
    iconGrayUrl: string | null;
    globalPercentage: number | null;
    hidden: boolean;
  };
}

export type AchievementStatusFilter = 'all' | 'unlocked' | 'locked';
export type AchievementSort = 'rarity' | 'unlocked_at' | 'name';
export type SortOrder = 'asc' | 'desc';

export interface AchievementUnlockStateFilters {
  status?: AchievementStatusFilter;
  sort?: AchievementSort;
  order?: SortOrder;
}

export interface AchievementWithUnlockState {
  achievement: Achievement;
  profileAchievement: ProfileAchievement | null;
}

@Injectable()
export class ProfileAchievementsRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async upsertProfileAchievement(
    input: UpsertProfileAchievementInput,
  ): Promise<ProfileAchievement> {
    const rows = await this.databaseService.db
      .insert(profileAchievements)
      .values(input)
      .onConflictDoUpdate({
        target: [profileAchievements.profileId, profileAchievements.achievementId],
        set: {
          achieved: input.achieved,
          unlockedAt: input.unlockedAt,
          lastSyncedAt: input.lastSyncedAt,
          updatedAt: sql`now()`,
        },
      })
      .returning();

    return rows[0];
  }

  async findByProfileAndAchievement(
    profileId: string,
    achievementId: string,
  ): Promise<ProfileAchievement | null> {
    const rows = await this.databaseService.db
      .select()
      .from(profileAchievements)
      .where(
        and(
          eq(profileAchievements.profileId, profileId),
          eq(profileAchievements.achievementId, achievementId),
        ),
      )
      .limit(1);

    return rows[0] ?? null;
  }

  async findUnlockedByProfile(
    profileId: string,
    limit?: number,
  ): Promise<ProfileAchievement[]> {
    const query = this.databaseService.db
      .select()
      .from(profileAchievements)
      .where(
        and(
          eq(profileAchievements.profileId, profileId),
          eq(profileAchievements.achieved, true),
        ),
      )
      .orderBy(desc(profileAchievements.unlockedAt), asc(profileAchievements.id));

    return limit === undefined ? query : query.limit(limit);
  }

  async findRarestUnlockedByProfile(
    profileId: string,
    limit: number,
  ): Promise<RarestUnlockedAchievement[]> {
    return this.databaseService.db
      .select({
        profileAchievement: profileAchievements,
        achievement: {
          id: achievements.id,
          steamAppId: achievements.steamAppId,
          apiName: achievements.apiName,
          displayName: achievements.displayName,
          description: achievements.description,
          iconUrl: achievements.iconUrl,
          iconGrayUrl: achievements.iconGrayUrl,
          globalPercentage: achievements.globalPercentage,
          hidden: achievements.hidden,
        },
      })
      .from(profileAchievements)
      .innerJoin(
        achievements,
        eq(profileAchievements.achievementId, achievements.id),
      )
      .where(
        and(
          eq(profileAchievements.profileId, profileId),
          eq(profileAchievements.achieved, true),
          isNotNull(achievements.globalPercentage),
        ),
      )
      .orderBy(asc(achievements.globalPercentage), asc(achievements.apiName))
      .limit(limit);
  }

  async findAchievementsWithUnlockState(
    profileId: string,
    steamAppId: number,
    filters: AchievementUnlockStateFilters = {},
  ): Promise<AchievementWithUnlockState[]> {
    return this.databaseService.db
      .select({
        achievement: achievements,
        profileAchievement: profileAchievements,
      })
      .from(achievements)
      .leftJoin(
        profileAchievements,
        and(
          eq(profileAchievements.achievementId, achievements.id),
          eq(profileAchievements.profileId, profileId),
        ),
      )
      .where(and(...this.buildUnlockStateConditions(steamAppId, filters)))
      .orderBy(...this.buildUnlockStateOrder(filters));
  }

  private buildUnlockStateConditions(
    steamAppId: number,
    filters: Pick<AchievementUnlockStateFilters, 'status'>,
  ): SQL[] {
    const conditions: SQL[] = [eq(achievements.steamAppId, steamAppId)];

    switch (filters.status) {
      case 'unlocked':
        conditions.push(eq(profileAchievements.achieved, true));
        break;
      case 'locked':
        conditions.push(
          or(
            isNull(profileAchievements.id),
            eq(profileAchievements.achieved, false),
          ) as SQL,
        );
        break;
      case 'all':
      case undefined:
        break;
    }

    return conditions;
  }

  private buildUnlockStateOrder(
    filters: AchievementUnlockStateFilters,
  ): SQL[] {
    const sort = filters.sort ?? 'rarity';
    const order = filters.order ?? 'asc';
    const direction = order === 'asc' ? asc : desc;

    switch (sort) {
      case 'unlocked_at':
        return [direction(profileAchievements.unlockedAt), asc(achievements.apiName)];
      case 'name':
        return [
          direction(sql<string>`coalesce(${achievements.displayName}, ${achievements.apiName})`),
          asc(achievements.apiName),
        ];
      case 'rarity':
      default:
        return [direction(achievements.globalPercentage), asc(achievements.apiName)];
    }
  }
}
