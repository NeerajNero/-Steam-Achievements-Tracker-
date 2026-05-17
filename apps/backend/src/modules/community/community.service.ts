import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  ContentReportsDataService,
  type ContentReport,
} from '../../db/services/content-reports-data.service';
import { ActivityEventsDataService } from '../../db/services/activity-events-data.service';
import {
  GuideCommentsDataService,
  type GuideComment,
  type GuideCommentWithAuthor,
} from '../../db/services/guide-comments-data.service';
import {
  GuideVotesDataService,
  type GuideVoteValue,
} from '../../db/services/guide-votes-data.service';
import {
  GuidesDataService,
  type Guide,
} from '../../db/services/guides-data.service';
import {
  GamingSessionsDataService,
  type GamingSession,
} from '../../db/services/gaming-sessions-data.service';
import {
  SessionCommentsDataService,
  type SessionComment,
  type SessionCommentWithAuthor,
} from '../../db/services/session-comments-data.service';
import type { AuthenticatedUserContext } from '../auth/authenticated-user.types';
import type {
  CreateCommentDto,
  CreateContentReportDto,
  UpdateCommentDto,
  UpsertGuideVoteDto,
} from './dto/community-request.dto';
import type {
  CommentListResponseDto,
  CommentResponseDto,
  ContentReportResponseDto,
  GuideVoteSummaryResponseDto,
} from './dto/community-response.dto';

@Injectable()
export class CommunityService {
  constructor(
    private readonly guidesDataService: GuidesDataService,
    private readonly guideVotesDataService: GuideVotesDataService,
    private readonly guideCommentsDataService: GuideCommentsDataService,
    private readonly gamingSessionsDataService: GamingSessionsDataService,
    private readonly sessionCommentsDataService: SessionCommentsDataService,
    private readonly contentReportsDataService: ContentReportsDataService,
    private readonly activityEventsDataService: ActivityEventsDataService,
  ) {}

  async getGuideVoteSummary(
    guideId: string,
    currentUser?: AuthenticatedUserContext,
  ): Promise<GuideVoteSummaryResponseDto> {
    await this.ensureGuideExists(guideId);
    return this.guideVotesDataService.getSummary(guideId, currentUser?.userId);
  }

  async upsertGuideVote(
    guideId: string,
    currentUser: AuthenticatedUserContext,
    input: UpsertGuideVoteDto,
  ): Promise<GuideVoteSummaryResponseDto> {
    const guide = await this.ensureGuideExists(guideId);
    const value = toGuideVoteValue(input.value);
    await this.guideVotesDataService.upsert(guideId, currentUser.userId, value);
    await this.activityEventsDataService.create({
      actorUserId: currentUser.userId,
      eventType: 'guide_voted',
      entityType: 'guide',
      entityId: guide.id,
      steamAppId: guide.steamAppId,
      metadata: {
        vote: value,
        title: guide.title,
      },
    });

    return this.getGuideVoteSummary(guideId, currentUser);
  }

  async removeGuideVote(
    guideId: string,
    currentUser: AuthenticatedUserContext,
  ): Promise<GuideVoteSummaryResponseDto> {
    await this.ensureGuideExists(guideId);
    await this.guideVotesDataService.remove(guideId, currentUser.userId);

    return this.getGuideVoteSummary(guideId, currentUser);
  }

  async listGuideComments(guideId: string): Promise<CommentListResponseDto> {
    await this.ensureGuideExists(guideId);
    const items = await this.guideCommentsDataService.findVisibleByGuideId(guideId);

    return { items: items.map(mapGuideComment) };
  }

  async createGuideComment(
    guideId: string,
    currentUser: AuthenticatedUserContext,
    input: CreateCommentDto,
  ): Promise<CommentResponseDto> {
    const guide = await this.ensureGuideExists(guideId);
    const comment = await this.guideCommentsDataService.create({
      guideId,
      userId: currentUser.userId,
      body: normalizeBody(input.body),
    });
    await this.activityEventsDataService.create({
      actorUserId: currentUser.userId,
      eventType: 'guide_commented',
      entityType: 'guide_comment',
      entityId: comment.comment.id,
      steamAppId: guide.steamAppId,
      metadata: {
        guideId: guide.id,
        title: guide.title,
      },
    });

    return mapGuideComment(comment);
  }

  async updateGuideComment(
    guideId: string,
    commentId: string,
    currentUser: AuthenticatedUserContext,
    input: UpdateCommentDto,
  ): Promise<CommentResponseDto> {
    const comment = await this.resolveGuideComment(guideId, commentId);
    this.assertCanManageComment(currentUser, comment);
    const updated = await this.guideCommentsDataService.updateBody(
      commentId,
      normalizeBody(input.body),
    );

    if (updated === null) {
      throw new NotFoundException('Guide comment was not found.');
    }

    return mapGuideComment(updated);
  }

  async deleteGuideComment(
    guideId: string,
    commentId: string,
    currentUser: AuthenticatedUserContext,
  ): Promise<void> {
    const comment = await this.resolveGuideComment(guideId, commentId);
    this.assertCanManageComment(currentUser, comment);
    await this.guideCommentsDataService.setStatus(commentId, 'deleted');
  }

  async listSessionComments(
    sessionId: string,
    currentUser?: AuthenticatedUserContext,
  ): Promise<CommentListResponseDto> {
    await this.resolveViewableSession(sessionId, currentUser);
    const items =
      await this.sessionCommentsDataService.findVisibleBySessionId(sessionId);

    return { items: items.map(mapSessionComment) };
  }

  async createSessionComment(
    sessionId: string,
    currentUser: AuthenticatedUserContext,
    input: CreateCommentDto,
  ): Promise<CommentResponseDto> {
    const session = await this.resolveViewableSession(sessionId, currentUser);
    const comment = await this.sessionCommentsDataService.create({
      sessionId,
      userId: currentUser.userId,
      body: normalizeBody(input.body),
    });
    await this.activityEventsDataService.create({
      actorUserId: currentUser.userId,
      eventType: 'session_commented',
      entityType: 'session_comment',
      entityId: comment.comment.id,
      steamAppId: session.steamAppId,
      metadata: {
        sessionId: session.id,
        title: session.title,
      },
    });

    return mapSessionComment(comment);
  }

  async updateSessionComment(
    sessionId: string,
    commentId: string,
    currentUser: AuthenticatedUserContext,
    input: UpdateCommentDto,
  ): Promise<CommentResponseDto> {
    const comment = await this.resolveSessionComment(sessionId, commentId);
    this.assertCanManageComment(currentUser, comment);
    const updated = await this.sessionCommentsDataService.updateBody(
      commentId,
      normalizeBody(input.body),
    );

    if (updated === null) {
      throw new NotFoundException('Session comment was not found.');
    }

    return mapSessionComment(updated);
  }

  async deleteSessionComment(
    sessionId: string,
    commentId: string,
    currentUser: AuthenticatedUserContext,
  ): Promise<void> {
    const comment = await this.resolveSessionComment(sessionId, commentId);
    this.assertCanManageComment(currentUser, comment);
    await this.sessionCommentsDataService.setStatus(commentId, 'deleted');
  }

  async createContentReport(
    currentUser: AuthenticatedUserContext,
    input: CreateContentReportDto,
  ): Promise<ContentReportResponseDto> {
    await this.ensureReportTargetExists(input.targetType, input.targetId);
    const report = await this.contentReportsDataService.create({
      reporterUserId: currentUser.userId,
      targetType: input.targetType,
      targetId: input.targetId,
      reason: input.reason,
      details: normalizeNullableText(input.details),
    });

    return mapReport(report);
  }

  private async ensureGuideExists(guideId: string): Promise<Guide> {
    const guide = await this.guidesDataService.findById(guideId);

    if (guide === null) {
      throw new NotFoundException('Guide was not found.');
    }

    return guide;
  }

  private async resolveGuideComment(
    guideId: string,
    commentId: string,
  ): Promise<GuideComment> {
    const comment = await this.guideCommentsDataService.findById(commentId);

    if (
      comment === null ||
      comment.guideId !== guideId ||
      comment.status === 'deleted'
    ) {
      throw new NotFoundException('Guide comment was not found.');
    }

    return comment;
  }

  private async resolveSessionComment(
    sessionId: string,
    commentId: string,
  ): Promise<SessionComment> {
    const comment = await this.sessionCommentsDataService.findById(commentId);

    if (
      comment === null ||
      comment.sessionId !== sessionId ||
      comment.status === 'deleted'
    ) {
      throw new NotFoundException('Session comment was not found.');
    }

    return comment;
  }

  private async resolveViewableSession(
    sessionId: string,
    currentUser?: AuthenticatedUserContext,
  ): Promise<GamingSession> {
    const row = await this.gamingSessionsDataService.findSummaryById(sessionId);

    if (row === null) {
      throw new NotFoundException('Session was not found.');
    }

    if (row.session.visibility === 'public') {
      return row.session;
    }

    if (currentUser === undefined) {
      throw new NotFoundException('Session was not found.');
    }

    if (canManageSession(currentUser, row.session)) {
      return row.session;
    }

    const canView = await this.gamingSessionsDataService.canViewPrivateSession(
      sessionId,
      currentUser.userId,
    );

    if (!canView) {
      throw new NotFoundException('Session was not found.');
    }

    return row.session;
  }

  private assertCanManageComment(
    currentUser: AuthenticatedUserContext,
    comment: Pick<GuideComment | SessionComment, 'userId'>,
  ): void {
    if (
      currentUser.userId !== comment.userId &&
      currentUser.user.role !== 'admin' &&
      currentUser.user.role !== 'moderator'
    ) {
      throw new ForbiddenException('You can manage only your own comments.');
    }
  }

  private async ensureReportTargetExists(
    targetType: CreateContentReportDto['targetType'],
    targetId: string,
  ): Promise<void> {
    if (targetType === 'guide') {
      await this.ensureGuideExists(targetId);
      return;
    }

    if (targetType === 'guide_comment') {
      const comment = await this.guideCommentsDataService.findById(targetId);
      if (comment !== null) {
        return;
      }
    }

    if (targetType === 'gaming_session') {
      const session = await this.gamingSessionsDataService.findById(targetId);
      if (session !== null) {
        return;
      }
    }

    if (targetType === 'session_comment') {
      const comment = await this.sessionCommentsDataService.findById(targetId);
      if (comment !== null) {
        return;
      }
    }

    throw new NotFoundException('Reported content was not found.');
  }
}

function canManageSession(
  currentUser: AuthenticatedUserContext,
  session: Pick<GamingSession, 'hostUserId'>,
): boolean {
  return (
    currentUser.userId === session.hostUserId ||
    currentUser.user.role === 'admin' ||
    currentUser.user.role === 'moderator'
  );
}

function toGuideVoteValue(value: number): GuideVoteValue {
  if (value === 1 || value === -1) {
    return value;
  }

  throw new BadRequestException('Guide vote value must be 1 or -1.');
}

function mapGuideComment(row: GuideCommentWithAuthor): CommentResponseDto {
  return {
    id: row.comment.id,
    body: row.comment.body,
    status: row.comment.status,
    createdAt: row.comment.createdAt.toISOString(),
    updatedAt: row.comment.updatedAt.toISOString(),
    author: row.author,
  };
}

function mapSessionComment(row: SessionCommentWithAuthor): CommentResponseDto {
  return {
    id: row.comment.id,
    body: row.comment.body,
    status: row.comment.status,
    createdAt: row.comment.createdAt.toISOString(),
    updatedAt: row.comment.updatedAt.toISOString(),
    author: row.author,
  };
}

function mapReport(report: ContentReport): ContentReportResponseDto {
  return {
    id: report.id,
    targetType: report.targetType,
    reason: report.reason,
    status: report.status,
    createdAt: report.createdAt.toISOString(),
  };
}

function normalizeBody(value: string): string {
  const body = value.trim();

  if (body.length === 0) {
    throw new BadRequestException('Comment body cannot be empty.');
  }

  return body;
}

function normalizeNullableText(value: string | null | undefined): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}
