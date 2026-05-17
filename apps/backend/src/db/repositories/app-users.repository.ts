import { Injectable } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';

import { DatabaseService } from '../database.service';
import { appUsers } from '../schema';

export type AppUser = InferSelectModel<typeof appUsers>;
export type NewAppUser = InferInsertModel<typeof appUsers>;

export type CreateAppUserInput = Pick<NewAppUser, 'displayName' | 'avatarUrl'>;
export type UpdateAppUserInput = Partial<
  Pick<NewAppUser, 'displayName' | 'avatarUrl'>
>;

@Injectable()
export class AppUsersRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async findById(id: string): Promise<AppUser | null> {
    const rows = await this.databaseService.db
      .select()
      .from(appUsers)
      .where(eq(appUsers.id, id))
      .limit(1);

    return rows[0] ?? null;
  }

  async create(input: CreateAppUserInput): Promise<AppUser> {
    const rows = await this.databaseService.db
      .insert(appUsers)
      .values(input)
      .returning();

    return rows[0];
  }

  async update(id: string, input: UpdateAppUserInput): Promise<AppUser | null> {
    const rows = await this.databaseService.db
      .update(appUsers)
      .set({ ...input, updatedAt: sql`now()` })
      .where(eq(appUsers.id, id))
      .returning();

    return rows[0] ?? null;
  }

  async touchLastLogin(id: string): Promise<AppUser | null> {
    const rows = await this.databaseService.db
      .update(appUsers)
      .set({ lastLoginAt: sql`now()`, updatedAt: sql`now()` })
      .where(eq(appUsers.id, id))
      .returning();

    return rows[0] ?? null;
  }
}
