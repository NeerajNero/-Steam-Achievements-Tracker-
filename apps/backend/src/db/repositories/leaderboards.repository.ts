import { Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

import { DatabaseService } from '../database.service';

export type LeaderboardType =
  | 'completion_percentage'
  | 'completed_games'
  | 'unlocked_achievements'
  | 'rarest_unlocks';

export interface LeaderboardFilters {
  type: LeaderboardType;
  limit: number;
  offset: number;
}

export interface LeaderboardRow {
  rank: number;
  steamId: string;
  personaName: string | null;
  avatarUrl: string | null;
  publicSlug: string | null;
  score: number;
  snapshotId: string;
  totalGames: number;
  completedGames: number;
  totalAchievements: number;
  unlockedAchievements: number;
  remainingAchievements: number;
  averageCompletionPercentage: number;
  totalPlaytimeMinutes: number;
  rarestUnlockedGlobalPercentage: number | null;
  createdAt: Date;
}

@Injectable()
export class LeaderboardsRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async findLeaderboard(filters: LeaderboardFilters): Promise<LeaderboardRow[]> {
    const scoreExpression = getScoreExpression(filters.type);
    const orderExpression = getLeaderboardOrder(filters.type);
    const result = await this.databaseService.db.execute(sql`
      WITH latest_snapshots AS (
        SELECT DISTINCT ON (ps.steam_profile_id)
          ps.*
        FROM profile_snapshots ps
        ORDER BY ps.steam_profile_id, ps.created_at DESC, ps.id DESC
      ),
      ranked_snapshots AS (
        SELECT
          row_number() OVER (ORDER BY ${orderExpression}, sp.steam_id ASC)::int AS rank,
          sp.steam_id AS "steamId",
          sp.persona_name AS "personaName",
          sp.avatar_url AS "avatarUrl",
          pp.slug AS "publicSlug",
          ${scoreExpression} AS score,
          ls.id AS "snapshotId",
          ls.total_games AS "totalGames",
          ls.completed_games AS "completedGames",
          ls.total_achievements AS "totalAchievements",
          ls.unlocked_achievements AS "unlockedAchievements",
          ls.remaining_achievements AS "remainingAchievements",
          ls.average_completion_percentage::float AS "averageCompletionPercentage",
          ls.total_playtime_minutes AS "totalPlaytimeMinutes",
          ls.rarest_unlocked_global_percentage::float AS "rarestUnlockedGlobalPercentage",
          ls.created_at AS "createdAt"
        FROM latest_snapshots ls
        JOIN steam_profiles sp ON sp.id = ls.steam_profile_id
        LEFT JOIN public_profiles pp
          ON pp.steam_profile_id = sp.id
          AND pp.is_public = true
      )
      SELECT *
      FROM ranked_snapshots
      WHERE rank > ${filters.offset}
      ORDER BY rank ASC
      LIMIT ${filters.limit}
    `);

    return result.rows.map((row) => ({
      rank: Number(row.rank),
      steamId: String(row.steamId),
      personaName: toNullableString(row.personaName),
      avatarUrl: toNullableString(row.avatarUrl),
      publicSlug: toNullableString(row.publicSlug),
      score: Number(row.score),
      snapshotId: String(row.snapshotId),
      totalGames: Number(row.totalGames),
      completedGames: Number(row.completedGames),
      totalAchievements: Number(row.totalAchievements),
      unlockedAchievements: Number(row.unlockedAchievements),
      remainingAchievements: Number(row.remainingAchievements),
      averageCompletionPercentage: Number(row.averageCompletionPercentage),
      totalPlaytimeMinutes: Number(row.totalPlaytimeMinutes),
      rarestUnlockedGlobalPercentage:
        row.rarestUnlockedGlobalPercentage === null
          ? null
          : Number(row.rarestUnlockedGlobalPercentage),
      createdAt: new Date(String(row.createdAt)),
    }));
  }
}

function getScoreExpression(type: LeaderboardType): SQL {
  switch (type) {
    case 'completed_games':
      return sql`ls.completed_games::float`;
    case 'unlocked_achievements':
      return sql`ls.unlocked_achievements::float`;
    case 'rarest_unlocks':
      return sql`coalesce(ls.rarest_unlocked_global_percentage, 100)::float`;
    case 'completion_percentage':
    default:
      return sql`ls.average_completion_percentage::float`;
  }
}

function getLeaderboardOrder(type: LeaderboardType): SQL {
  switch (type) {
    case 'completed_games':
      return sql`ls.completed_games DESC, ls.average_completion_percentage DESC, ls.unlocked_achievements DESC`;
    case 'unlocked_achievements':
      return sql`ls.unlocked_achievements DESC, ls.average_completion_percentage DESC, ls.completed_games DESC`;
    case 'rarest_unlocks':
      return sql`ls.rarest_unlocked_global_percentage ASC NULLS LAST, ls.unlocked_achievements DESC`;
    case 'completion_percentage':
    default:
      return sql`ls.average_completion_percentage DESC, ls.completed_games DESC, ls.unlocked_achievements DESC`;
  }
}

function toNullableString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}
