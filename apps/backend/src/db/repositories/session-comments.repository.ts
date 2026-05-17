import { Injectable } from '@nestjs/common';
import { and, asc, eq, sql } from 'drizzle-orm';
import type { InferSelectModel } from 'drizzle-orm';

import { DatabaseService } from '../database.service';
import {
  appUsers,
  publicProfiles,
  sessionComments,
  steamProfiles,
  userSteamAccounts,
} from '../schema';
import type { CommentAuthorRow, CommentStatus } from './guide-comments.repository';

export type SessionComment = InferSelectModel<typeof sessionComments>;

export interface SessionCommentWithAuthor {
  comment: SessionComment;
  author: CommentAuthorRow;
}

@Injectable()
export class SessionCommentsRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(input: {
    sessionId: string;
    userId: string;
    body: string;
  }): Promise<SessionCommentWithAuthor> {
    const rows = await this.databaseService.db
      .insert(sessionComments)
      .values({
        sessionId: input.sessionId,
        userId: input.userId,
        body: input.body,
      })
      .returning({ id: sessionComments.id });

    const row = await this.findByIdWithAuthor(rows[0].id);

    if (row === null) {
      throw new Error('Session comment was not found after creation.');
    }

    return row;
  }

  async findById(id: string): Promise<SessionComment | null> {
    const rows = await this.databaseService.db
      .select()
      .from(sessionComments)
      .where(eq(sessionComments.id, id))
      .limit(1);

    return rows[0] ?? null;
  }

  async findByIdWithAuthor(id: string): Promise<SessionCommentWithAuthor | null> {
    const rows = await this.selectWithAuthor()
      .where(eq(sessionComments.id, id))
      .limit(1);

    return rows[0] ?? null;
  }

  async findVisibleBySessionId(
    sessionId: string,
  ): Promise<SessionCommentWithAuthor[]> {
    return this.selectWithAuthor()
      .where(
        and(
          eq(sessionComments.sessionId, sessionId),
          eq(sessionComments.status, 'visible'),
        ),
      )
      .orderBy(asc(sessionComments.createdAt), asc(sessionComments.id));
  }

  async updateBody(
    id: string,
    body: string,
  ): Promise<SessionCommentWithAuthor | null> {
    const rows = await this.databaseService.db
      .update(sessionComments)
      .set({ body, updatedAt: sql`now()` })
      .where(eq(sessionComments.id, id))
      .returning({ id: sessionComments.id });

    if (rows.length === 0) {
      return null;
    }

    return this.findByIdWithAuthor(rows[0].id);
  }

  async setStatus(
    id: string,
    status: CommentStatus,
  ): Promise<SessionCommentWithAuthor | null> {
    const rows = await this.databaseService.db
      .update(sessionComments)
      .set({ status, updatedAt: sql`now()` })
      .where(eq(sessionComments.id, id))
      .returning({ id: sessionComments.id });

    if (rows.length === 0) {
      return null;
    }

    return this.findByIdWithAuthor(rows[0].id);
  }

  private selectWithAuthor() {
    return this.databaseService.db
      .select({
        comment: sessionComments,
        author: {
          displayName: appUsers.displayName,
          steamId: steamProfiles.steamId,
          avatarUrl: sql<string | null>`coalesce(${steamProfiles.avatarUrl}, ${appUsers.avatarUrl})`,
          publicSlug: publicProfiles.slug,
        },
      })
      .from(sessionComments)
      .innerJoin(appUsers, eq(appUsers.id, sessionComments.userId))
      .leftJoin(
        userSteamAccounts,
        and(
          eq(userSteamAccounts.userId, appUsers.id),
          eq(userSteamAccounts.isPrimary, true),
        ),
      )
      .leftJoin(steamProfiles, eq(steamProfiles.id, userSteamAccounts.steamProfileId))
      .leftJoin(
        publicProfiles,
        and(
          eq(publicProfiles.userId, appUsers.id),
          eq(publicProfiles.steamProfileId, userSteamAccounts.steamProfileId),
          eq(publicProfiles.isPublic, true),
        ),
      );
  }
}
