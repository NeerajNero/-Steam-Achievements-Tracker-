import { Injectable } from '@nestjs/common';

import {
  ContentReportsRepository,
  type ContentReport,
  type ContentReportReason,
  type ContentReportTargetType,
} from '../repositories/content-reports.repository';

export type {
  ContentReport,
  ContentReportReason,
  ContentReportTargetType,
} from '../repositories/content-reports.repository';

@Injectable()
export class ContentReportsDataService {
  constructor(private readonly contentReportsRepository: ContentReportsRepository) {}

  async create(input: {
    reporterUserId: string;
    targetType: ContentReportTargetType;
    targetId: string;
    reason: ContentReportReason;
    details?: string | null;
  }): Promise<ContentReport> {
    return this.contentReportsRepository.create(input);
  }
}
