import 'reflect-metadata';

import { Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { and, asc, eq, inArray } from 'drizzle-orm';

import { DatabaseModule } from '../db/database.module';
import { DatabaseService } from '../db/database.service';
import { AuthCallbackRepository } from '../db/repositories/auth-callback.repository';
import { AuthSessionsRepository } from '../db/repositories/auth-sessions.repository';
import { AuthCallbackDataService } from '../db/services/auth-callback-data.service';
import { AuthSessionsDataService } from '../db/services/auth-sessions-data.service';
import {
  achievements,
  contentReports,
  guideAchievements,
  guideComments,
  guideSections,
  guides,
  guideVotes,
  steamProfiles,
} from '../db/schema';
import { getAuthConfig } from '../modules/auth/auth.config';
import { SessionService } from '../modules/auth/session.service';

@Module({
  imports: [DatabaseModule],
})
class CommunityAuthSmokeModule {}

const DEFAULT_API_BASE_URL = 'http://localhost:3000';
const DEMO_STEAM_ID = '76561198000000000';
const DEMO_APP_ID = 910001;
const GUIDE_TITLE = 'Community Report Smoke Guide';
const GUIDE_SUMMARY = 'Local deterministic community report smoke';
const SECTION_TITLE = 'Report Smoke Section';
const SECTION_CONTENT = 'This section supports deterministic report smoke.';
const COMMENT_BODY = 'Community auth smoke report target comment.';
const REPORT_DETAILS = 'Local deterministic community auth smoke report.';

interface GuideDetail {
  id: string;
  slug: string;
  status: string;
  visibility: string;
}

interface CommentResponse {
  id: string;
  body: string;
}

interface ReportResponse {
  id: string;
  targetType: string;
  reason: string;
  status: string;
}

async function main(): Promise<void> {
  const apiBaseUrl = normalizeApiBaseUrl(
    process.env.API_BASE_URL ?? DEFAULT_API_BASE_URL,
  );
  const app = await NestFactory.createApplicationContext(CommunityAuthSmokeModule, {
    abortOnError: false,
    logger: ['error'],
  });
  const databaseService = app.get(DatabaseService);
  const sessionService = new SessionService(
    new AuthSessionsDataService(new AuthSessionsRepository(databaseService)),
  );
  const authCallbackDataService = new AuthCallbackDataService(
    new AuthCallbackRepository(databaseService),
  );
  let sessionToken: string | null = null;

  try {
    await assertSeedData(databaseService);

    const preparedSession = sessionService.prepareSession({
      headers: { 'user-agent': 'community-auth-smoke' },
      ip: '127.0.0.1',
    });
    sessionToken = preparedSession.token;

    const authResult = await authCallbackDataService.persistSteamLogin({
      steamId: DEMO_STEAM_ID,
      profile: {
        personaName: 'Community Smoke User',
        avatarUrl: null,
        profileUrl: null,
        visibilityState: 3,
      },
      session: {
        sessionTokenHash: preparedSession.sessionTokenHash,
        userAgent: preparedSession.userAgent,
        ipAddress: preparedSession.ipAddress,
        expiresAt: preparedSession.expiresAt,
      },
    });

    await removePriorSmokeData(databaseService, authResult.userId);

    const cookieHeader = createCookieHeader(sessionToken);
    const achievementId = await findSmokeAchievementId(databaseService);
    const createdGuide = await requestJson<GuideDetail>(
      apiBaseUrl,
      `/games/${DEMO_APP_ID}/guides`,
      {
        method: 'POST',
        cookieHeader,
        body: {
          title: GUIDE_TITLE,
          summary: GUIDE_SUMMARY,
          visibility: 'public',
          estimatedDifficulty: 2,
          estimatedHours: 1,
          isSpoilerHeavy: false,
        },
      },
      isGuideDetail,
    );

    await requestJson(
      apiBaseUrl,
      `/guides/${createdGuide.id}/sections`,
      {
        method: 'POST',
        cookieHeader,
        body: {
          title: SECTION_TITLE,
          content: SECTION_CONTENT,
          position: 0,
        },
      },
      isRecord,
    );

    await requestJson(
      apiBaseUrl,
      `/guides/${createdGuide.id}/achievements`,
      {
        method: 'POST',
        cookieHeader,
        body: { achievementIds: [achievementId] },
      },
      isRecord,
    );

    const publishedGuide = await requestJson<GuideDetail>(
      apiBaseUrl,
      `/guides/${createdGuide.id}`,
      {
        method: 'PATCH',
        cookieHeader,
        body: { status: 'published', visibility: 'public' },
      },
      isGuideDetail,
    );

    const comment = await requestJson<CommentResponse>(
      apiBaseUrl,
      `/guides/${publishedGuide.id}/comments`,
      {
        method: 'POST',
        cookieHeader,
        body: { body: COMMENT_BODY },
      },
      isCommentResponse,
    );

    const report = await requestJson<ReportResponse>(
      apiBaseUrl,
      '/reports',
      {
        method: 'POST',
        cookieHeader,
        body: {
          targetType: 'guide_comment',
          targetId: comment.id,
          reason: 'other',
          details: REPORT_DETAILS,
        },
      },
      isReportResponse,
    );

    const dbSummary = await getSafeDbSummary(databaseService, {
      guideId: publishedGuide.id,
      commentId: comment.id,
      reportId: report.id,
      reporterUserId: authResult.userId,
    });

    assert(dbSummary.reportCount === 1, 'Smoke report row was not found.');

    console.log('community auth smoke: passed');
    console.log(`guideId: ${publishedGuide.id}`);
    console.log(`guide slug: ${publishedGuide.slug}`);
    console.log(`commentId: ${comment.id}`);
    console.log(`reportId: ${report.id}`);
    console.log(`report target type: ${report.targetType}`);
    console.log(`report reason: ${report.reason}`);
    console.log(`report status: ${report.status}`);
    console.log(`db report count: ${dbSummary.reportCount}`);
    console.log(`db smoke guide count: ${dbSummary.guideCount}`);
    console.log(`db smoke comment count: ${dbSummary.commentCount}`);
  } finally {
    if (sessionToken !== null) {
      await sessionService.revokeSessionByToken(sessionToken);
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
      'Seed data missing: run pnpm seed:dev before community:auth-smoke.',
    );
  }

  await findSmokeAchievementId(databaseService);
}

async function removePriorSmokeData(
  databaseService: DatabaseService,
  authorUserId: string,
): Promise<void> {
  await databaseService.db.transaction(async (tx) => {
    await tx
      .delete(contentReports)
      .where(
        and(
          eq(contentReports.reporterUserId, authorUserId),
          eq(contentReports.details, REPORT_DETAILS),
        ),
      );

    const rows = await tx
      .select({ id: guides.id })
      .from(guides)
      .where(
        and(
          eq(guides.steamAppId, DEMO_APP_ID),
          eq(guides.authorUserId, authorUserId),
          eq(guides.title, GUIDE_TITLE),
          eq(guides.summary, GUIDE_SUMMARY),
        ),
      );
    const guideIds = rows.map((row) => row.id);

    if (guideIds.length === 0) {
      return;
    }

    await tx.delete(guideVotes).where(inArray(guideVotes.guideId, guideIds));
    await tx
      .delete(guideComments)
      .where(inArray(guideComments.guideId, guideIds));
    await tx
      .delete(guideAchievements)
      .where(inArray(guideAchievements.guideId, guideIds));
    await tx.delete(guideSections).where(inArray(guideSections.guideId, guideIds));
    await tx.delete(guides).where(inArray(guides.id, guideIds));
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

async function getSafeDbSummary(
  databaseService: DatabaseService,
  input: {
    guideId: string;
    commentId: string;
    reportId: string;
    reporterUserId: string;
  },
): Promise<{ guideCount: number; commentCount: number; reportCount: number }> {
  const [guideRows, commentRows, reportRows] = await Promise.all([
    databaseService.db
      .select({ id: guides.id })
      .from(guides)
      .where(eq(guides.id, input.guideId)),
    databaseService.db
      .select({ id: guideComments.id })
      .from(guideComments)
      .where(eq(guideComments.id, input.commentId)),
    databaseService.db
      .select({ id: contentReports.id })
      .from(contentReports)
      .where(
        and(
          eq(contentReports.id, input.reportId),
          eq(contentReports.reporterUserId, input.reporterUserId),
          eq(contentReports.targetType, 'guide_comment'),
          eq(contentReports.targetId, input.commentId),
          eq(contentReports.details, REPORT_DETAILS),
        ),
      ),
  ]);

  return {
    guideCount: guideRows.length,
    commentCount: commentRows.length,
    reportCount: reportRows.length,
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
  const headers: Record<string, string> = { Accept: 'application/json' };

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

function isGuideDetail(value: unknown): value is GuideDetail {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.slug === 'string' &&
    typeof value.status === 'string' &&
    typeof value.visibility === 'string'
  );
}

function isCommentResponse(value: unknown): value is CommentResponse {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.body === 'string'
  );
}

function isReportResponse(value: unknown): value is ReportResponse {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.targetType === 'string' &&
    typeof value.reason === 'string' &&
    typeof value.status === 'string'
  );
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
  console.error(`community auth smoke failed: ${message}`);
  process.exitCode = 1;
});

export {};
