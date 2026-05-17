import 'reflect-metadata';

import { Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { and, asc, eq, inArray } from 'drizzle-orm';

import { DatabaseModule } from '../db/database.module';
import { DatabaseService } from '../db/database.service';
import { AppUsersRepository } from '../db/repositories/app-users.repository';
import { AuthCallbackRepository } from '../db/repositories/auth-callback.repository';
import { AuthSessionsRepository } from '../db/repositories/auth-sessions.repository';
import { AppUsersDataService } from '../db/services/app-users-data.service';
import { AuthCallbackDataService } from '../db/services/auth-callback-data.service';
import { AuthSessionsDataService } from '../db/services/auth-sessions-data.service';
import {
  appUsers,
  achievements,
  sessionComments,
  gamingSessionAchievements,
  gamingSessionParticipants,
  gamingSessions,
  steamProfiles,
} from '../db/schema';
import { getAuthConfig } from '../modules/auth/auth.config';
import { SessionService } from '../modules/auth/session.service';

@Module({
  imports: [DatabaseModule],
})
class SessionAuthSmokeModule {}

const DEFAULT_API_BASE_URL = 'http://localhost:3000';
const DEMO_STEAM_ID = '76561198000000000';
const DEMO_APP_ID = 910001;
const SESSION_TITLE = 'Demo Boosting Session';
const SESSION_DESCRIPTION =
  'Local smoke session created by deterministic session auth smoke.';
const HOST_DISPLAY_NAME = 'Session Smoke Host';
const PARTICIPANT_DISPLAY_NAME = 'Session Smoke Participant';

interface SessionDetail {
  id: string;
  steamAppId: number;
  title: string;
  status: string;
  visibility: string;
  participantCount: number;
  achievementCount: number;
  participants: unknown[];
  achievements: unknown[];
}

interface SessionList {
  items: Array<{ id: string; title: string }>;
}

interface CommentList {
  items: Array<{ id: string; body: string }>;
}

interface CommentResponse {
  id: string;
  body: string;
}

interface ActivityList {
  items: Array<{ eventType: string; entityId: string | null; steamAppId: number | null }>;
}

async function main(): Promise<void> {
  const apiBaseUrl = normalizeApiBaseUrl(
    process.env.API_BASE_URL ?? DEFAULT_API_BASE_URL,
  );
  const app = await NestFactory.createApplicationContext(SessionAuthSmokeModule, {
    abortOnError: false,
    logger: ['error'],
  });
  const databaseService = app.get(DatabaseService);
  const authSessionsDataService = new AuthSessionsDataService(
    new AuthSessionsRepository(databaseService),
  );
  const sessionService = new SessionService(authSessionsDataService);
  const appUsersDataService = new AppUsersDataService(
    new AppUsersRepository(databaseService),
  );
  const authCallbackDataService = new AuthCallbackDataService(
    new AuthCallbackRepository(databaseService),
  );
  const sessionTokens: string[] = [];

  try {
    await assertSeedData(databaseService);

    const hostSession = sessionService.prepareSession({
      headers: { 'user-agent': 'session-auth-smoke-host' },
      ip: '127.0.0.1',
    });
    sessionTokens.push(hostSession.token);
    const hostAuth = await authCallbackDataService.persistSteamLogin({
      steamId: DEMO_STEAM_ID,
      profile: {
        personaName: HOST_DISPLAY_NAME,
        avatarUrl: null,
        profileUrl: null,
        visibilityState: 3,
      },
      session: {
        sessionTokenHash: hostSession.sessionTokenHash,
        userAgent: hostSession.userAgent,
        ipAddress: hostSession.ipAddress,
        expiresAt: hostSession.expiresAt,
      },
    });

    const participant = await findOrCreateSmokeParticipant(
      databaseService,
      appUsersDataService,
    );
    const participantSession = await sessionService.createSession(participant.id, {
      headers: { 'user-agent': 'session-auth-smoke-participant' },
      ip: '127.0.0.1',
    });
    sessionTokens.push(participantSession.token);

    await removePriorSmokeSessions(databaseService, hostAuth.userId);

    const hostCookieHeader = createCookieHeader(hostSession.token);
    const participantCookieHeader = createCookieHeader(participantSession.token);
    const achievementId = await findSmokeAchievementId(databaseService);
    const scheduledStartAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const scheduledEndAt = new Date(scheduledStartAt.getTime() + 90 * 60 * 1000);

    const createdSession = await requestJson<SessionDetail>(
      apiBaseUrl,
      `/games/${DEMO_APP_ID}/sessions`,
      {
        method: 'POST',
        cookieHeader: hostCookieHeader,
        body: {
          title: SESSION_TITLE,
          description: SESSION_DESCRIPTION,
          scheduledStartAt: scheduledStartAt.toISOString(),
          scheduledEndAt: scheduledEndAt.toISOString(),
          timezone: 'Asia/Kolkata',
          maxParticipants: 4,
          visibility: 'public',
        },
      },
      isSessionDetail,
    );

    await requestJson(
      apiBaseUrl,
      `/sessions/${createdSession.id}/achievements`,
      {
        method: 'POST',
        cookieHeader: hostCookieHeader,
        body: { achievementIds: [achievementId] },
      },
      isRecord,
    );

    const joinedSession = await requestJson<SessionDetail>(
      apiBaseUrl,
      `/sessions/${createdSession.id}/join`,
      { method: 'POST', cookieHeader: participantCookieHeader },
      isSessionDetail,
    );
    assert(
      joinedSession.participantCount >= 2,
      'Participant join did not increase joined participant count.',
    );

    const leftSession = await requestJson<SessionDetail>(
      apiBaseUrl,
      `/sessions/${createdSession.id}/leave`,
      { method: 'POST', cookieHeader: participantCookieHeader },
      isSessionDetail,
    );
    assert(
      leftSession.participantCount >= 1,
      'Participant leave did not preserve host participant.',
    );

    const publicList = await requestJson<SessionList>(
      apiBaseUrl,
      `/games/${DEMO_APP_ID}/sessions?limit=20`,
      { method: 'GET' },
      isSessionList,
    );
    assert(
      publicList.items.some((item) => item.id === createdSession.id),
      'Created public session was not present in game session list.',
    );

    const publicDetail = await requestJson<SessionDetail>(
      apiBaseUrl,
      `/sessions/${createdSession.id}`,
      { method: 'GET' },
      isSessionDetail,
    );
    assert(
      publicDetail.achievements.length > 0,
      'Session detail did not include attached achievements.',
    );
    assert(
      publicDetail.participants.length > 0,
      'Session detail did not include participants.',
    );

    const sessionComment = await requestJson<CommentResponse>(
      apiBaseUrl,
      `/sessions/${createdSession.id}/comments`,
      {
        method: 'POST',
        cookieHeader: hostCookieHeader,
        body: { body: 'Session auth smoke comment.' },
      },
      isCommentResponse,
    );

    const sessionCommentsList = await requestJson<CommentList>(
      apiBaseUrl,
      `/sessions/${createdSession.id}/comments`,
      { method: 'GET' },
      isCommentList,
    );
    assert(
      sessionCommentsList.items.length > 0,
      'Session comments list did not include the smoke comment.',
    );

    const createdActivity = await requestJson<ActivityList>(
      apiBaseUrl,
      '/activity?eventType=session_created&limit=20',
      { method: 'GET' },
      isActivityList,
    );
    assert(
      createdActivity.items.some(
        (item) =>
          item.entityId === createdSession.id &&
          item.eventType === 'session_created' &&
          item.steamAppId === DEMO_APP_ID,
      ),
      'Session created activity event was not recorded.',
    );

    const joinedActivity = await requestJson<ActivityList>(
      apiBaseUrl,
      '/activity?eventType=session_joined&limit=20',
      { method: 'GET' },
      isActivityList,
    );
    assert(
      joinedActivity.items.some(
        (item) =>
          item.entityId === createdSession.id &&
          item.eventType === 'session_joined' &&
          item.steamAppId === DEMO_APP_ID,
      ),
      'Session joined activity event was not recorded.',
    );

    const commentedActivity = await requestJson<ActivityList>(
      apiBaseUrl,
      '/activity?eventType=session_commented&limit=20',
      { method: 'GET' },
      isActivityList,
    );
    assert(
      commentedActivity.items.some(
        (item) =>
          item.entityId === sessionComment.id &&
          item.eventType === 'session_commented' &&
          item.steamAppId === DEMO_APP_ID,
      ),
      'Session commented activity event was not recorded.',
    );

    const dbSummary = await getSafeDbSummary(databaseService, createdSession.id);

    console.log('session auth smoke: passed');
    console.log(`sessionId: ${createdSession.id}`);
    console.log(`steamAppId: ${createdSession.steamAppId}`);
    console.log(`status: ${publicDetail.status}`);
    console.log(`visibility: ${publicDetail.visibility}`);
    console.log(`participant count: ${publicDetail.participantCount}`);
    console.log(`achievement mapping count: ${publicDetail.achievements.length}`);
    console.log(`comment count: ${sessionCommentsList.items.length}`);
    console.log('activity: session created, joined, and commented events verified');
    console.log(`db session count: ${dbSummary.sessionsCount}`);
    console.log(`db participant count: ${dbSummary.participantsCount}`);
    console.log(
      `db achievement mapping count: ${dbSummary.achievementMappingsCount}`,
    );
    console.log(
      `attached achievements for app ${DEMO_APP_ID}: ${dbSummary.attachedForAppCount}`,
    );
    console.log('public list: contains session');
    console.log('public detail: contains participant and achievement');
    console.log('community: session comment verified');
  } finally {
    for (const token of sessionTokens) {
      await sessionService.revokeSessionByToken(token);
    }
    await app.close();
  }
}

async function assertSeedData(databaseService: DatabaseService): Promise<void> {
  const [profile] = await databaseService.db
    .select({ id: steamProfiles.id })
    .from(steamProfiles)
    .where(eq(steamProfiles.steamId, DEMO_STEAM_ID))
    .limit(1);

  if (profile === undefined) {
    throw new Error(
      'Seed data missing: run pnpm seed:dev before session:auth-smoke.',
    );
  }

  await findSmokeAchievementId(databaseService);
}

async function removePriorSmokeSessions(
  databaseService: DatabaseService,
  hostUserId: string,
): Promise<void> {
  await databaseService.db.transaction(async (tx) => {
    const rows = await tx
      .select({ id: gamingSessions.id })
      .from(gamingSessions)
      .where(
        and(
          eq(gamingSessions.steamAppId, DEMO_APP_ID),
          eq(gamingSessions.hostUserId, hostUserId),
          eq(gamingSessions.title, SESSION_TITLE),
          eq(gamingSessions.description, SESSION_DESCRIPTION),
        ),
      );
    const sessionIds = rows.map((row) => row.id);

    if (sessionIds.length === 0) {
      return;
    }

    await tx
      .delete(sessionComments)
      .where(inArray(sessionComments.sessionId, sessionIds));
    await tx
      .delete(gamingSessionAchievements)
      .where(inArray(gamingSessionAchievements.sessionId, sessionIds));
    await tx
      .delete(gamingSessionParticipants)
      .where(inArray(gamingSessionParticipants.sessionId, sessionIds));
    await tx.delete(gamingSessions).where(inArray(gamingSessions.id, sessionIds));
  });
}

async function findSmokeAchievementId(
  databaseService: DatabaseService,
): Promise<string> {
  const [achievement] = await databaseService.db
    .select({ id: achievements.id })
    .from(achievements)
    .where(eq(achievements.steamAppId, DEMO_APP_ID))
    .orderBy(asc(achievements.apiName))
    .limit(1);

  if (achievement === undefined) {
    throw new Error('Seed data missing: app 910001 has no achievements.');
  }

  return achievement.id;
}

async function findOrCreateSmokeParticipant(
  databaseService: DatabaseService,
  appUsersDataService: AppUsersDataService,
): Promise<{ id: string }> {
  const [existing] = await databaseService.db
    .select({ id: appUsers.id })
    .from(appUsers)
    .where(eq(appUsers.displayName, PARTICIPANT_DISPLAY_NAME))
    .limit(1);

  if (existing !== undefined) {
    return existing;
  }

  return appUsersDataService.create({
    displayName: PARTICIPANT_DISPLAY_NAME,
    avatarUrl: null,
  });
}

async function getSafeDbSummary(
  databaseService: DatabaseService,
  sessionId: string,
): Promise<{
  sessionsCount: number;
  participantsCount: number;
  achievementMappingsCount: number;
  attachedForAppCount: number;
}> {
  const [sessionRows, participantRows, mappingRows, attachedRows] =
    await Promise.all([
      databaseService.db.select({ id: gamingSessions.id }).from(gamingSessions),
      databaseService.db
        .select({ id: gamingSessionParticipants.id })
        .from(gamingSessionParticipants),
      databaseService.db
        .select({ id: gamingSessionAchievements.id })
        .from(gamingSessionAchievements),
      databaseService.db
        .select({ id: gamingSessionAchievements.id })
        .from(gamingSessionAchievements)
        .innerJoin(
          achievements,
          eq(achievements.id, gamingSessionAchievements.achievementId),
        )
        .where(
          and(
            eq(gamingSessionAchievements.sessionId, sessionId),
            eq(achievements.steamAppId, DEMO_APP_ID),
          ),
        ),
    ]);

  return {
    sessionsCount: sessionRows.length,
    participantsCount: participantRows.length,
    achievementMappingsCount: mappingRows.length,
    attachedForAppCount: attachedRows.length,
  };
}

interface RequestOptions {
  method: 'GET' | 'POST' | 'PATCH';
  cookieHeader?: string;
  body?: unknown;
}

async function requestJson<T>(
  baseUrl: string,
  path: string,
  options: RequestOptions,
  guard: (value: unknown) => value is T,
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (options.cookieHeader !== undefined) {
    headers.Cookie = options.cookieHeader;
  }

  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method: options.method,
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  if (!response.ok) {
    throw new Error(`${options.method} ${path} failed with HTTP ${response.status}.`);
  }

  const body: unknown = await response.json();

  if (!guard(body)) {
    throw new Error(`${options.method} ${path} returned an unexpected body.`);
  }

  return body;
}

function createCookieHeader(token: string): string {
  const cookieName = getAuthConfig().authSessionCookieName;
  return `${encodeURIComponent(cookieName)}=${encodeURIComponent(token)}`;
}

function normalizeApiBaseUrl(value: string): string {
  return value.replace(/\/$/, '');
}

function isSessionDetail(value: unknown): value is SessionDetail {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.steamAppId === 'number' &&
    typeof value.title === 'string' &&
    typeof value.status === 'string' &&
    typeof value.visibility === 'string' &&
    typeof value.participantCount === 'number' &&
    typeof value.achievementCount === 'number' &&
    Array.isArray(value.participants) &&
    Array.isArray(value.achievements)
  );
}

function isSessionList(value: unknown): value is SessionList {
  return isRecord(value) && Array.isArray(value.items);
}

function isCommentList(value: unknown): value is CommentList {
  return isRecord(value) && Array.isArray(value.items);
}

function isCommentResponse(value: unknown): value is CommentResponse {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.body === 'string'
  );
}

function isActivityList(value: unknown): value is ActivityList {
  return isRecord(value) && Array.isArray(value.items);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown smoke error.';
  console.error(`session auth smoke failed: ${message}`);
  process.exitCode = 1;
});

export {};
