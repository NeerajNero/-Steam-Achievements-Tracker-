import { UnauthorizedException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import type { AuthCookieService } from './auth-cookie.service';
import type { AuthService } from './auth.service';
import { SessionAuthGuard } from './session-auth.guard';

describe('SessionAuthGuard', () => {
  it('rejects requests without an active session cookie', async () => {
    const guard = createGuard({ token: null });

    await expect(guard.canActivate(createContext())).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('attaches authenticated user context for valid sessions', async () => {
    const request: Record<string, unknown> = {};
    const guard = createGuard({ token: 'cookie-token' });

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
    expect(request.authenticatedUser).toMatchObject({
      userId: 'user-id',
      user: { id: 'user-id' },
      steamAccount: { steamId: '76561198000000000' },
    });
  });
});

function createGuard(input: { token: string | null }): SessionAuthGuard {
  const authCookieService = {
    getSessionToken: vi.fn(() => input.token),
  };
  const authService = {
    getCurrentUser: vi.fn(async () =>
      input.token === null
        ? null
        : {
            user: {
              id: 'user-id',
              displayName: 'Steam User',
              avatarUrl: null,
              role: 'user',
              status: 'active',
            },
            steamAccount: {
              steamId: '76561198000000000',
              steamProfileId: 'steam-profile-id',
              personaName: 'Steam Persona',
              avatarUrl: null,
              isPrimary: true,
            },
            publicProfile: {
              slug: 'steam-user',
              isPublic: true,
            },
          },
    ),
  };

  return new SessionAuthGuard(
    authCookieService as unknown as AuthCookieService,
    authService as unknown as AuthService,
  );
}

function createContext(request: Record<string, unknown> = {}): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as ExecutionContext;
}
