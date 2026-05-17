import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import type { ActivityEventsDataService } from '../../db/services/activity-events-data.service';
import type { GamesDataService } from '../../db/services/games-data.service';
import type { GamingSessionAchievementsDataService } from '../../db/services/gaming-session-achievements-data.service';
import type {
  GamingSessionParticipant,
  GamingSessionParticipantsDataService,
} from '../../db/services/gaming-session-participants-data.service';
import type {
  GamingSession,
  GamingSessionsDataService,
  SessionSummaryRow,
} from '../../db/services/gaming-sessions-data.service';
import type { AuthenticatedUserContext } from '../auth/authenticated-user.types';
import {
  GamingSessionStatusDto,
  GamingSessionVisibilityDto,
} from './dto/gaming-session-request.dto';
import { GamingSessionsService } from './gaming-sessions.service';

describe('GamingSessionsService', () => {
  it('lists public game sessions from the data service', async () => {
    const { service } = createService();

    await expect(
      service.listGameSessions(910001, { status: GamingSessionStatusDto.Open, limit: 20, offset: 0 }),
    ).resolves.toMatchObject({
      total: 1,
      items: [
        {
          steamAppId: 910001,
          title: 'Demo Boosting Session',
          status: 'open',
          visibility: 'public',
          participantCount: 1,
        },
      ],
    });
  });

  it('creates a session and adds the host through the data service', async () => {
    const { service, gamingSessionsDataService, activityEventsDataService } =
      createService();

    const result = await service.createGameSession(910001, userContext(), {
      title: 'Demo Boosting Session',
      scheduledStartAt: futureDate.toISOString(),
      maxParticipants: 4,
      visibility: GamingSessionVisibilityDto.Public,
    });

    expect(gamingSessionsDataService.createWithHost).toHaveBeenCalledWith(
      expect.objectContaining({
        hostUserId: 'host-user-id',
        steamAppId: 910001,
        title: 'Demo Boosting Session',
      }),
    );
    expect(result.participants).toHaveLength(1);
    expect(activityEventsDataService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: 'host-user-id',
        eventType: 'session_created',
        entityType: 'gaming_session',
        entityId: 'session-id',
        steamAppId: 910001,
      }),
    );
  });

  it('rejects non-host updates', async () => {
    const { service } = createService({
      session: createSession({ hostUserId: 'other-user-id' }),
    });

    await expect(
      service.updateSession('session-id', userContext(), { title: 'New title' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows moderator updates', async () => {
    const { service, gamingSessionsDataService } = createService();

    await service.updateSession('session-id', userContext({ role: 'moderator' }), {
      status: GamingSessionStatusDto.Cancelled,
    });

    expect(gamingSessionsDataService.update).toHaveBeenCalledWith(
      'session-id',
      expect.objectContaining({ status: 'cancelled' }),
    );
  });

  it('lets a participant join an open session', async () => {
    const { service, participantsDataService, activityEventsDataService } =
      createService({
      existingParticipant: null,
    });

    await service.joinSession('session-id', userContext({ userId: 'participant-id' }));

    expect(participantsDataService.join).toHaveBeenCalledWith(
      'session-id',
      'participant-id',
    );
    expect(activityEventsDataService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: 'participant-id',
        eventType: 'session_joined',
        entityType: 'gaming_session',
        entityId: 'session-id',
        steamAppId: 910001,
      }),
    );
  });

  it('rejects duplicate joins', async () => {
    const { service } = createService({
      existingParticipant: createParticipant({ userId: 'participant-id' }),
    });

    await expect(
      service.joinSession('session-id', userContext({ userId: 'participant-id' })),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects host leave in v1', async () => {
    const { service } = createService({
      existingParticipant: createParticipant({ role: 'host' }),
    });

    await expect(
      service.leaveSession('session-id', userContext()),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects cross-game achievement mappings', async () => {
    const { service } = createService({ validAchievementIds: [] });

    await expect(
      service.addSessionAchievements('session-id', userContext(), {
        achievementIds: ['00000000-0000-4000-8000-000000000001'],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('keeps private session details hidden from anonymous users', async () => {
    const { service } = createService({
      session: createSession({ visibility: 'private' }),
    });

    await expect(service.getSession('session-id')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

const now = new Date('2026-01-01T00:00:00.000Z');
const futureDate = new Date('2026-05-18T15:00:00.000Z');

function createService(
  options: {
    gameExists?: boolean;
    session?: GamingSession;
    existingParticipant?: ReturnType<typeof createParticipant> | null;
    validAchievementIds?: string[];
  } = {},
) {
  const session = options.session ?? createSession();
  const summary = createSummary(session);
  const gamesDataService = {
    findBySteamAppId: vi.fn(async () =>
      options.gameExists === false
        ? null
        : {
            id: 'game-id',
            steamAppId: 910001,
            name: 'Demo Complete Quest',
            iconUrl: null,
            logoUrl: null,
            hasAchievements: true,
            createdAt: now,
            updatedAt: now,
          },
    ),
  };
  const gamingSessionsDataService = {
    createWithHost: vi.fn(async () => session),
    update: vi.fn(async () => session),
    findById: vi.fn(async () => session),
    findSummaries: vi.fn(async () => [summary]),
    countSummaries: vi.fn(async () => 1),
    findSummaryById: vi.fn(async () => summary),
    canViewPrivateSession: vi.fn(async () => false),
  };
  const existingParticipant =
    options.existingParticipant === undefined
      ? createParticipant()
      : options.existingParticipant;
  const participantsDataService = {
    findBySessionId: vi.fn(async () => [
      {
        participant: createParticipant(),
        user: { displayName: 'Host', avatarUrl: null },
        steamAccount: {
          steamId: '76561198000000000',
          avatarUrl: null,
          publicSlug: 'nero',
        },
      },
    ]),
    findBySessionAndUser: vi.fn(async () => existingParticipant),
    join: vi.fn(async () => createParticipant({ userId: 'participant-id' })),
    leave: vi.fn(async () => true),
  };
  const achievementsDataService = {
    findBySessionId: vi.fn(async () => [
      {
        mapping: {
          id: 'mapping-id',
          sessionId: 'session-id',
          achievementId: 'achievement-id',
          createdAt: now,
        },
        achievement: {
          id: 'achievement-id',
          steamAppId: 910001,
          apiName: 'ACH_ONE',
          displayName: 'First Step',
          description: 'Start playing.',
          iconUrl: null,
          iconGrayUrl: null,
          hidden: false,
          globalPercentage: 12.3,
          createdAt: now,
          updatedAt: now,
        },
      },
    ]),
    findAchievementIdsForSteamApp: vi.fn(async () =>
      options.validAchievementIds ?? ['00000000-0000-4000-8000-000000000001'],
    ),
    addMany: vi.fn(async () => [
      {
        id: 'mapping-id',
        sessionId: 'session-id',
        achievementId: 'achievement-id',
        createdAt: now,
      },
    ]),
    remove: vi.fn(async () => true),
  };
  const activityEventsDataService = {
    create: vi.fn(async () => ({ id: 'activity-id' })),
  };

  return {
    service: new GamingSessionsService(
      gamesDataService as unknown as GamesDataService,
      gamingSessionsDataService as unknown as GamingSessionsDataService,
      participantsDataService as unknown as GamingSessionParticipantsDataService,
      achievementsDataService as unknown as GamingSessionAchievementsDataService,
      activityEventsDataService as unknown as ActivityEventsDataService,
    ),
    gamingSessionsDataService,
    participantsDataService,
    activityEventsDataService,
  };
}

function createSession(overrides: Partial<GamingSession> = {}): GamingSession {
  return {
    id: 'session-id',
    steamAppId: 910001,
    hostUserId: 'host-user-id',
    title: 'Demo Boosting Session',
    description: 'Local smoke session',
    status: 'open',
    visibility: 'public',
    scheduledStartAt: futureDate,
    scheduledEndAt: null,
    timezone: 'Asia/Kolkata',
    maxParticipants: 4,
    externalVoiceUrl: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function createSummary(session = createSession()): SessionSummaryRow {
  return {
    session,
    game: {
      steamAppId: 910001,
      name: 'Demo Complete Quest',
      iconUrl: null,
      logoUrl: null,
    },
    host: {
      displayName: 'Host',
      steamId: '76561198000000000',
      avatarUrl: null,
      publicSlug: 'nero',
    },
    participantCount: 1,
    achievementCount: 1,
  };
}

function createParticipant(
  overrides: Partial<GamingSessionParticipant> = {},
): GamingSessionParticipant {
  return {
    id: 'participant-id',
    sessionId: 'session-id',
    userId: 'host-user-id',
    role: 'participant',
    status: 'joined',
    joinedAt: now,
    leftAt: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function userContext(
  overrides: { userId?: string; role?: string } = {},
): AuthenticatedUserContext {
  const userId = overrides.userId ?? 'host-user-id';
  return {
    userId,
    user: {
      id: userId,
      displayName: 'Host',
      avatarUrl: null,
      role: overrides.role ?? 'user',
      status: 'active',
    },
    steamAccount: null,
    publicProfile: null,
  };
}
