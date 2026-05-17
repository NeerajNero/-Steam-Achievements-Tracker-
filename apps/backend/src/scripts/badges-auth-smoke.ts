import 'reflect-metadata';

import { Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { DatabaseModule } from '../db/database.module';
import { DatabaseService } from '../db/database.service';
import { AuthCallbackRepository } from '../db/repositories/auth-callback.repository';
import { AuthSessionsRepository } from '../db/repositories/auth-sessions.repository';
import { AuthCallbackDataService } from '../db/services/auth-callback-data.service';
import { AuthSessionsDataService } from '../db/services/auth-sessions-data.service';
import { getAuthConfig } from '../modules/auth/auth.config';
import { SessionService } from '../modules/auth/session.service';

@Module({
  imports: [DatabaseModule],
})
class BadgesAuthSmokeModule {}

const DEFAULT_API_BASE_URL = 'http://localhost:3000';
const DEMO_STEAM_ID = '76561198000000000';

interface ProfileBadgesResponse {
  items: Array<{ id: string; badge: { code: string; name: string } }>;
}

interface ShowcaseResponse {
  items: Array<{ id: string; itemType: string; itemId: string }>;
}

async function main(): Promise<void> {
  const apiBaseUrl = normalizeApiBaseUrl(
    process.env.API_BASE_URL ?? DEFAULT_API_BASE_URL,
  );
  const app = await NestFactory.createApplicationContext(BadgesAuthSmokeModule, {
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
    const badges = await requestJson<ProfileBadgesResponse>(
      apiBaseUrl,
      `/profiles/${DEMO_STEAM_ID}/badges`,
      { method: 'GET' },
      isProfileBadgesResponse,
    );

    if (badges.items.length === 0) {
      throw new Error(
        'Demo profile has no badges. Run seed:dev and badges:backfill-dev first.',
      );
    }

    const preparedSession = sessionService.prepareSession({
      headers: { 'user-agent': 'badges-auth-smoke' },
      ip: '127.0.0.1',
    });
    sessionToken = preparedSession.token;

    await authCallbackDataService.persistSteamLogin({
      steamId: DEMO_STEAM_ID,
      profile: {
        personaName: 'Badge Smoke User',
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

    const profileBadge = badges.items[0];
    const cookieHeader = createCookieHeader(sessionToken);
    const accountShowcase = await requestJson<ShowcaseResponse>(
      apiBaseUrl,
      '/account/showcase',
      {
        method: 'PUT',
        cookieHeader,
        body: {
          items: [
            {
              itemType: 'badge',
              itemId: profileBadge.id,
              position: 0,
              visibility: 'public',
              titleOverride: null,
            },
          ],
        },
      },
      isShowcaseResponse,
    );

    assert(
      accountShowcase.items.some((item) => item.itemId === profileBadge.id),
      'Account showcase did not include the selected badge.',
    );

    const publicShowcase = await requestJson<ShowcaseResponse>(
      apiBaseUrl,
      `/profiles/${DEMO_STEAM_ID}/showcase`,
      { method: 'GET' },
      isShowcaseResponse,
    );

    assert(
      publicShowcase.items.some((item) => item.itemId === profileBadge.id),
      'Public showcase did not include the selected badge.',
    );

    console.log('badge auth smoke: passed');
    console.log(`profileBadgeId: ${profileBadge.id}`);
    console.log(`badgeCode: ${profileBadge.badge.code}`);
    console.log(`accountShowcaseItems: ${accountShowcase.items.length}`);
    console.log(`publicShowcaseItems: ${publicShowcase.items.length}`);
  } finally {
    sessionToken = null;
    await app.close();
  }
}

async function requestJson<T>(
  apiBaseUrl: string,
  path: string,
  input: { method: string; cookieHeader?: string; body?: unknown },
  guard: (body: unknown) => body is T,
): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: input.method,
    headers: {
      ...(input.cookieHeader ? { Cookie: input.cookieHeader } : {}),
      ...(input.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    body: input.body === undefined ? undefined : JSON.stringify(input.body),
  });

  if (!response.ok) {
    const safeBody = await response.text();
    throw new Error(
      `${input.method} ${path} failed with HTTP ${response.status}: ${safeBody.slice(0, 300)}`,
    );
  }

  const body: unknown = await response.json();

  if (!guard(body)) {
    throw new Error(`${input.method} ${path} returned an unexpected body.`);
  }

  return body;
}

function createCookieHeader(sessionToken: string): string {
  const config = getAuthConfig();
  return `${config.authSessionCookieName}=${encodeURIComponent(sessionToken)}`;
}

function normalizeApiBaseUrl(value: string): string {
  return value.replace(/\/+$/, '');
}

function isProfileBadgesResponse(value: unknown): value is ProfileBadgesResponse {
  return isRecord(value) && Array.isArray(value.items);
}

function isShowcaseResponse(value: unknown): value is ShowcaseResponse {
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
  const message =
    error instanceof Error ? error.message : 'Unknown badge auth smoke error';
  console.error(`Badge auth smoke failed: ${message}`);
  process.exitCode = 1;
});

export {};
