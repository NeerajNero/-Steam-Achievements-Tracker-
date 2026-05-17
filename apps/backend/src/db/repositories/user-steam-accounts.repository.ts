import { Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';

import { DatabaseService } from '../database.service';
import { userSteamAccounts } from '../schema';

export type UserSteamAccount = typeof userSteamAccounts.$inferSelect;
export type NewUserSteamAccount = typeof userSteamAccounts.$inferInsert;

export interface UpsertUserSteamAccountInput {
  userId: string;
  steamProfileId: string;
  steamId: string;
}

@Injectable()
export class UserSteamAccountsRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async findBySteamId(steamId: string): Promise<UserSteamAccount | null> {
    const rows = await this.databaseService.db
      .select()
      .from(userSteamAccounts)
      .where(eq(userSteamAccounts.steamId, steamId))
      .limit(1);

    return rows[0] ?? null;
  }

  async findByUserAndProfileId(
    userId: string,
    steamProfileId: string,
  ): Promise<UserSteamAccount | null> {
    const rows = await this.databaseService.db
      .select()
      .from(userSteamAccounts)
      .where(
        and(
          eq(userSteamAccounts.userId, userId),
          eq(userSteamAccounts.steamProfileId, steamProfileId),
        ),
      )
      .limit(1);

    return rows[0] ?? null;
  }

  async findPrimaryByUserId(userId: string): Promise<UserSteamAccount | null> {
    const rows = await this.databaseService.db
      .select()
      .from(userSteamAccounts)
      .where(
        and(eq(userSteamAccounts.userId, userId), eq(userSteamAccounts.isPrimary, true)),
      )
      .limit(1);

    return rows[0] ?? null;
  }

  async create(input: UpsertUserSteamAccountInput): Promise<UserSteamAccount> {
    const rows = await this.databaseService.db
      .insert(userSteamAccounts)
      .values({
        ...input,
        isPrimary: true,
      })
      .returning();

    return rows[0];
  }

  async setBySteamId(input: UpsertUserSteamAccountInput): Promise<UserSteamAccount> {
    const rows = await this.databaseService.db
      .insert(userSteamAccounts)
      .values({
        ...input,
        isPrimary: true,
      })
      .onConflictDoUpdate({
        target: userSteamAccounts.steamId,
        set: {
          userId: input.userId,
          steamProfileId: input.steamProfileId,
          isPrimary: true,
          steamId: input.steamId,
          updatedAt: new Date(),
        },
      })
      .returning();

    return rows[0];
  }

  async setPrimary(userId: string, steamProfileId: string): Promise<void> {
    await this.databaseService.db.transaction(async (tx) => {
      await tx
        .update(userSteamAccounts)
        .set({ isPrimary: false })
        .where(and(eq(userSteamAccounts.userId, userId), eq(userSteamAccounts.isPrimary, true)));

      await tx
        .update(userSteamAccounts)
        .set({ isPrimary: true })
        .where(
          and(
            eq(userSteamAccounts.userId, userId),
            eq(userSteamAccounts.steamProfileId, steamProfileId),
          ),
        );
    });
  }

  async upsertByUserAndProfile(input: UpsertUserSteamAccountInput): Promise<UserSteamAccount> {
    return this.databaseService.db.transaction(async (tx) => {
      await tx
        .update(userSteamAccounts)
        .set({ isPrimary: false })
        .where(
          and(
            eq(userSteamAccounts.userId, input.userId),
            eq(userSteamAccounts.isPrimary, true),
          ),
        );

      const rows = await tx
        .insert(userSteamAccounts)
        .values({
          ...input,
          isPrimary: true,
        })
        .onConflictDoUpdate({
          target: [userSteamAccounts.userId, userSteamAccounts.steamProfileId],
          set: {
            steamId: input.steamId,
            isPrimary: true,
          },
        })
        .returning();

      return rows[0];
    });
  }

  async clearPrimaryForUser(userId: string): Promise<void> {
    await this.databaseService.db
      .update(userSteamAccounts)
      .set({ isPrimary: false })
      .where(and(eq(userSteamAccounts.userId, userId), eq(userSteamAccounts.isPrimary, true)));
  }

  async findForUser(userId: string): Promise<UserSteamAccount[]> {
    return this.databaseService.db
      .select()
      .from(userSteamAccounts)
      .where(eq(userSteamAccounts.userId, userId));
  }
}
