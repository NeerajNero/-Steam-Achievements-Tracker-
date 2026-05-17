import { Injectable } from '@nestjs/common';
import {
  and,
  asc,
  desc,
  eq,
  gt,
  gte,
  ilike,
  inArray,
  lt,
  lte,
  sql,
} from 'drizzle-orm';
import type { InferInsertModel, InferSelectModel, SQL } from 'drizzle-orm';

import { DatabaseService } from '../database.service';
import {
  achievements,
  games,
  profileAchievements,
  profileGames,
  publicProfiles,
  steamProfiles,
} from '../schema';
import type { Game } from './games.repository';

export type ProfileGame = InferSelectModel<typeof profileGames>;
export type NewProfileGame = InferInsertModel<typeof profileGames>;

export type UpsertProfileGameInput = Pick<NewProfileGame, 'profileId' | 'gameId'> &
  Partial<
    Pick<
      NewProfileGame,
      | 'playtimeMinutes'
      | 'playtimeTwoWeeksMinutes'
      | 'totalAchievements'
      | 'unlockedAchievements'
      | 'completionPercentage'
      | 'lastPlayedAt'
      | 'lastSyncedAt'
    >
  >;

export interface ProfileGameFilters {
  minCompletionPercentage?: number;
  maxCompletionPercentage?: number;
  completedOnly?: boolean;
}

export interface ProfileGameSummary {
  totalGames: number;
  completedGames: number;
  totalAchievements: number;
  unlockedAchievements: number;
}

export type GameLibraryStatus =
  | 'all'
  | 'completed'
  | 'incomplete'
  | 'no_achievements';
export type GameLibrarySort =
  | 'name'
  | 'completion'
  | 'playtime'
  | 'recently_played'
  | 'remaining';
export type SortOrder = 'asc' | 'desc';

export interface GameLibraryFilters {
  search?: string;
  status?: GameLibraryStatus;
  sort?: GameLibrarySort;
  order?: SortOrder;
  limit: number;
  offset: number;
}

export interface ProfileGameWithGame {
  profileGame: ProfileGame;
  game: Game;
  achievementMetadataCount?: number;
  knownUnlockStateCount?: number;
}

export type UpsertOwnedGameProgressInput = Pick<
  NewProfileGame,
  'profileId' | 'gameId' | 'playtimeMinutes' | 'playtimeTwoWeeksMinutes'
> &
  Partial<Pick<NewProfileGame, 'lastPlayedAt' | 'lastSyncedAt'>>;

export type UpsertRecentGameProgressInput = Pick<
  NewProfileGame,
  'profileId' | 'gameId' | 'playtimeMinutes' | 'playtimeTwoWeeksMinutes'
> &
  Partial<Pick<NewProfileGame, 'lastPlayedAt' | 'lastSyncedAt'>>;

export type GlobalGamePlayerStatus = 'all' | 'completed' | 'incomplete';
export type GlobalGamePlayerSort = 'completion' | 'playtime' | 'recently_played';

export interface GlobalGamePlayerFilters {
  status?: GlobalGamePlayerStatus;
  sort?: GlobalGamePlayerSort;
  order?: SortOrder;
  limit: number;
  offset: number;
}

export interface PublicTrackedPlayerForGame {
  steamId: string;
  personaName: string | null;
  avatarUrl: string | null;
  profileUrl: string | null;
  playtimeMinutes: number;
  playtimeTwoWeeksMinutes: number;
  totalAchievements: number;
  unlockedAchievements: number;
  completionPercentage: number;
  lastPlayedAt: Date | null;
  publicSlug: string | null;
}

@Injectable()
export class ProfileGamesRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async upsertProfileGame(input: UpsertProfileGameInput): Promise<ProfileGame> {
    const rows = await this.databaseService.db
      .insert(profileGames)
      .values(input)
      .onConflictDoUpdate({
        target: [profileGames.profileId, profileGames.gameId],
        set: {
          playtimeMinutes: input.playtimeMinutes,
          playtimeTwoWeeksMinutes: input.playtimeTwoWeeksMinutes,
          totalAchievements: input.totalAchievements,
          unlockedAchievements: input.unlockedAchievements,
          completionPercentage: input.completionPercentage,
          lastPlayedAt: input.lastPlayedAt,
          lastSyncedAt: input.lastSyncedAt,
          updatedAt: sql`now()`,
        },
      })
      .returning();

    return rows[0];
  }

  async upsertOwnedGameProgressPreservingAchievementStats(
    input: UpsertOwnedGameProgressInput,
  ): Promise<ProfileGame> {
    const rows = await this.databaseService.db
      .insert(profileGames)
      .values({
        ...input,
        totalAchievements: 0,
        unlockedAchievements: 0,
        completionPercentage: 0,
      })
      .onConflictDoUpdate({
        target: [profileGames.profileId, profileGames.gameId],
        set: {
          playtimeMinutes: input.playtimeMinutes,
          playtimeTwoWeeksMinutes: input.playtimeTwoWeeksMinutes,
          lastPlayedAt: input.lastPlayedAt,
          lastSyncedAt: input.lastSyncedAt,
          updatedAt: sql`now()`,
        },
      })
      .returning();

    return rows[0];
  }

  async upsertRecentGameProgressPreservingAchievementStats(
    input: UpsertRecentGameProgressInput,
  ): Promise<ProfileGame> {
    const rows = await this.databaseService.db
      .insert(profileGames)
      .values({
        ...input,
        totalAchievements: 0,
        unlockedAchievements: 0,
        completionPercentage: 0,
      })
      .onConflictDoUpdate({
        target: [profileGames.profileId, profileGames.gameId],
        set: {
          playtimeMinutes: input.playtimeMinutes,
          playtimeTwoWeeksMinutes: input.playtimeTwoWeeksMinutes,
          ...(input.lastPlayedAt === undefined || input.lastPlayedAt === null
            ? {}
            : { lastPlayedAt: input.lastPlayedAt }),
          lastSyncedAt: input.lastSyncedAt,
          updatedAt: sql`now()`,
        },
      })
      .returning();

    return rows[0];
  }

  async findByProfileId(
    profileId: string,
    filters: ProfileGameFilters = {},
  ): Promise<ProfileGame[]> {
    const conditions: SQL[] = [eq(profileGames.profileId, profileId)];

    if (filters.minCompletionPercentage !== undefined) {
      conditions.push(
        gte(profileGames.completionPercentage, filters.minCompletionPercentage),
      );
    }

    if (filters.maxCompletionPercentage !== undefined) {
      conditions.push(
        lte(profileGames.completionPercentage, filters.maxCompletionPercentage),
      );
    }

    if (filters.completedOnly === true) {
      conditions.push(eq(profileGames.completionPercentage, 100));
    }

    return this.databaseService.db
      .select()
      .from(profileGames)
      .where(and(...conditions))
      .orderBy(desc(profileGames.completionPercentage), asc(profileGames.id));
  }

  async findNearestCompletions(
    profileId: string,
    limit: number,
  ): Promise<ProfileGame[]> {
    return this.databaseService.db
      .select()
      .from(profileGames)
      .where(
        and(
          eq(profileGames.profileId, profileId),
          gt(profileGames.totalAchievements, 0),
          lte(profileGames.completionPercentage, 99.99),
        ),
      )
      .orderBy(
        desc(profileGames.completionPercentage),
        asc(
          sql<number>`${profileGames.totalAchievements} - ${profileGames.unlockedAchievements}`,
        ),
      )
      .limit(limit);
  }

  async findNearestCompletionsWithGames(
    profileId: string,
    limit: number,
  ): Promise<ProfileGameWithGame[]> {
    return this.databaseService.db
      .select({
        profileGame: profileGames,
        game: games,
        ...achievementStateCountSelect,
      })
      .from(profileGames)
      .innerJoin(games, eq(profileGames.gameId, games.id))
      .where(
        and(
          eq(profileGames.profileId, profileId),
          gt(profileGames.totalAchievements, 0),
          lt(profileGames.completionPercentage, 100),
        ),
      )
      .orderBy(
        desc(profileGames.completionPercentage),
        asc(
          sql<number>`${profileGames.totalAchievements} - ${profileGames.unlockedAchievements}`,
        ),
        asc(games.name),
      )
      .limit(limit);
  }

  async findProfileGameBySteamAppId(
    profileId: string,
    steamAppId: number,
  ): Promise<ProfileGameWithGame | null> {
    const rows = await this.databaseService.db
      .select({
        profileGame: profileGames,
        game: games,
        ...achievementStateCountSelect,
      })
      .from(profileGames)
      .innerJoin(games, eq(profileGames.gameId, games.id))
      .where(
        and(
          eq(profileGames.profileId, profileId),
          eq(games.steamAppId, steamAppId),
        ),
      )
      .limit(1);

    return rows[0] ?? null;
  }

  async findProfileGamesForAchievementSync(
    profileId: string,
    steamAppIds?: number[],
  ): Promise<ProfileGameWithGame[]> {
    const conditions: SQL[] = [eq(profileGames.profileId, profileId)];

    if (steamAppIds !== undefined) {
      conditions.push(inArray(games.steamAppId, steamAppIds));
    }

    return this.databaseService.db
      .select({
        profileGame: profileGames,
        game: games,
        ...achievementStateCountSelect,
      })
      .from(profileGames)
      .innerJoin(games, eq(profileGames.gameId, games.id))
      .where(and(...conditions))
      .orderBy(asc(games.steamAppId));
  }

  async findLibraryByProfileId(
    profileId: string,
    filters: GameLibraryFilters,
  ): Promise<ProfileGameWithGame[]> {
    return this.databaseService.db
      .select({
        profileGame: profileGames,
        game: games,
        ...achievementStateCountSelect,
      })
      .from(profileGames)
      .innerJoin(games, eq(profileGames.gameId, games.id))
      .where(and(...this.buildLibraryConditions(profileId, filters)))
      .orderBy(...this.buildLibraryOrder(filters))
      .limit(filters.limit)
      .offset(filters.offset);
  }

  async countLibraryByProfileId(
    profileId: string,
    filters: Pick<GameLibraryFilters, 'search' | 'status'>,
  ): Promise<number> {
    const rows = await this.databaseService.db
      .select({ total: sql<number>`cast(count(*) as int)` })
      .from(profileGames)
      .innerJoin(games, eq(profileGames.gameId, games.id))
      .where(and(...this.buildLibraryConditions(profileId, filters)));

    return rows[0]?.total ?? 0;
  }

  async getProfileGameSummary(profileId: string): Promise<ProfileGameSummary> {
    const rows = await this.databaseService.db
      .select({
        totalGames: sql<number>`cast(count(*) as int)`,
        completedGames: sql<number>`cast(count(*) filter (where ${profileGames.completionPercentage} = 100) as int)`,
        totalAchievements: sql<number>`cast(coalesce(sum(${profileGames.totalAchievements}), 0) as int)`,
        unlockedAchievements: sql<number>`cast(coalesce(sum(${profileGames.unlockedAchievements}), 0) as int)`,
      })
      .from(profileGames)
      .where(eq(profileGames.profileId, profileId));

    return (
      rows[0] ?? {
        totalGames: 0,
        completedGames: 0,
        totalAchievements: 0,
        unlockedAchievements: 0,
      }
    );
  }

  async getAverageCompletionPercentage(profileId: string): Promise<number> {
    const rows = await this.databaseService.db
      .select({
        averageCompletionPercentage: sql<number>`cast(coalesce(avg(${profileGames.completionPercentage}), 0) as float)`,
      })
      .from(profileGames)
      .where(eq(profileGames.profileId, profileId));

    return rows[0]?.averageCompletionPercentage ?? 0;
  }

  async findPublicTrackedPlayersForGame(
    steamAppId: number,
    filters: GlobalGamePlayerFilters,
  ): Promise<PublicTrackedPlayerForGame[]> {
    return this.databaseService.db
      .select({
        steamId: steamProfiles.steamId,
        personaName: steamProfiles.personaName,
        avatarUrl: steamProfiles.avatarUrl,
        profileUrl: steamProfiles.profileUrl,
        playtimeMinutes: profileGames.playtimeMinutes,
        playtimeTwoWeeksMinutes: profileGames.playtimeTwoWeeksMinutes,
        totalAchievements: profileGames.totalAchievements,
        unlockedAchievements: profileGames.unlockedAchievements,
        completionPercentage: profileGames.completionPercentage,
        lastPlayedAt: profileGames.lastPlayedAt,
        publicSlug: publicProfiles.slug,
      })
      .from(profileGames)
      .innerJoin(games, eq(profileGames.gameId, games.id))
      .innerJoin(steamProfiles, eq(profileGames.profileId, steamProfiles.id))
      .leftJoin(
        publicProfiles,
        and(
          eq(publicProfiles.steamProfileId, steamProfiles.id),
          eq(publicProfiles.isPublic, true),
        ),
      )
      .where(and(...this.buildGlobalPlayerConditions(steamAppId, filters)))
      .orderBy(...this.buildGlobalPlayerOrder(filters))
      .limit(filters.limit)
      .offset(filters.offset);
  }

  async countPublicTrackedPlayersForGame(
    steamAppId: number,
    filters: Pick<GlobalGamePlayerFilters, 'status'>,
  ): Promise<number> {
    const rows = await this.databaseService.db
      .select({ total: sql<number>`cast(count(*) as int)` })
      .from(profileGames)
      .innerJoin(games, eq(profileGames.gameId, games.id))
      .where(and(...this.buildGlobalPlayerConditions(steamAppId, filters)));

    return rows[0]?.total ?? 0;
  }

  private buildLibraryConditions(
    profileId: string,
    filters: Pick<GameLibraryFilters, 'search' | 'status'>,
  ): SQL[] {
    const conditions: SQL[] = [eq(profileGames.profileId, profileId)];

    if (filters.search !== undefined && filters.search.trim().length > 0) {
      conditions.push(ilike(games.name, `%${filters.search.trim()}%`));
    }

    switch (filters.status) {
      case 'completed':
        conditions.push(eq(profileGames.completionPercentage, 100));
        break;
      case 'incomplete':
        conditions.push(
          and(
            gt(profileGames.totalAchievements, 0),
            lt(profileGames.completionPercentage, 100),
          ) as SQL,
        );
        break;
      case 'no_achievements':
        conditions.push(eq(profileGames.totalAchievements, 0));
        break;
      case 'all':
      case undefined:
        break;
    }

    return conditions;
  }

  private buildLibraryOrder(filters: GameLibraryFilters): SQL[] {
    const sort = filters.sort ?? 'completion';
    const order = filters.order ?? 'desc';
    const direction = order === 'asc' ? asc : desc;

    switch (sort) {
      case 'name':
        return [direction(games.name), asc(games.steamAppId)];
      case 'playtime':
        return [direction(profileGames.playtimeMinutes), asc(games.name)];
      case 'recently_played':
        return [
          direction(profileGames.playtimeTwoWeeksMinutes),
          direction(profileGames.lastPlayedAt),
          asc(games.name),
        ];
      case 'remaining':
        return [
          direction(
            sql<number>`${profileGames.totalAchievements} - ${profileGames.unlockedAchievements}`,
          ),
          asc(games.name),
        ];
      case 'completion':
      default:
        return [direction(profileGames.completionPercentage), asc(games.name)];
    }
  }

  private buildGlobalPlayerConditions(
    steamAppId: number,
    filters: Pick<GlobalGamePlayerFilters, 'status'>,
  ): SQL[] {
    const conditions: SQL[] = [eq(games.steamAppId, steamAppId)];

    switch (filters.status) {
      case 'completed':
        conditions.push(eq(profileGames.completionPercentage, 100));
        break;
      case 'incomplete':
        conditions.push(lt(profileGames.completionPercentage, 100));
        break;
      case 'all':
      case undefined:
        break;
    }

    return conditions;
  }

  private buildGlobalPlayerOrder(filters: GlobalGamePlayerFilters): SQL[] {
    const sort = filters.sort ?? 'completion';
    const order = filters.order ?? 'desc';
    const direction = order === 'asc' ? asc : desc;

    switch (sort) {
      case 'playtime':
        return [
          direction(profileGames.playtimeMinutes),
          asc(steamProfiles.personaName),
          asc(steamProfiles.steamId),
        ];
      case 'recently_played':
        return [
          direction(profileGames.playtimeTwoWeeksMinutes),
          direction(profileGames.lastPlayedAt),
          asc(steamProfiles.personaName),
          asc(steamProfiles.steamId),
        ];
      case 'completion':
      default:
        return [
          direction(profileGames.completionPercentage),
          desc(profileGames.unlockedAchievements),
          asc(steamProfiles.personaName),
          asc(steamProfiles.steamId),
        ];
    }
  }
}

const achievementStateCountSql = {
  achievementMetadataCount: sql<number>`(
    select cast(count(*) as int)
    from ${achievements}
    where ${achievements.steamAppId} = ${games.steamAppId}
  )`,
  knownUnlockStateCount: sql<number>`(
    select cast(count(*) as int)
    from ${profileAchievements}
    inner join ${achievements}
      on ${achievements.id} = ${profileAchievements.achievementId}
    where ${profileAchievements.profileId} = ${profileGames.profileId}
      and ${achievements.steamAppId} = ${games.steamAppId}
  )`,
};

const achievementStateCountSelect = {
  achievementMetadataCount: achievementStateCountSql.achievementMetadataCount,
  knownUnlockStateCount: achievementStateCountSql.knownUnlockStateCount,
};
