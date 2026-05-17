import { HttpStatus, Logger } from '@nestjs/common';
import type { Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AuthCookieService, AuthStateCookiePayload } from './auth-cookie.service';
import {
  AUTH_CALLBACK_REASON_CODES,
  AuthCallbackError,
} from './auth-callback-error';
import { AuthController } from './auth.controller';
import type { AuthService } from './auth.service';

describe('AuthController', () => {
  let authService: AuthServiceMock;
  let authCookieService: AuthCookieServiceMock;
  let controller: AuthController;

  beforeEach(() => {
    vi.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    authService = createAuthServiceMock();
    authCookieService = createAuthCookieServiceMock();
    controller = new AuthController(
      authService as unknown as AuthService,
      authCookieService as unknown as AuthCookieService,
    );
  });

  it('redirects with auth_state_missing when the state cookie is absent', async () => {
    authCookieService.consumeStateCookie.mockReturnValue(null);
    const response = createResponseMock();

    await controller.handleSteamCallback(
      createRequestMock({ 'openid.mode': 'id_res' }),
      response as unknown as Response,
    );

    expect(response.redirect).toHaveBeenCalledWith(
      HttpStatus.FOUND,
      'http://localhost:3001/?auth_error=auth_state_missing',
    );
    expect(authService.handleOpenIdCallbackAndCreateSession).not.toHaveBeenCalled();
  });

  it('redirects with a safe reason code when callback state is invalid', async () => {
    authService.handleOpenIdCallbackAndCreateSession.mockRejectedValue(
      new AuthCallbackError(
        AUTH_CALLBACK_REASON_CODES.AuthStateInvalid,
        'invalid state',
      ),
    );
    const response = createResponseMock();

    await controller.handleSteamCallback(
      createRequestMock(createOpenIdQuery()),
      response as unknown as Response,
    );

    expect(response.redirect).toHaveBeenCalledWith(
      HttpStatus.FOUND,
      'http://localhost:3001/profiles/demo?auth_error=auth_state_invalid',
    );
    expect(authCookieService.clearStateCookie).toHaveBeenCalled();
  });

  it('sets a session cookie and redirects after a successful callback', async () => {
    const response = createResponseMock();

    await controller.handleSteamCallback(
      createRequestMock(createOpenIdQuery()),
      response as unknown as Response,
    );

    expect(authService.handleOpenIdCallbackAndCreateSession).toHaveBeenCalledWith(
      createOpenIdQuery(),
      expect.objectContaining({ state: 'state-1' }),
      expect.objectContaining({ ip: '127.0.0.1' }),
    );
    expect(authCookieService.setSessionCookie).toHaveBeenCalledWith(
      response,
      'session-token',
    );
    expect(response.redirect).toHaveBeenCalledWith(
      HttpStatus.FOUND,
      'http://localhost:3001/profiles/demo',
    );
  });

  it('redirects with session_create_failed when session creation fails', async () => {
    authService.handleOpenIdCallbackAndCreateSession.mockRejectedValue(
      new AuthCallbackError(
        AUTH_CALLBACK_REASON_CODES.SessionCreateFailed,
        'session store unavailable',
      ),
    );
    const response = createResponseMock();

    await controller.handleSteamCallback(
      createRequestMock(createOpenIdQuery()),
      response as unknown as Response,
    );

    expect(response.redirect).toHaveBeenCalledWith(
      HttpStatus.FOUND,
      'http://localhost:3001/profiles/demo?auth_error=session_create_failed',
    );
  });
});

interface AuthServiceMock {
  parseReturnTo: ReturnType<typeof vi.fn>;
  buildLoginStatePayload: ReturnType<typeof vi.fn>;
  buildLoginUrl: ReturnType<typeof vi.fn>;
  handleOpenIdCallbackAndCreateSession: ReturnType<typeof vi.fn>;
  createSessionForUser: ReturnType<typeof vi.fn>;
  getAuthCookieConfig: ReturnType<typeof vi.fn>;
  normalizeReturnTo: ReturnType<typeof vi.fn>;
  getCurrentUser: ReturnType<typeof vi.fn>;
  revokeSession: ReturnType<typeof vi.fn>;
}

interface AuthCookieServiceMock {
  setStateCookie: ReturnType<typeof vi.fn>;
  consumeStateCookie: ReturnType<typeof vi.fn>;
  clearStateCookie: ReturnType<typeof vi.fn>;
  setSessionCookie: ReturnType<typeof vi.fn>;
  clearSessionCookie: ReturnType<typeof vi.fn>;
  getSessionToken: ReturnType<typeof vi.fn>;
}

function createAuthServiceMock(): AuthServiceMock {
  return {
    parseReturnTo: vi.fn((value: string | undefined) => value ?? '/'),
    buildLoginStatePayload: vi.fn(),
    buildLoginUrl: vi.fn(),
    handleOpenIdCallbackAndCreateSession: vi.fn(async () => ({
      userId: 'user-id',
      steamProfileId: 'steam-profile-id',
      steamId: '76561198000000000',
      personaName: 'Steam Persona',
      avatarUrl: null,
      steamProfileUrl: null,
      visibilityState: 3,
      session: {
        token: 'session-token',
        userId: 'user-id',
        expiresAt: new Date('2030-01-01T00:00:00.000Z'),
      },
    })),
    createSessionForUser: vi.fn(async () => ({
      token: 'session-token',
      userId: 'user-id',
      expiresAt: new Date('2030-01-01T00:00:00.000Z'),
    })),
    getAuthCookieConfig: vi.fn(() => ({
      authSessionCookieName: 'steam_auth_session',
      authStateCookieName: 'steam_auth_state',
      authSessionTtlDays: 14,
      authStateTtlSeconds: 300,
      authCookieSecure: false,
      backendPublicUrl: 'http://localhost:3000',
      frontendPublicUrl: 'http://localhost:3001',
    })),
    normalizeReturnTo: vi.fn((value: string) =>
      value.startsWith('/') && !value.startsWith('//') ? value : '/',
    ),
    getCurrentUser: vi.fn(),
    revokeSession: vi.fn(),
  };
}

function createAuthCookieServiceMock(): AuthCookieServiceMock {
  return {
    setStateCookie: vi.fn(),
    consumeStateCookie: vi.fn(() => createStatePayload()),
    clearStateCookie: vi.fn(),
    setSessionCookie: vi.fn(),
    clearSessionCookie: vi.fn(),
    getSessionToken: vi.fn(),
  };
}

function createStatePayload(): AuthStateCookiePayload {
  return {
    state: 'state-1',
    returnTo: '/profiles/demo',
    expiresAt: new Date('2030-01-01T00:00:00.000Z').toISOString(),
  };
}

function createOpenIdQuery(): Record<string, string> {
  return {
    state: 'state-1',
    'openid.mode': 'id_res',
    'openid.claimed_id':
      'https://steamcommunity.com/openid/id/76561198000000000',
    'openid.identity':
      'https://steamcommunity.com/openid/id/76561198000000000',
  };
}

function createRequestMock(query: Record<string, string>): Request {
  return {
    query,
    ip: '127.0.0.1',
    headers: { 'user-agent': 'vitest' },
  } as unknown as Request;
}

function createResponseMock(): Pick<Response, 'redirect'> {
  return {
    redirect: vi.fn(),
  };
}
