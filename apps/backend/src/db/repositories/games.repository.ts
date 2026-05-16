import { Injectable } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';

import { DatabaseService } from '../database.service';
import { games } from '../schema';

export type Game = InferSelectModel<typeof games>;
export type NewGame = InferInsertModel<typeof games>;

export type UpsertGameInput = Pick<NewGame, 'steamAppId' | 'name'> &
  Partial<Pick<NewGame, 'iconUrl' | 'logoUrl' | 'hasAchievements'>>;

export type UpsertOwnedGameInput = Pick<
  NewGame,
  'steamAppId' | 'name' | 'iconUrl' | 'logoUrl'
>;

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
}
