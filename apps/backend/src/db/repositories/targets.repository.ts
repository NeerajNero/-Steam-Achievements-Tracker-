import { Injectable } from '@nestjs/common';
import { and, asc, desc, eq, sql } from 'drizzle-orm';
import type { InferInsertModel, InferSelectModel, SQL } from 'drizzle-orm';

import { DatabaseService } from '../database.service';
import {
  achievementTargets,
  achievements,
  games,
  gameTargets,
  profileAchievements,
  profileGames,
} from '../schema';
import type { Achievement } from './achievements.repository';
import type { Game } from './games.repository';
import type { ProfileAchievement } from './profile-achievements.repository';
import type { ProfileGame } from './profile-games.repository';

export type TargetStatus =
  | 'active'
  | 'paused'
  | 'completed'
  | 'ignored'
  | 'archived';
export type TargetPriority = 'low' | 'medium' | 'high';
export type TargetListType = 'game' | 'achievement' | 'all';

export type GameTarget = InferSelectModel<typeof gameTargets>;
export type NewGameTarget = InferInsertModel<typeof gameTargets>;
export type AchievementTarget = InferSelectModel<typeof achievementTargets>;
export type NewAchievementTarget = InferInsertModel<typeof achievementTargets>;

export interface TargetListFilters {
  status?: TargetStatus;
  type: TargetListType;
  limit: number;
  offset: number;
}

export interface CreateGameTargetInput {
  userId: string;
  steamProfileId: string;
  gameId: string;
  priority: TargetPriority;
  notes?: string | null;
  targetCompletionPercentage?: number | null;
  dueDate?: string | null;
}

export interface UpdateGameTargetInput {
  status?: TargetStatus;
  priority?: TargetPriority;
  notes?: string | null;
  targetCompletionPercentage?: number | null;
  dueDate?: string | null;
}

export interface CreateAchievementTargetInput {
  userId: string;
  steamProfileId: string;
  achievementId: string;
  priority: TargetPriority;
  notes?: string | null;
  dueDate?: string | null;
}

export interface UpdateAchievementTargetInput {
  status?: TargetStatus;
  priority?: TargetPriority;
  notes?: string | null;
  dueDate?: string | null;
}

export interface GameTargetRow {
  target: GameTarget;
  game: Game;
  profileGame: ProfileGame | null;
  achievementMetadataCount: number;
  knownUnlockStateCount: number;
}

export interface AchievementTargetRow {
  target: AchievementTarget;
  achievement: Achievement;
  game: Game;
  profileAchievement: ProfileAchievement | null;
}

@Injectable()
export class TargetsRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async upsertGameTarget(input: CreateGameTargetInput): Promise<GameTarget> {
    const rows = await this.databaseService.db
      .insert(gameTargets)
      .values({
        userId: input.userId,
        steamProfileId: input.steamProfileId,
        gameId: input.gameId,
        status: 'active',
        priority: input.priority,
        notes: input.notes,
        targetCompletionPercentage: input.targetCompletionPercentage,
        dueDate: input.dueDate,
      })
      .onConflictDoUpdate({
        target: [gameTargets.userId, gameTargets.gameId],
        set: {
          steamProfileId: input.steamProfileId,
          status: 'active',
          priority: input.priority,
          notes: input.notes === undefined ? gameTargets.notes : input.notes,
          targetCompletionPercentage:
            input.targetCompletionPercentage === undefined
              ? gameTargets.targetCompletionPercentage
              : input.targetCompletionPercentage,
          dueDate: input.dueDate === undefined ? gameTargets.dueDate : input.dueDate,
          updatedAt: sql`now()`,
        },
      })
      .returning();

    return rows[0];
  }

  async upsertAchievementTarget(
    input: CreateAchievementTargetInput,
  ): Promise<AchievementTarget> {
    const rows = await this.databaseService.db
      .insert(achievementTargets)
      .values({
        userId: input.userId,
        steamProfileId: input.steamProfileId,
        achievementId: input.achievementId,
        status: 'active',
        priority: input.priority,
        notes: input.notes,
        dueDate: input.dueDate,
      })
      .onConflictDoUpdate({
        target: [achievementTargets.userId, achievementTargets.achievementId],
        set: {
          steamProfileId: input.steamProfileId,
          status: 'active',
          priority: input.priority,
          notes:
            input.notes === undefined ? achievementTargets.notes : input.notes,
          dueDate:
            input.dueDate === undefined
              ? achievementTargets.dueDate
              : input.dueDate,
          updatedAt: sql`now()`,
        },
      })
      .returning();

    return rows[0];
  }

  async findGameTargetByIdForUser(
    userId: string,
    targetId: string,
  ): Promise<GameTargetRow | null> {
    const rows = await this.findGameTargetsByUser(userId, {
      type: 'game',
      limit: 1,
      offset: 0,
      targetId,
    });

    return rows[0] ?? null;
  }

  async findAchievementTargetByIdForUser(
    userId: string,
    targetId: string,
  ): Promise<AchievementTargetRow | null> {
    const rows = await this.findAchievementTargetsByUser(userId, {
      type: 'achievement',
      limit: 1,
      offset: 0,
      targetId,
    });

    return rows[0] ?? null;
  }

  async findGameTargetsByUser(
    userId: string,
    filters: TargetListFilters & { targetId?: string },
  ): Promise<GameTargetRow[]> {
    const conditions = buildGameTargetConditions(userId, filters);

    return this.databaseService.db
      .select({
        target: gameTargets,
        game: games,
        profileGame: profileGames,
        achievementMetadataCount: achievementMetadataCountSql,
        knownUnlockStateCount: knownUnlockStateCountSql,
      })
      .from(gameTargets)
      .innerJoin(games, eq(games.id, gameTargets.gameId))
      .leftJoin(
        profileGames,
        and(
          eq(profileGames.profileId, gameTargets.steamProfileId),
          eq(profileGames.gameId, gameTargets.gameId),
        ),
      )
      .where(and(...conditions))
      .orderBy(...targetOrderBy(gameTargets.priority, gameTargets.dueDate, gameTargets.createdAt))
      .limit(filters.limit)
      .offset(filters.offset);
  }

  async findAchievementTargetsByUser(
    userId: string,
    filters: TargetListFilters & { targetId?: string },
  ): Promise<AchievementTargetRow[]> {
    const conditions = buildAchievementTargetConditions(userId, filters);

    return this.databaseService.db
      .select({
        target: achievementTargets,
        achievement: achievements,
        game: games,
        profileAchievement: profileAchievements,
      })
      .from(achievementTargets)
      .innerJoin(achievements, eq(achievements.id, achievementTargets.achievementId))
      .innerJoin(games, eq(games.steamAppId, achievements.steamAppId))
      .leftJoin(
        profileAchievements,
        and(
          eq(profileAchievements.profileId, achievementTargets.steamProfileId),
          eq(profileAchievements.achievementId, achievementTargets.achievementId),
        ),
      )
      .where(and(...conditions))
      .orderBy(
        ...targetOrderBy(
          achievementTargets.priority,
          achievementTargets.dueDate,
          achievementTargets.createdAt,
        ),
      )
      .limit(filters.limit)
      .offset(filters.offset);
  }

  async countGameTargetsByUser(
    userId: string,
    filters: Pick<TargetListFilters, 'status'>,
  ): Promise<number> {
    const rows = await this.databaseService.db
      .select({ total: sql<number>`cast(count(*) as int)` })
      .from(gameTargets)
      .where(and(...buildGameTargetConditions(userId, filters)))
      .limit(1);

    return rows[0]?.total ?? 0;
  }

  async countAchievementTargetsByUser(
    userId: string,
    filters: Pick<TargetListFilters, 'status'>,
  ): Promise<number> {
    const rows = await this.databaseService.db
      .select({ total: sql<number>`cast(count(*) as int)` })
      .from(achievementTargets)
      .where(and(...buildAchievementTargetConditions(userId, filters)))
      .limit(1);

    return rows[0]?.total ?? 0;
  }

  async findActiveGameTargetsForDashboard(
    userId: string,
    limit: number,
  ): Promise<GameTargetRow[]> {
    return this.findGameTargetsByUser(userId, {
      type: 'game',
      status: 'active',
      limit,
      offset: 0,
    });
  }

  async findActiveAchievementTargetsForDashboard(
    userId: string,
    limit: number,
  ): Promise<AchievementTargetRow[]> {
    return this.findAchievementTargetsByUser(userId, {
      type: 'achievement',
      status: 'active',
      limit,
      offset: 0,
    });
  }

  async updateGameTargetForUser(
    userId: string,
    targetId: string,
    input: UpdateGameTargetInput,
  ): Promise<GameTarget | null> {
    const rows = await this.databaseService.db
      .update(gameTargets)
      .set({
        ...input,
        updatedAt: sql`now()`,
      })
      .where(and(eq(gameTargets.userId, userId), eq(gameTargets.id, targetId)))
      .returning();

    return rows[0] ?? null;
  }

  async updateAchievementTargetForUser(
    userId: string,
    targetId: string,
    input: UpdateAchievementTargetInput,
  ): Promise<AchievementTarget | null> {
    const rows = await this.databaseService.db
      .update(achievementTargets)
      .set({
        ...input,
        updatedAt: sql`now()`,
      })
      .where(
        and(
          eq(achievementTargets.userId, userId),
          eq(achievementTargets.id, targetId),
        ),
      )
      .returning();

    return rows[0] ?? null;
  }
}

function buildGameTargetConditions(
  userId: string,
  filters: Pick<TargetListFilters, 'status'> & { targetId?: string },
): SQL[] {
  const conditions: SQL[] = [eq(gameTargets.userId, userId)];

  if (filters.status !== undefined) {
    conditions.push(eq(gameTargets.status, filters.status));
  }

  if (filters.targetId !== undefined) {
    conditions.push(eq(gameTargets.id, filters.targetId));
  }

  return conditions;
}

function buildAchievementTargetConditions(
  userId: string,
  filters: Pick<TargetListFilters, 'status'> & { targetId?: string },
): SQL[] {
  const conditions: SQL[] = [eq(achievementTargets.userId, userId)];

  if (filters.status !== undefined) {
    conditions.push(eq(achievementTargets.status, filters.status));
  }

  if (filters.targetId !== undefined) {
    conditions.push(eq(achievementTargets.id, filters.targetId));
  }

  return conditions;
}

function targetOrderBy(
  priorityColumn: typeof gameTargets.priority | typeof achievementTargets.priority,
  dueDateColumn: typeof gameTargets.dueDate | typeof achievementTargets.dueDate,
  createdAtColumn: typeof gameTargets.createdAt | typeof achievementTargets.createdAt,
): SQL[] {
  return [
    sql`case ${priorityColumn} when 'high' then 0 when 'medium' then 1 else 2 end`,
    sql`case when ${dueDateColumn} is null then 1 else 0 end`,
    asc(dueDateColumn),
    desc(createdAtColumn),
  ];
}

const achievementMetadataCountSql = sql<number>`(
  select cast(count(*) as int)
  from ${achievements}
  where ${achievements.steamAppId} = ${games.steamAppId}
)`;

const knownUnlockStateCountSql = sql<number>`(
  select cast(count(*) as int)
  from ${profileAchievements}
  inner join ${achievements}
    on ${achievements.id} = ${profileAchievements.achievementId}
  where ${profileAchievements.profileId} = ${gameTargets.steamProfileId}
    and ${achievements.steamAppId} = ${games.steamAppId}
)`;
