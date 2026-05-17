import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { describe, expect, it, vi } from 'vitest';

import type { ActivityEventsDataService } from '../../db/services/activity-events-data.service';
import type { ContentReportsDataService } from '../../db/services/content-reports-data.service';
import type { GuideCommentsDataService } from '../../db/services/guide-comments-data.service';
import type { GuideVotesDataService } from '../../db/services/guide-votes-data.service';
import type { GuidesDataService } from '../../db/services/guides-data.service';
import type { GamingSessionsDataService } from '../../db/services/gaming-sessions-data.service';
import type { SessionCommentsDataService } from '../../db/services/session-comments-data.service';
import type { AuthenticatedUserContext } from '../auth/authenticated-user.types';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import {
  ContentReportReasonDto,
  ContentReportTargetTypeDto,
  GuideVoteValueDto,
} from './dto/community-request.dto';
import { CommunityService } from './community.service';
import { ReportsController } from './reports.controller';

describe('CommunityService', () => {
  it('upserts guide votes and returns current user summary', async () => {
    const { service, guideVotesDataService, activityEventsDataService } =
      createService();

    await expect(
      service.upsertGuideVote('guide-id', userContext(), {
        value: GuideVoteValueDto.Upvote,
      }),
    ).resolves.toMatchObject({ score: 1, currentUserVote: 1 });

    expect(guideVotesDataService.upsert).toHaveBeenCalledWith(
      'guide-id',
      'user-id',
      1,
    );
    expect(activityEventsDataService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: 'user-id',
        eventType: 'guide_voted',
        entityType: 'guide',
        entityId: 'guide-id',
        steamAppId: 910001,
      }),
    );
  });

  it('lists only visible guide comments from the data service', async () => {
    const { service } = createService();

    await expect(service.listGuideComments('guide-id')).resolves.toMatchObject({
      items: [
        {
          id: 'comment-id',
          body: 'Helpful note',
          author: { steamId: '76561198000000000' },
        },
      ],
    });
  });

  it('does not list hidden guide comments as visible comments', async () => {
    const { service } = createService({ guideCommentStatus: 'hidden' });

    await expect(service.listGuideComments('guide-id')).resolves.toMatchObject({
      items: [],
    });
  });

  it('does not list deleted guide comments as visible comments', async () => {
    const { service } = createService({ guideCommentStatus: 'deleted' });

    await expect(service.listGuideComments('guide-id')).resolves.toMatchObject({
      items: [],
    });
  });

  it('allows authors to update their own guide comments', async () => {
    const { service, guideCommentsDataService } = createService();

    await expect(
      service.updateGuideComment('guide-id', 'comment-id', userContext(), {
        body: 'Edited',
      }),
    ).resolves.toMatchObject({ id: 'comment-id' });

    expect(guideCommentsDataService.updateBody).toHaveBeenCalledWith(
      'comment-id',
      'Edited',
    );
  });

  it('rejects non-author guide comment edits', async () => {
    const { service } = createService();

    await expect(
      service.updateGuideComment(
        'guide-id',
        'comment-id',
        userContext({ userId: 'other-user' }),
        {
          body: 'Edited',
        },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects non-author guide comment deletes', async () => {
    const { service } = createService();

    await expect(
      service.deleteGuideComment(
        'guide-id',
        'comment-id',
        userContext({ userId: 'other-user' }),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('soft-deletes author guide comments instead of hard deleting', async () => {
    const { service, guideCommentsDataService } = createService();

    await service.deleteGuideComment('guide-id', 'comment-id', userContext());

    expect(guideCommentsDataService.setStatus).toHaveBeenCalledWith(
      'comment-id',
      'deleted',
    );
  });

  it('allows moderators to soft-delete guide comments', async () => {
    const { service, guideCommentsDataService } = createService();

    await service.deleteGuideComment(
      'guide-id',
      'comment-id',
      userContext({ role: 'moderator', userId: 'moderator-id' }),
    );

    expect(guideCommentsDataService.setStatus).toHaveBeenCalledWith(
      'comment-id',
      'deleted',
    );
  });

  it('keeps private session comments hidden from anonymous users', async () => {
    const { service } = createService({ sessionVisibility: 'private' });

    await expect(service.listSessionComments('session-id')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('allows joined users to read private session comments', async () => {
    const { service, gamingSessionsDataService } = createService({
      sessionVisibility: 'private',
      canViewPrivateSession: true,
    });

    await expect(
      service.listSessionComments('session-id', userContext({ userId: 'participant-id' })),
    ).resolves.toMatchObject({ items: [{ id: 'session-comment-id' }] });

    expect(gamingSessionsDataService.canViewPrivateSession).toHaveBeenCalledWith(
      'session-id',
      'participant-id',
    );
  });

  it('records activity when creating guide comments', async () => {
    const { service, activityEventsDataService } = createService();

    await service.createGuideComment('guide-id', userContext(), {
      body: 'Helpful note',
    });

    expect(activityEventsDataService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: 'user-id',
        eventType: 'guide_commented',
        entityType: 'guide_comment',
        entityId: 'comment-id',
        steamAppId: 910001,
      }),
    );
  });

  it('does not list hidden session comments as visible comments', async () => {
    const { service } = createService({ sessionCommentStatus: 'hidden' });

    await expect(service.listSessionComments('session-id')).resolves.toMatchObject(
      {
        items: [],
      },
    );
  });

  it('does not list deleted session comments as visible comments', async () => {
    const { service } = createService({ sessionCommentStatus: 'deleted' });

    await expect(service.listSessionComments('session-id')).resolves.toMatchObject(
      {
        items: [],
      },
    );
  });

  it('allows authors to update their own session comments', async () => {
    const { service, sessionCommentsDataService } = createService();

    await expect(
      service.updateSessionComment('session-id', 'session-comment-id', userContext(), {
        body: 'Edited session note',
      }),
    ).resolves.toMatchObject({ id: 'session-comment-id' });

    expect(sessionCommentsDataService.updateBody).toHaveBeenCalledWith(
      'session-comment-id',
      'Edited session note',
    );
  });

  it('rejects non-author session comment deletes', async () => {
    const { service } = createService();

    await expect(
      service.deleteSessionComment(
        'session-id',
        'session-comment-id',
        userContext({ userId: 'other-user' }),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('soft-deletes session comments instead of hard deleting', async () => {
    const { service, sessionCommentsDataService } = createService();

    await service.deleteSessionComment(
      'session-id',
      'session-comment-id',
      userContext(),
    );

    expect(sessionCommentsDataService.setStatus).toHaveBeenCalledWith(
      'session-comment-id',
      'deleted',
    );
  });

  it('records activity when creating session comments', async () => {
    const { service, activityEventsDataService } = createService();

    await service.createSessionComment('session-id', userContext(), {
      body: 'Session note',
    });

    expect(activityEventsDataService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: 'user-id',
        eventType: 'session_commented',
        entityType: 'session_comment',
        entityId: 'session-comment-id',
        steamAppId: 910001,
      }),
    );
  });

  it.each([
    [ContentReportTargetTypeDto.Guide, 'guide-id'],
    [ContentReportTargetTypeDto.GuideComment, 'comment-id'],
    [ContentReportTargetTypeDto.GamingSession, 'session-id'],
    [ContentReportTargetTypeDto.SessionComment, 'session-comment-id'],
  ])(
    'validates %s report targets before creating reports',
    async (targetType, targetId) => {
      const { service, contentReportsDataService } = createService();

      await expect(
        service.createContentReport(userContext(), {
          targetType,
          targetId,
          reason: ContentReportReasonDto.Spam,
        }),
      ).resolves.toMatchObject({ id: 'report-id', status: 'open' });

      expect(contentReportsDataService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          reporterUserId: 'user-id',
          targetType,
          reason: 'spam',
        }),
      );
    },
  );

  it('rejects reports for missing targets', async () => {
    const { service } = createService({ guideExists: false });

    await expect(
      service.createContentReport(userContext(), {
        targetType: ContentReportTargetTypeDto.Guide,
        targetId: 'missing-guide',
        reason: ContentReportReasonDto.Other,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects reports for missing guide comment targets', async () => {
    const { service } = createService({ guideCommentExists: false });

    await expect(
      service.createContentReport(userContext(), {
        targetType: ContentReportTargetTypeDto.GuideComment,
        targetId: 'missing-comment',
        reason: ContentReportReasonDto.Other,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects reports for invalid target types', async () => {
    const { service } = createService();

    await expect(
      service.createContentReport(userContext(), {
        targetType: 'invalid_target' as ContentReportTargetTypeDto,
        targetId: 'target-id',
        reason: ContentReportReasonDto.Other,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('requires authentication for report creation at the controller', () => {
    const guards = Reflect.getMetadata(
      GUARDS_METADATA,
      ReportsController.prototype.createContentReport,
    );

    expect(guards).toContain(SessionAuthGuard);
  });
});

const now = new Date('2026-01-01T00:00:00.000Z');

function createService(
  options: {
    guideExists?: boolean;
    guideCommentExists?: boolean;
    guideCommentStatus?: 'visible' | 'hidden' | 'deleted';
    sessionExists?: boolean;
    sessionVisibility?: 'public' | 'unlisted' | 'private';
    canViewPrivateSession?: boolean;
    sessionCommentExists?: boolean;
    sessionCommentStatus?: 'visible' | 'hidden' | 'deleted';
  } = {},
) {
  const guide = {
    id: 'guide-id',
    steamAppId: 910001,
    authorUserId: 'author-id',
    title: 'Guide',
    slug: 'guide',
    summary: null,
    status: 'published',
    visibility: 'public',
    estimatedDifficulty: null,
    estimatedHours: null,
    isSpoilerHeavy: false,
    publishedAt: now,
    createdAt: now,
    updatedAt: now,
  };
  const guidesDataService = {
    findById: vi.fn(async () => (options.guideExists === false ? null : guide)),
  };
  const guideVotesDataService = {
    getSummary: vi.fn(async () => ({
      upvotes: 1,
      downvotes: 0,
      score: 1,
      currentUserVote: 1,
    })),
    upsert: vi.fn(async () => ({
      id: 'vote-id',
      guideId: 'guide-id',
      userId: 'user-id',
      value: 1,
      createdAt: now,
      updatedAt: now,
    })),
    remove: vi.fn(async () => true),
  };
  const guideComment = {
    id: 'comment-id',
    guideId: 'guide-id',
    userId: 'user-id',
    body: 'Helpful note',
    status: options.guideCommentStatus ?? 'visible',
    createdAt: now,
    updatedAt: now,
  };
  const guideCommentWithAuthor = {
    comment: guideComment,
    author: {
      displayName: 'Guide User',
      steamId: '76561198000000000',
      avatarUrl: null,
      publicSlug: 'nero',
    },
  };
  const guideCommentsDataService = {
    create: vi.fn(async () => guideCommentWithAuthor),
    findById: vi.fn(async () =>
      options.guideCommentExists === false ? null : guideComment,
    ),
    findVisibleByGuideId: vi.fn(async () =>
      guideComment.status === 'visible' ? [guideCommentWithAuthor] : [],
    ),
    updateBody: vi.fn(async () => guideCommentWithAuthor),
    setStatus: vi.fn(async () => ({
      ...guideCommentWithAuthor,
      comment: { ...guideComment, status: 'deleted' },
    })),
  };
  const session = {
    id: 'session-id',
    steamAppId: 910001,
    hostUserId: 'host-id',
    title: 'Session',
    description: null,
    status: 'open',
    visibility: options.sessionVisibility ?? 'public',
    scheduledStartAt: now,
    scheduledEndAt: null,
    timezone: null,
    maxParticipants: 4,
    externalVoiceUrl: null,
    createdAt: now,
    updatedAt: now,
  };
  const gamingSessionsDataService = {
    findById: vi.fn(async () => (options.sessionExists === false ? null : session)),
    findSummaryById: vi.fn(async () =>
      options.sessionExists === false
        ? null
        : {
            session,
            game: {
              steamAppId: 910001,
              name: 'Demo Game',
              iconUrl: null,
              logoUrl: null,
            },
            host: {
              displayName: 'Host',
              steamId: '76561198000000000',
              avatarUrl: null,
              publicSlug: null,
            },
            participantCount: 1,
            achievementCount: 0,
          },
    ),
    canViewPrivateSession: vi.fn(async () => options.canViewPrivateSession ?? false),
  };
  const sessionComment = {
    id: 'session-comment-id',
    sessionId: 'session-id',
    userId: 'user-id',
    body: 'Session note',
    status: options.sessionCommentStatus ?? 'visible',
    createdAt: now,
    updatedAt: now,
  };
  const sessionCommentWithAuthor = {
    comment: sessionComment,
    author: {
      displayName: 'Session User',
      steamId: '76561198000000000',
      avatarUrl: null,
      publicSlug: null,
    },
  };
  const sessionCommentsDataService = {
    create: vi.fn(async () => sessionCommentWithAuthor),
    findById: vi.fn(async () =>
      options.sessionCommentExists === false ? null : sessionComment,
    ),
    findVisibleBySessionId: vi.fn(async () =>
      sessionComment.status === 'visible' ? [sessionCommentWithAuthor] : [],
    ),
    updateBody: vi.fn(async () => sessionCommentWithAuthor),
    setStatus: vi.fn(async () => ({
      ...sessionCommentWithAuthor,
      comment: { ...sessionComment, status: 'deleted' },
    })),
  };
  const contentReportsDataService = {
    create: vi.fn(
      async (input: Parameters<ContentReportsDataService['create']>[0]) => ({
      id: 'report-id',
      reporterUserId: input.reporterUserId,
      targetType: input.targetType,
      targetId: input.targetId,
      reason: input.reason,
      details: input.details,
      status: 'open',
      createdAt: now,
      updatedAt: now,
      }),
    ),
  };
  const activityEventsDataService = {
    create: vi.fn(async () => ({ id: 'activity-id' })),
  };

  return {
    service: new CommunityService(
      guidesDataService as unknown as GuidesDataService,
      guideVotesDataService as unknown as GuideVotesDataService,
      guideCommentsDataService as unknown as GuideCommentsDataService,
      gamingSessionsDataService as unknown as GamingSessionsDataService,
      sessionCommentsDataService as unknown as SessionCommentsDataService,
      contentReportsDataService as unknown as ContentReportsDataService,
      activityEventsDataService as unknown as ActivityEventsDataService,
    ),
    guideVotesDataService,
    guideCommentsDataService,
    gamingSessionsDataService,
    sessionCommentsDataService,
    contentReportsDataService,
    activityEventsDataService,
  };
}

function userContext(
  overrides: Partial<AuthenticatedUserContext & { role: string }> = {},
): AuthenticatedUserContext {
  return {
    userId: overrides.userId ?? 'user-id',
    user: {
      id: overrides.userId ?? 'user-id',
      displayName: 'Steam User',
      avatarUrl: null,
      role: overrides.role ?? 'user',
      status: 'active',
    },
    steamAccount: null,
    publicProfile: null,
  };
}
