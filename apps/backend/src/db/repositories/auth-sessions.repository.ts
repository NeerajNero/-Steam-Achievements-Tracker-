import { Injectable } from '@nestjs/common';
import { and, desc, eq, isNull, lt, sql } from 'drizzle-orm';

import { DatabaseService } from '../database.service';
import { authSessions } from '../schema';

export type AuthSession = typeof authSessions.$inferSelect;
export type NewAuthSession = typeof authSessions.$inferInsert;

export interface CreateAuthSessionInput {
  userId: string;
  sessionTokenHash: string;
  userAgent?: string | null;
  ipAddress?: string | null;
  expiresAt: Date;
}

@Injectable()
export class AuthSessionsRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(input: CreateAuthSessionInput): Promise<AuthSession> {
    const rows = await this.databaseService.db
      .insert(authSessions)
      .values({
        userId: input.userId,
        sessionTokenHash: input.sessionTokenHash,
        userAgent: input.userAgent ?? null,
        ipAddress: input.ipAddress ?? null,
        expiresAt: input.expiresAt,
      })
      .returning();

    return rows[0];
  }

  async findByHash(sessionTokenHash: string): Promise<AuthSession | null> {
    const rows = await this.databaseService.db
      .select()
      .from(authSessions)
      .where(eq(authSessions.sessionTokenHash, sessionTokenHash))
      .orderBy(desc(authSessions.createdAt))
      .limit(1);

    return rows[0] ?? null;
  }

  async revokeByHash(sessionTokenHash: string): Promise<void> {
    await this.databaseService.db
      .update(authSessions)
      .set({ revokedAt: sql`now()` })
      .where(eq(authSessions.sessionTokenHash, sessionTokenHash));
  }

  async markExpiredAndRevoked(before: Date): Promise<number> {
    const result = await this.databaseService.db
      .update(authSessions)
      .set({ revokedAt: sql`now()` })
      .where(
        and(
          isNull(authSessions.revokedAt),
          lt(authSessions.expiresAt, before),
        ),
      )
      .returning({ id: authSessions.id });

    return result.length;
  }

  async findLatestForUser(userId: string): Promise<AuthSession | null> {
    const rows = await this.databaseService.db
      .select()
      .from(authSessions)
      .where(and(eq(authSessions.userId, userId), isNull(authSessions.revokedAt)))
      .orderBy(desc(authSessions.createdAt))
      .limit(1);

    return rows[0] ?? null;
  }
}

