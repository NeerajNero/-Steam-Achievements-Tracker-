import { Injectable } from '@nestjs/common';
import type { InferSelectModel } from 'drizzle-orm';

import { DatabaseService } from '../database.service';
import { contentReports } from '../schema';

export type ContentReport = InferSelectModel<typeof contentReports>;
export type ContentReportTargetType =
  | 'guide'
  | 'guide_comment'
  | 'gaming_session'
  | 'session_comment';
export type ContentReportReason =
  | 'spam'
  | 'abuse'
  | 'off_topic'
  | 'cheating'
  | 'other';

@Injectable()
export class ContentReportsRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(input: {
    reporterUserId: string;
    targetType: ContentReportTargetType;
    targetId: string;
    reason: ContentReportReason;
    details?: string | null;
  }): Promise<ContentReport> {
    const rows = await this.databaseService.db
      .insert(contentReports)
      .values({
        reporterUserId: input.reporterUserId,
        targetType: input.targetType,
        targetId: input.targetId,
        reason: input.reason,
        details: input.details,
      })
      .returning();

    return rows[0];
  }
}
