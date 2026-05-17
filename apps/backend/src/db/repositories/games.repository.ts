import { Injectable } from '@nestjs/common';
import { and, asc, desc, eq, ilike, sql } from 'drizzle-orm';
import type { InferInsertModel, InferSelectModel, SQL } from 'drizzle-orm';

import { DatabaseService } from '../database.service';
import { games, profileGames } from '../schema';

export type Game = InferSelectModel<typeof games>;
export type NewGame = InferInsertModel<typeof games>;

export type UpsertGameInput = Pick<NewGame, 'steamAppId' | 'name'> &
  Partial<Pick<NewGame, 'iconUrl' | 'logoUrl' | 'hasAchievements'>>;

export type UpsertOwnedGameInput = Pick<
  NewGame,
  'steamAppId' | 'name' | 'iconUrl' | 'logoUrl'
>;

export type GlobalGameSort =
  | 'name'
  | 'tracked_players'
  | 'completion_rate'
  | 'achievements'
  | 'playtime';
export type SortOrder = 'asc' | 'desc';

export interface GlobalGameFilters {
  search?: string;
  hasAchievements?: boolean;
  sort?: GlobalGameSort;
  order?: SortOrder;
  limit: number;
  offset: number;
}

export interface GlobalGameStats {
  trackedPlayers: number;
  completedPlayers: number;
  totalAchievements: number;
  averageCompletionPercentage: number;
  totalPlaytimeMinutes: number;
  averagePlaytimeMinutes: number;
}

export interface GlobalGameListRow extends GlobalGameStats {
  game: Game;
}

@Injectable()
export class GamesRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async findBySteamAppId(steamAppId: number): Promise<Game | null> {
    const rows = await this.databaseService.db
      .select()
      .from(games)
      .where(eq(games.steamAppId, steamAppId))
      .limit(1);

    return rows[0] ?? null;
  }

  async findById(id: string): Promise<Game | null> {
    const rows = await this.databaseService.db
      .select()
      .from(games)
      .where(eq(games.id, id))
      .limit(1);

    return rows[0] ?? null;
  }

  async upsertGame(input: UpsertGameInput): Promise<Game> {
    const rows = await this.databaseService.db
      .insert(games)
      .values(input)
      .onConflictDoUpdate({
        target: games.steamAppId,
        set: {
          name: input.name,
          iconUrl: input.iconUrl,
          logoUrl: input.logoUrl,
          hasAchievements: input.hasAchievements,
          updatedAt: sql`now()`,
        },
      })
      .returning();

    return rows[0];
  }

  async upsertOwnedGame(input: UpsertOwnedGameInput): Promise<Game> {
    const rows = await this.databaseService.db
      .insert(games)
      .values({
        ...input,
        hasAchievements: false,
      })
      .onConflictDoUpdate({
        target: games.steamAppId,
        set: {
          name: input.name,
          iconUrl: input.iconUrl,
          logoUrl: input.logoUrl,
          hasAchievements: games.hasAchievements,
          updatedAt: sql`now()`,
        },
      })
      .returning();

    return rows[0];
  }

  async findGlobalGames(
    filters: GlobalGameFilters,
  ): Promise<GlobalGameListRow[]> {
    const rows = await this.databaseService.db
      .select({
        game: games,
        ...globalGameStatsSelect,
      })
      .from(games)
      .leftJoin(profileGames, eq(profileGames.gameId, games.id))
      .where(and(...this.buildGlobalGameConditions(filters)))
      .groupBy(
        games.id,
        games.steamAppId,
        games.name,
        games.iconUrl,
        games.logoUrl,
        games.hasAchievements,
        games.createdAt,
        games.updatedAt,
      )
      .orderBy(...this.buildGlobalGameOrder(filters))
      .limit(filters.limit)
      .offset(filters.offset);

    return rows;
  }

  async countGlobalGames(
    filters: Pick<GlobalGameFilters, 'search' | 'hasAchievements'>,
  ): Promise<number> {
    const rows = await this.databaseService.db
      .select({ total: sql<number>`cast(count(*) as int)` })
      .from(games)
      .where(and(...this.buildGlobalGameConditions(filters)));

    return rows[0]?.total ?? 0;
  }

  async findGlobalGameBySteamAppId(
    steamAppId: number,
  ): Promise<GlobalGameListRow | null> {
    const rows = await this.databaseService.db
      .select({
        game: games,
        ...globalGameStatsSelect,
      })
      .from(games)
      .leftJoin(profileGames, eq(profileGames.gameId, games.id))
      .where(eq(games.steamAppId, steamAppId))
      .groupBy(
        games.id,
        games.steamAppId,
        games.name,
        games.iconUrl,
        games.logoUrl,
        games.hasAchievements,
        games.createdAt,
        games.updatedAt,
      )
      .limit(1);

    return rows[0] ?? null;
  }

  private buildGlobalGameConditions(
    filters: Pick<GlobalGameFilters, 'search' | 'hasAchievements'>,
  ): SQL[] {
    const conditions: SQL[] = [];

    if (filters.search !== undefined && filters.search.trim().length > 0) {
      conditions.push(ilike(games.name, `%${filters.search.trim()}%`));
    }

    if (filters.hasAchievements !== undefined) {
      conditions.push(eq(games.hasAchievements, filters.hasAchievements));
    }

    return conditions;
  }

  private buildGlobalGameOrder(filters: GlobalGameFilters): SQL[] {
    const sort = filters.sort ?? 'tracked_players';
    const order = filters.order ?? 'desc';
    const direction = order === 'asc' ? asc : desc;

    switch (sort) {
      case 'name':
        return [direction(games.name), asc(games.steamAppId)];
      case 'completion_rate':
        return [
          direction(globalGameStatsSql.averageCompletionPercentage),
          asc(games.name),
        ];
      case 'achievements':
        return [direction(globalGameStatsSql.totalAchievements), asc(games.name)];
      case 'playtime':
        return [
          direction(globalGameStatsSql.totalPlaytimeMinutes),
          asc(games.name),
        ];
      case 'tracked_players':
      default:
        return [direction(globalGameStatsSql.trackedPlayers), asc(games.name)];
    }
  }
}

const globalGameStatsSql = {
  trackedPlayers: sql<number>`cast(count(${profileGames.id}) as int)`,
  completedPlayers: sql<number>`cast(count(${profileGames.id}) filter (where ${profileGames.completionPercentage} = 100) as int)`,
  totalAchievements: sql<number>`cast(coalesce(max(${profileGames.totalAchievements}), 0) as int)`,
  averageCompletionPercentage: sql<number>`cast(coalesce(avg(${profileGames.completionPercentage}), 0) as float)`,
  totalPlaytimeMinutes: sql<number>`cast(coalesce(sum(${profileGames.playtimeMinutes}), 0) as int)`,
  averagePlaytimeMinutes: sql<number>`cast(coalesce(avg(${profileGames.playtimeMinutes}), 0) as float)`,
};

const globalGameStatsSelect = {
  trackedPlayers: globalGameStatsSql.trackedPlayers,
  completedPlayers: globalGameStatsSql.completedPlayers,
  totalAchievements: globalGameStatsSql.totalAchievements,
  averageCompletionPercentage: globalGameStatsSql.averageCompletionPercentage,
  totalPlaytimeMinutes: globalGameStatsSql.totalPlaytimeMinutes,
  averagePlaytimeMinutes: globalGameStatsSql.averagePlaytimeMinutes,
};
