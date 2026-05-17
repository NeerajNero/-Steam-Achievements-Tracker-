import { Injectable } from '@nestjs/common';
import { and, asc, eq, sql } from 'drizzle-orm';
import type { InferSelectModel } from 'drizzle-orm';

import { DatabaseService } from '../database.service';
import {
  appUsers,
  guideComments,
  publicProfiles,
  steamProfiles,
  userSteamAccounts,
} from '../schema';

export type GuideComment = InferSelectModel<typeof guideComments>;
export type CommentStatus = 'visible' | 'hidden' | 'deleted';

export interface CommentAuthorRow {
  displayName: string | null;
  steamId: string | null;
  avatarUrl: string | null;
  publicSlug: string | null;
}

export interface GuideCommentWithAuthor {
  comment: GuideComment;
  author: CommentAuthorRow;
}

@Injectable()
export class GuideCommentsRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(input: {
    guideId: string;
    userId: string;
    body: string;
  }): Promise<GuideCommentWithAuthor> {
    const rows = await this.databaseService.db
      .insert(guideComments)
      .values({
        guideId: input.guideId,
        userId: input.userId,
        body: input.body,
      })
      .returning({ id: guideComments.id });

    const row = await this.findByIdWithAuthor(rows[0].id);

    if (row === null) {
      throw new Error('Guide comment was not found after creation.');
    }

    return row;
  }

  async findById(id: string): Promise<GuideComment | null> {
    const rows = await this.databaseService.db
      .select()
      .from(guideComments)
      .where(eq(guideComments.id, id))
      .limit(1);

    return rows[0] ?? null;
  }

  async findByIdWithAuthor(id: string): Promise<GuideCommentWithAuthor | null> {
    const rows = await this.selectWithAuthor()
      .where(eq(guideComments.id, id))
      .limit(1);

    return rows[0] ?? null;
  }

  async findVisibleByGuideId(guideId: string): Promise<GuideCommentWithAuthor[]> {
    return this.selectWithAuthor()
      .where(
        and(eq(guideComments.guideId, guideId), eq(guideComments.status, 'visible')),
      )
      .orderBy(asc(guideComments.createdAt), asc(guideComments.id));
  }

  async updateBody(id: string, body: string): Promise<GuideCommentWithAuthor | null> {
    const rows = await this.databaseService.db
      .update(guideComments)
      .set({ body, updatedAt: sql`now()` })
      .where(eq(guideComments.id, id))
      .returning({ id: guideComments.id });

    if (rows.length === 0) {
      return null;
    }

    return this.findByIdWithAuthor(rows[0].id);
  }

  async setStatus(
    id: string,
    status: CommentStatus,
  ): Promise<GuideCommentWithAuthor | null> {
    const rows = await this.databaseService.db
      .update(guideComments)
      .set({ status, updatedAt: sql`now()` })
      .where(eq(guideComments.id, id))
      .returning({ id: guideComments.id });

    if (rows.length === 0) {
      return null;
    }

    return this.findByIdWithAuthor(rows[0].id);
  }

  private selectWithAuthor() {
    return this.databaseService.db
      .select({
        comment: guideComments,
        author: {
          displayName: appUsers.displayName,
          steamId: steamProfiles.steamId,
          avatarUrl: sql<string | null>`coalesce(${steamProfiles.avatarUrl}, ${appUsers.avatarUrl})`,
          publicSlug: publicProfiles.slug,
        },
      })
      .from(guideComments)
      .innerJoin(appUsers, eq(appUsers.id, guideComments.userId))
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
