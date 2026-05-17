import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { and, asc, eq, inArray } from 'drizzle-orm';

import { DatabaseService } from '../db/database.service';
import { DatabaseModule } from '../db/database.module';
import { AuthCallbackDataService } from '../db/services/auth-callback-data.service';
import { AuthSessionsDataService } from '../db/services/auth-sessions-data.service';
import { AuthCallbackRepository } from '../db/repositories/auth-callback.repository';
import { AuthSessionsRepository } from '../db/repositories/auth-sessions.repository';
import {
  achievements,
  guideComments,
  guideAchievements,
  guides,
  guideSections,
  guideVotes,
  steamProfiles,
} from '../db/schema';
import { getAuthConfig } from '../modules/auth/auth.config';
import { SessionService } from '../modules/auth/session.service';

@Module({
  imports: [DatabaseModule],
})
class GuideAuthSmokeModule {}

const DEFAULT_API_BASE_URL = 'http://localhost:3000';
const DEMO_STEAM_ID = '76561198000000000';
const DEMO_APP_ID = 910001;
const GUIDE_TITLE = 'Demo Completion Roadmap';
const GUIDE_SUMMARY = 'Local smoke guide';
const SECTION_TITLE = 'Smoke Section';
const SECTION_CONTENT =
  'This section is created by the deterministic local guide auth smoke.';

interface GuideDetail {
  id: string;
  slug: string;
  title: string;
  status: string;
  visibility: string;
  sections: unknown[];
  achievements: unknown[];
}

interface GuideList {
  items: Array<{ id: string; slug: string; title: string }>;
}

interface AccountGuides {
  items: Array<{ id: string; slug: string; title: string }>;
}

interface VoteSummary {
  upvotes: number;
  downvotes: number;
  score: number;
  currentUserVote: number | null;
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
  const app = await NestFactory.createApplicationContext(GuideAuthSmokeModule, {
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
      headers: { 'user-agent': 'guide-auth-smoke' },
      ip: '127.0.0.1',
    });
    sessionToken = preparedSession.token;

    const authResult = await authCallbackDataService.persistSteamLogin({
      steamId: DEMO_STEAM_ID,
      profile: {
        personaName: 'Guide Smoke User',
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

    await removePriorSmokeGuides(databaseService, authResult.userId);

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
          estimatedDifficulty: 3,
          estimatedHours: 5,
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
        body: {
          status: 'published',
          visibility: 'public',
        },
      },
      isGuideDetail,
    );

    const publicList = await requestJson<GuideList>(
      apiBaseUrl,
      `/games/${DEMO_APP_ID}/guides?limit=20`,
      { method: 'GET' },
      isGuideList,
    );
    assert(
      publicList.items.some((item) => item.id === publishedGuide.id),
      'Published guide was not present in public guide list.',
    );

    const publicDetail = await requestJson<GuideDetail>(
      apiBaseUrl,
      `/games/${DEMO_APP_ID}/guides/${publishedGuide.slug}`,
      { method: 'GET' },
      isGuideDetail,
    );
    assert(
      publicDetail.sections.length > 0,
      'Published guide detail did not include sections.',
    );
    assert(
      publicDetail.achievements.length > 0,
      'Published guide detail did not include attached achievements.',
    );

    const accountGuides = await requestJson<AccountGuides>(
      apiBaseUrl,
      '/account/guides',
      { method: 'GET', cookieHeader },
      isAccountGuides,
    );
    assert(
      accountGuides.items.some((item) => item.id === publishedGuide.id),
      'Published guide was not present in account guide list.',
    );

    const voteSummary = await requestJson<VoteSummary>(
      apiBaseUrl,
      `/guides/${publishedGuide.id}/vote`,
      {
        method: 'PUT',
        cookieHeader,
        body: { value: 1 },
      },
      isVoteSummary,
    );
    assert(voteSummary.currentUserVote === 1, 'Guide vote was not recorded.');

    const guideComment = await requestJson<CommentResponse>(
      apiBaseUrl,
      `/guides/${publishedGuide.id}/comments`,
      {
        method: 'POST',
        cookieHeader,
        body: { body: 'Guide auth smoke comment.' },
      },
      isCommentResponse,
    );

    const guideCommentsList = await requestJson<CommentList>(
      apiBaseUrl,
      `/guides/${publishedGuide.id}/comments`,
      { method: 'GET' },
      isCommentList,
    );
    assert(
      guideCommentsList.items.length > 0,
      'Guide comments list did not include the smoke comment.',
    );

    const publishedActivity = await requestJson<ActivityList>(
      apiBaseUrl,
      '/activity?eventType=guide_published&limit=20',
      { method: 'GET' },
      isActivityList,
    );
    assert(
      publishedActivity.items.some(
        (item) =>
          item.entityId === publishedGuide.id &&
          item.eventType === 'guide_published' &&
          item.steamAppId === DEMO_APP_ID,
      ),
      'Guide published activity event was not recorded.',
    );

    const commentedActivity = await requestJson<ActivityList>(
      apiBaseUrl,
      '/activity?eventType=guide_commented&limit=20',
      { method: 'GET' },
      isActivityList,
    );
    assert(
      commentedActivity.items.some(
        (item) =>
          item.entityId === guideComment.id &&
          item.eventType === 'guide_commented' &&
          item.steamAppId === DEMO_APP_ID,
      ),
      'Guide commented activity event was not recorded.',
    );

    const dbSummary = await getSafeDbSummary(databaseService, publishedGuide.id);

    console.log('guide auth smoke: passed');
    console.log(`guideId: ${publishedGuide.id}`);
    console.log(`slug: ${publishedGuide.slug}`);
    console.log(`status: ${publishedGuide.status}`);
    console.log(`visibility: ${publishedGuide.visibility}`);
    console.log(`section count: ${publicDetail.sections.length}`);
    console.log(`achievement mapping count: ${publicDetail.achievements.length}`);
    console.log(`vote score: ${voteSummary.score}`);
    console.log(`comment count: ${guideCommentsList.items.length}`);
    console.log('activity: guide published and commented events verified');
    console.log(`db guide count: ${dbSummary.guidesCount}`);
    console.log(`db section count: ${dbSummary.sectionsCount}`);
    console.log(`db achievement mapping count: ${dbSummary.achievementMappingsCount}`);
    console.log(
      `attached achievements for app ${DEMO_APP_ID}: ${dbSummary.attachedForAppCount}`,
    );
    console.log('public list: contains guide');
    console.log('public detail: contains section and achievement');
    console.log('account guides: contains guide');
    console.log('community: vote and comment verified');
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
    throw new Error('Seed data missing: run pnpm seed:dev before guide:auth-smoke.');
  }

  await findSmokeAchievementId(databaseService);
}

async function removePriorSmokeGuides(
  databaseService: DatabaseService,
  authorUserId: string,
): Promise<void> {
  await databaseService.db.transaction(async (tx) => {
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
  guideId: string,
): Promise<{
  guidesCount: number;
  sectionsCount: number;
  achievementMappingsCount: number;
  attachedForAppCount: number;
}> {
  const [guideRows, sectionRows, mappingRows, attachedRows] = await Promise.all([
    databaseService.db.select({ id: guides.id }).from(guides),
    databaseService.db.select({ id: guideSections.id }).from(guideSections),
    databaseService.db
      .select({ id: guideAchievements.id })
      .from(guideAchievements),
    databaseService.db
      .select({ id: guideAchievements.id })
      .from(guideAchievements)
      .innerJoin(achievements, eq(achievements.id, guideAchievements.achievementId))
      .where(
        and(
          eq(guideAchievements.guideId, guideId),
          eq(achievements.steamAppId, DEMO_APP_ID),
        ),
      ),
  ]);

  return {
    guidesCount: guideRows.length,
    sectionsCount: sectionRows.length,
    achievementMappingsCount: mappingRows.length,
    attachedForAppCount: attachedRows.length,
  };
}

interface RequestOptions {
  method: 'GET' | 'POST' | 'PATCH' | 'PUT';
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

function isGuideDetail(value: unknown): value is GuideDetail {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.slug === 'string' &&
    typeof value.title === 'string' &&
    typeof value.status === 'string' &&
    typeof value.visibility === 'string' &&
    Array.isArray(value.sections) &&
    Array.isArray(value.achievements)
  );
}

function isGuideList(value: unknown): value is GuideList {
  return isRecord(value) && Array.isArray(value.items);
}

function isAccountGuides(value: unknown): value is AccountGuides {
  return isRecord(value) && Array.isArray(value.items);
}

function isVoteSummary(value: unknown): value is VoteSummary {
  return (
    isRecord(value) &&
    typeof value.upvotes === 'number' &&
    typeof value.downvotes === 'number' &&
    typeof value.score === 'number' &&
    (typeof value.currentUserVote === 'number' || value.currentUserVote === null)
  );
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
  console.error(`guide auth smoke failed: ${message}`);
  process.exitCode = 1;
});

export {};
