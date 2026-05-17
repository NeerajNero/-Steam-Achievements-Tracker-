import { Injectable } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import type { InferSelectModel } from 'drizzle-orm';

import { DatabaseService } from '../database.service';
import { guideVotes } from '../schema';

export type GuideVote = InferSelectModel<typeof guideVotes>;
export type GuideVoteValue = -1 | 1;

export interface GuideVoteSummary {
  upvotes: number;
  downvotes: number;
  score: number;
  currentUserVote: GuideVoteValue | null;
}

@Injectable()
export class GuideVotesRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async getSummary(
    guideId: string,
    currentUserId?: string,
  ): Promise<GuideVoteSummary> {
    const currentUserVoteExpression =
      currentUserId === undefined
        ? sql<GuideVoteValue | null>`null`
        : sql<GuideVoteValue | null>`max(case when ${guideVotes.userId} = ${currentUserId} then ${guideVotes.value} else null end)`;
    const [row] = await this.databaseService.db
      .select({
        upvotes: sql<number>`cast(count(*) filter (where ${guideVotes.value} = 1) as int)`,
        downvotes: sql<number>`cast(count(*) filter (where ${guideVotes.value} = -1) as int)`,
        score: sql<number>`cast(coalesce(sum(${guideVotes.value}), 0) as int)`,
        currentUserVote: currentUserVoteExpression,
      })
      .from(guideVotes)
      .where(eq(guideVotes.guideId, guideId));

    return {
      upvotes: row?.upvotes ?? 0,
      downvotes: row?.downvotes ?? 0,
      score: row?.score ?? 0,
      currentUserVote: row?.currentUserVote ?? null,
    };
  }

  async upsert(
    guideId: string,
    userId: string,
    value: GuideVoteValue,
  ): Promise<GuideVote> {
    const rows = await this.databaseService.db
      .insert(guideVotes)
      .values({ guideId, userId, value })
      .onConflictDoUpdate({
        target: [guideVotes.guideId, guideVotes.userId],
        set: { value, updatedAt: sql`now()` },
      })
      .returning();

    return rows[0];
  }

  async remove(guideId: string, userId: string): Promise<boolean> {
    const rows = await this.databaseService.db
      .delete(guideVotes)
      .where(and(eq(guideVotes.guideId, guideId), eq(guideVotes.userId, userId)))
      .returning({ id: guideVotes.id });

    return rows.length > 0;
  }
}
