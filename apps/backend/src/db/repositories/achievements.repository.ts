import { Injectable } from '@nestjs/common';
import { and, asc, desc, eq, ilike, or, sql } from 'drizzle-orm';
import type { InferInsertModel, InferSelectModel, SQL } from 'drizzle-orm';

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

export type GlobalAchievementHiddenFilter = 'all' | 'visible' | 'hidden';
export type GlobalAchievementSort = 'rarity' | 'name';
export type SortOrder = 'asc' | 'desc';

export interface GlobalAchievementFilters {
  search?: string;
  hidden?: GlobalAchievementHiddenFilter;
  sort?: GlobalAchievementSort;
  order?: SortOrder;
  limit: number;
  offset: number;
}

@Injectable()
export class AchievementsRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async findById(id: string): Promise<Achievement | null> {
    const rows = await this.databaseService.db
      .select()
      .from(achievements)
      .where(eq(achievements.id, id))
      .limit(1);

    return rows[0] ?? null;
  }

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

  async findGlobalGameAchievements(
    steamAppId: number,
    filters: GlobalAchievementFilters,
  ): Promise<Achievement[]> {
    return this.databaseService.db
      .select()
      .from(achievements)
      .where(and(...this.buildGlobalAchievementConditions(steamAppId, filters)))
      .orderBy(...this.buildGlobalAchievementOrder(filters))
      .limit(filters.limit)
      .offset(filters.offset);
  }

  async countGlobalGameAchievements(
    steamAppId: number,
    filters: Pick<GlobalAchievementFilters, 'search' | 'hidden'>,
  ): Promise<number> {
    const rows = await this.databaseService.db
      .select({ total: sql<number>`cast(count(*) as int)` })
      .from(achievements)
      .where(and(...this.buildGlobalAchievementConditions(steamAppId, filters)));

    return rows[0]?.total ?? 0;
  }

  private buildGlobalAchievementConditions(
    steamAppId: number,
    filters: Pick<GlobalAchievementFilters, 'search' | 'hidden'>,
  ): SQL[] {
    const conditions: SQL[] = [eq(achievements.steamAppId, steamAppId)];

    if (filters.search !== undefined && filters.search.trim().length > 0) {
      const search = `%${filters.search.trim()}%`;
      conditions.push(
        or(
          ilike(achievements.apiName, search),
          ilike(achievements.displayName, search),
        ) as SQL,
      );
    }

    switch (filters.hidden) {
      case 'hidden':
        conditions.push(eq(achievements.hidden, true));
        break;
      case 'visible':
        conditions.push(eq(achievements.hidden, false));
        break;
      case 'all':
      case undefined:
        break;
    }

    return conditions;
  }

  private buildGlobalAchievementOrder(filters: GlobalAchievementFilters): SQL[] {
    const sort = filters.sort ?? 'rarity';
    const order = filters.order ?? 'asc';
    const direction = order === 'asc' ? asc : desc;

    switch (sort) {
      case 'name':
        return [
          direction(
            sql<string>`coalesce(${achievements.displayName}, ${achievements.apiName})`,
          ),
          asc(achievements.apiName),
        ];
      case 'rarity':
      default:
        return [
          direction(sql<number>`coalesce(${achievements.globalPercentage}, 101)`),
          asc(achievements.apiName),
        ];
    }
  }
}
