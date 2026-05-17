import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { GamesDataService } from '../../db/services/games-data.service';
import { ActivityEventsDataService } from '../../db/services/activity-events-data.service';
import {
  GamingSessionAchievementsDataService,
  type SessionAchievementWithAchievement,
} from '../../db/services/gaming-session-achievements-data.service';
import {
  GamingSessionParticipantsDataService,
  type GamingSessionParticipant,
  type ParticipantWithUser,
} from '../../db/services/gaming-session-participants-data.service';
import {
  GamingSessionsDataService,
  type GamingSession,
  type SessionListFilters,
  type SessionSummaryRow,
} from '../../db/services/gaming-sessions-data.service';
import type { AuthenticatedUserContext } from '../auth/authenticated-user.types';
import type {
  AddSessionAchievementsDto,
  CreateGamingSessionDto,
  UpdateGamingSessionDto,
} from './dto/gaming-session-request.dto';
import type {
  GlobalSessionListQueryDto,
  SessionListQueryDto,
} from './dto/gaming-session-query.dto';
import type {
  AddSessionAchievementsResponseDto,
  GamingSessionAchievementResponseDto,
  GamingSessionDetailResponseDto,
  GamingSessionListResponseDto,
  GamingSessionParticipantResponseDto,
  GamingSessionSummaryResponseDto,
  SessionUserResponseDto,
} from './dto/gaming-session-response.dto';

@Injectable()
export class GamingSessionsService {
  constructor(
    private readonly gamesDataService: GamesDataService,
    private readonly gamingSessionsDataService: GamingSessionsDataService,
    private readonly gamingSessionParticipantsDataService: GamingSessionParticipantsDataService,
    private readonly gamingSessionAchievementsDataService: GamingSessionAchievementsDataService,
    private readonly activityEventsDataService: ActivityEventsDataService,
  ) {}

  async listGlobalSessions(
    query: GlobalSessionListQueryDto,
  ): Promise<GamingSessionListResponseDto> {
    const filters = mapListFilters(query);
    const [items, total] = await Promise.all([
      this.gamingSessionsDataService.findSummaries(filters),
      this.gamingSessionsDataService.countSummaries(filters),
    ]);

    return {
      items: items.map(mapSessionSummary),
      total,
      limit: query.limit,
      offset: query.offset,
    };
  }

  async listGameSessions(
    steamAppId: number,
    query: SessionListQueryDto,
  ): Promise<GamingSessionListResponseDto> {
    await this.ensureGameExists(steamAppId);

    const filters = mapListFilters({ ...query, steamAppId });
    const [items, total] = await Promise.all([
      this.gamingSessionsDataService.findSummaries(filters),
      this.gamingSessionsDataService.countSummaries(filters),
    ]);

    return {
      items: items.map(mapSessionSummary),
      total,
      limit: query.limit,
      offset: query.offset,
    };
  }

  async getSession(
    sessionId: string,
    currentUser?: AuthenticatedUserContext,
  ): Promise<GamingSessionDetailResponseDto> {
    const row = await this.resolveViewableSession(sessionId, currentUser);

    return this.buildSessionDetail(row);
  }

  async createGameSession(
    steamAppId: number,
    currentUser: AuthenticatedUserContext,
    input: CreateGamingSessionDto,
  ): Promise<GamingSessionDetailResponseDto> {
    await this.ensureGameExists(steamAppId);
    const scheduledStartAt = parseDate(input.scheduledStartAt);
    const scheduledEndAt = parseNullableDate(input.scheduledEndAt);
    assertFutureStart(scheduledStartAt);
    assertEndAfterStart(scheduledStartAt, scheduledEndAt);

    const session = await this.gamingSessionsDataService.createWithHost({
      steamAppId,
      hostUserId: currentUser.userId,
      title: input.title.trim(),
      description: normalizeNullableText(input.description),
      scheduledStartAt,
      scheduledEndAt,
      timezone: normalizeNullableText(input.timezone),
      maxParticipants: input.maxParticipants,
      visibility: input.visibility,
      externalVoiceUrl: normalizeNullableText(input.externalVoiceUrl),
    });

    const row = await this.gamingSessionsDataService.findSummaryById(session.id);

    if (row === null) {
      throw new NotFoundException('Session was not found after creation.');
    }

    await this.activityEventsDataService.create({
      actorUserId: currentUser.userId,
      eventType: 'session_created',
      entityType: 'gaming_session',
      entityId: session.id,
      steamAppId: session.steamAppId,
      metadata: {
        title: session.title,
        steamAppId: session.steamAppId,
        scheduledStartAt: session.scheduledStartAt.toISOString(),
      },
    });

    return this.buildSessionDetail(row);
  }

  async updateSession(
    sessionId: string,
    currentUser: AuthenticatedUserContext,
    input: UpdateGamingSessionDto,
  ): Promise<GamingSessionDetailResponseDto> {
    const session = await this.resolveManageableSession(sessionId, currentUser);
    const scheduledStartAt =
      input.scheduledStartAt === undefined
        ? undefined
        : parseDate(input.scheduledStartAt);
    const scheduledEndAt =
      input.scheduledEndAt === undefined
        ? undefined
        : parseNullableDate(input.scheduledEndAt);
    const nextStart = scheduledStartAt ?? session.scheduledStartAt;
    const nextEnd: Date | null =
      scheduledEndAt === undefined ? session.scheduledEndAt : scheduledEndAt;

    if (scheduledStartAt !== undefined) {
      assertFutureStart(scheduledStartAt);
    }
    assertEndAfterStart(nextStart, nextEnd);

    const updated = await this.gamingSessionsDataService.update(sessionId, {
      title: input.title === undefined ? undefined : input.title.trim(),
      description:
        input.description === undefined
          ? undefined
          : normalizeNullableText(input.description),
      scheduledStartAt,
      scheduledEndAt,
      timezone:
        input.timezone === undefined
          ? undefined
          : normalizeNullableText(input.timezone),
      maxParticipants: input.maxParticipants,
      visibility: input.visibility,
      status: input.status,
      externalVoiceUrl:
        input.externalVoiceUrl === undefined
          ? undefined
          : normalizeNullableText(input.externalVoiceUrl),
    });

    if (updated === null) {
      throw new NotFoundException('Session was not found.');
    }

    return this.getSession(sessionId, currentUser);
  }

  async joinSession(
    sessionId: string,
    currentUser: AuthenticatedUserContext,
  ): Promise<GamingSessionDetailResponseDto> {
    const session = await this.resolveJoinableSession(sessionId, currentUser);
    const existing =
      await this.gamingSessionParticipantsDataService.findBySessionAndUser(
        session.id,
        currentUser.userId,
      );

    if (existing?.status === 'joined') {
      throw new BadRequestException('You have already joined this session.');
    }

    const currentCount = await this.getJoinedParticipantCount(session.id);

    if (currentCount >= session.maxParticipants) {
      await this.gamingSessionsDataService.update(session.id, { status: 'full' });
      throw new BadRequestException('This session is already full.');
    }

    await this.gamingSessionParticipantsDataService.join(
      session.id,
      currentUser.userId,
    );

    const nextCount = currentCount + 1;
    if (nextCount >= session.maxParticipants && session.status === 'open') {
      await this.gamingSessionsDataService.update(session.id, { status: 'full' });
    }

    await this.activityEventsDataService.create({
      actorUserId: currentUser.userId,
      eventType: 'session_joined',
      entityType: 'gaming_session',
      entityId: session.id,
      steamAppId: session.steamAppId,
      metadata: {
        title: session.title,
        steamAppId: session.steamAppId,
      },
    });

    return this.getSession(session.id, currentUser);
  }

  async leaveSession(
    sessionId: string,
    currentUser: AuthenticatedUserContext,
  ): Promise<GamingSessionDetailResponseDto> {
    const session = await this.gamingSessionsDataService.findById(sessionId);

    if (session === null) {
      throw new NotFoundException('Session was not found.');
    }

    const participant =
      await this.gamingSessionParticipantsDataService.findBySessionAndUser(
        sessionId,
        currentUser.userId,
      );

    if (participant === null || participant.status !== 'joined') {
      throw new BadRequestException('You are not joined to this session.');
    }

    if (participant.role === 'host') {
      throw new BadRequestException(
        'Host leave is not supported yet. Cancel the session instead.',
      );
    }

    await this.gamingSessionParticipantsDataService.leave(
      sessionId,
      currentUser.userId,
    );

    if (session.status === 'full' && session.scheduledStartAt > new Date()) {
      await this.gamingSessionsDataService.update(sessionId, { status: 'open' });
    }

    return this.getSession(sessionId, currentUser);
  }

  async cancelSession(
    sessionId: string,
    currentUser: AuthenticatedUserContext,
  ): Promise<GamingSessionDetailResponseDto> {
    await this.resolveManageableSession(sessionId, currentUser);
    const updated = await this.gamingSessionsDataService.update(sessionId, {
      status: 'cancelled',
    });

    if (updated === null) {
      throw new NotFoundException('Session was not found.');
    }

    return this.getSession(sessionId, currentUser);
  }

  async addSessionAchievements(
    sessionId: string,
    currentUser: AuthenticatedUserContext,
    input: AddSessionAchievementsDto,
  ): Promise<AddSessionAchievementsResponseDto> {
    const session = await this.resolveManageableSession(sessionId, currentUser);
    const uniqueIds = Array.from(new Set(input.achievementIds));
    const validIds =
      await this.gamingSessionAchievementsDataService.findAchievementIdsForSteamApp(
        session.steamAppId,
        uniqueIds,
      );

    if (validIds.length !== uniqueIds.length) {
      throw new BadRequestException(
        'All achievements must belong to the same Steam game as the session.',
      );
    }

    const rows = await this.gamingSessionAchievementsDataService.addMany(
      sessionId,
      validIds,
    );

    return { added: rows.length };
  }

  async removeSessionAchievement(
    sessionId: string,
    achievementId: string,
    currentUser: AuthenticatedUserContext,
  ): Promise<void> {
    const session = await this.resolveManageableSession(sessionId, currentUser);
    const validIds =
      await this.gamingSessionAchievementsDataService.findAchievementIdsForSteamApp(
        session.steamAppId,
        [achievementId],
      );

    if (validIds.length !== 1) {
      throw new BadRequestException(
        'Achievement must belong to the same Steam game as the session.',
      );
    }

    await this.gamingSessionAchievementsDataService.remove(
      sessionId,
      achievementId,
    );
  }

  private async resolveViewableSession(
    sessionId: string,
    currentUser?: AuthenticatedUserContext,
  ): Promise<SessionSummaryRow> {
    const row = await this.gamingSessionsDataService.findSummaryById(sessionId);

    if (row === null) {
      throw new NotFoundException('Session was not found.');
    }

    if (row.session.visibility === 'public') {
      return row;
    }

    if (currentUser === undefined) {
      throw new NotFoundException('Session was not found.');
    }

    if (canManageSession(currentUser, row.session)) {
      return row;
    }

    const canView = await this.gamingSessionsDataService.canViewPrivateSession(
      sessionId,
      currentUser.userId,
    );

    if (!canView) {
      throw new NotFoundException('Session was not found.');
    }

    return row;
  }

  private async resolveJoinableSession(
    sessionId: string,
    currentUser: AuthenticatedUserContext,
  ): Promise<GamingSession> {
    const row = await this.resolveViewableSession(sessionId, currentUser);

    if (row.session.status === 'cancelled' || row.session.status === 'completed') {
      throw new BadRequestException('This session is not open for joining.');
    }

    if (row.session.status === 'full') {
      throw new BadRequestException('This session is already full.');
    }

    return row.session;
  }

  private async resolveManageableSession(
    sessionId: string,
    currentUser: AuthenticatedUserContext,
  ): Promise<GamingSession> {
    const session = await this.gamingSessionsDataService.findById(sessionId);

    if (session === null) {
      throw new NotFoundException('Session was not found.');
    }

    if (!canManageSession(currentUser, session)) {
      throw new ForbiddenException('You can manage only sessions you host.');
    }

    return session;
  }

  private async buildSessionDetail(
    row: SessionSummaryRow,
  ): Promise<GamingSessionDetailResponseDto> {
    const [participants, achievements] = await Promise.all([
      this.gamingSessionParticipantsDataService.findBySessionId(row.session.id),
      this.gamingSessionAchievementsDataService.findBySessionId(row.session.id),
    ]);

    return {
      ...mapSessionSummary(row),
      participants: participants.map(mapParticipant),
      achievements: achievements.map(mapAchievement),
    };
  }

  private async getJoinedParticipantCount(sessionId: string): Promise<number> {
    const participants =
      await this.gamingSessionParticipantsDataService.findBySessionId(sessionId);

    return participants.filter((row) => row.participant.status === 'joined').length;
  }

  private async ensureGameExists(steamAppId: number): Promise<void> {
    const game = await this.gamesDataService.findBySteamAppId(steamAppId);

    if (game === null) {
      throw new NotFoundException(`Game ${steamAppId} was not found.`);
    }
  }
}

function mapListFilters(
  query: SessionListQueryDto & { steamAppId?: number },
): SessionListFilters {
  return {
    steamAppId: query.steamAppId,
    status: query.status,
    from: query.from === undefined ? undefined : parseDate(query.from),
    to: query.to === undefined ? undefined : parseDate(query.to),
    limit: query.limit,
    offset: query.offset,
  };
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

function mapSessionSummary(row: SessionSummaryRow): GamingSessionSummaryResponseDto {
  return {
    id: row.session.id,
    steamAppId: row.game.steamAppId,
    gameName: row.game.name,
    gameIconUrl: row.game.iconUrl,
    title: row.session.title,
    description: row.session.description,
    status: row.session.status,
    visibility: row.session.visibility,
    scheduledStartAt: row.session.scheduledStartAt.toISOString(),
    scheduledEndAt: toIsoOrNull(row.session.scheduledEndAt),
    timezone: row.session.timezone,
    maxParticipants: row.session.maxParticipants,
    participantCount: row.participantCount,
    achievementCount: row.achievementCount,
    externalVoiceUrl: row.session.externalVoiceUrl,
    host: mapUser(row.host),
    createdAt: row.session.createdAt.toISOString(),
    updatedAt: row.session.updatedAt.toISOString(),
  };
}

function mapParticipant(
  row: ParticipantWithUser,
): GamingSessionParticipantResponseDto {
  return {
    role: row.participant.role,
    status: row.participant.status,
    joinedAt: row.participant.joinedAt.toISOString(),
    leftAt: toIsoOrNull(row.participant.leftAt),
    user: mapUser({
      displayName: row.user.displayName,
      steamId: row.steamAccount.steamId,
      avatarUrl: row.steamAccount.avatarUrl ?? row.user.avatarUrl,
      publicSlug: row.steamAccount.publicSlug,
    }),
  };
}

function mapAchievement(
  row: SessionAchievementWithAchievement,
): GamingSessionAchievementResponseDto {
  return {
    id: row.achievement.id,
    apiName: row.achievement.apiName,
    displayName: row.achievement.displayName,
    globalPercentage: row.achievement.globalPercentage,
    hidden: row.achievement.hidden,
  };
}

function mapUser(user: SessionUserResponseDto): SessionUserResponseDto {
  return {
    displayName: user.displayName,
    steamId: user.steamId,
    avatarUrl: user.avatarUrl,
    publicSlug: user.publicSlug,
  };
}

function parseDate(value: string): Date {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException('Invalid date value.');
  }

  return date;
}

function parseNullableDate(value: string | null | undefined): Date | null {
  if (value === undefined || value === null || value.trim().length === 0) {
    return null;
  }

  return parseDate(value);
}

function assertFutureStart(scheduledStartAt: Date): void {
  if (scheduledStartAt <= new Date()) {
    throw new BadRequestException('Session start time must be in the future.');
  }
}

function assertEndAfterStart(
  scheduledStartAt: Date,
  scheduledEndAt: Date | null,
): void {
  if (scheduledEndAt !== null && scheduledEndAt <= scheduledStartAt) {
    throw new BadRequestException('Session end time must be after start time.');
  }
}

function normalizeNullableText(value: string | null | undefined): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function toIsoOrNull(value: Date | null): string | null {
  return value === null ? null : value.toISOString();
}
