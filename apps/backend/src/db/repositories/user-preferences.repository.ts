import { Injectable } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';

import { DatabaseService } from '../database.service';
import { userPreferences, type UserPreferenceSettings } from '../schema';

export type UserPreference = typeof userPreferences.$inferSelect;

@Injectable()
export class UserPreferencesRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async findByUserId(userId: string): Promise<UserPreference | null> {
    const rows = await this.databaseService.db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId))
      .limit(1);

    return rows[0] ?? null;
  }

  async create(userId: string): Promise<UserPreference> {
    const rows = await this.databaseService.db
      .insert(userPreferences)
      .values({ userId })
      .returning();

    return rows[0];
  }

  async updateSettings(
    userId: string,
    settings: UserPreferenceSettings,
  ): Promise<UserPreference | null> {
    const rows = await this.databaseService.db
      .update(userPreferences)
      .set({ settings, updatedAt: sql`now()` })
      .where(eq(userPreferences.userId, userId))
      .returning();

    return rows[0] ?? null;
  }

  async upsertSettings(
    userId: string,
    settings: UserPreferenceSettings,
  ): Promise<UserPreference> {
    const rows = await this.databaseService.db
      .insert(userPreferences)
      .values({ userId, settings })
      .onConflictDoUpdate({
        target: userPreferences.userId,
        set: { settings, updatedAt: sql`now()` },
      })
      .returning();

    return rows[0];
  }
}
