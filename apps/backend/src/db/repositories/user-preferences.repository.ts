import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';

import { DatabaseService } from '../database.service';
import { userPreferences } from '../schema';

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
}

