import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AuthCallbackDataService } from '../../db/services/auth-callback-data.service';
import type { AppUsersDataService } from '../../db/services/app-users-data.service';
import type { PublicProfilesDataService } from '../../db/services/public-profiles-data.service';
import type { SteamProfilesDataService } from '../../db/services/steam-profiles-data.service';
import type { UserSteamAccountsDataService } from '../../db/services/user-steam-accounts-data.service';
import type { SteamApiClient } from '../steam/steam-api.client';
import {
  AUTH_CALLBACK_REASON_CODES,
  AuthCallbackError,
} from './auth-callback-error';
import { AuthService } from './auth.service';
import type { SessionService } from './session.service';
import type { SteamOpenIdService } from './steam-openid.service';

describe('AuthService', () => {
  let mocks: AuthServiceMocks;
  let service: AuthService;

  beforeEach(() => {
    mocks = createMocks();
    service = new AuthService(
      mocks.authCallbackDataService as unknown as AuthCallbackDataService,
      mocks.appUsersDataService as unknown as AppUsersDataService,
      mocks.userSteamAccountsDataService as unknown as UserSteamAccountsDataService,
      mocks.publicProfilesDataService as unknown as PublicProfilesDataService,
      mocks.steamProfilesDataService as unknown as SteamProfilesDataService,
      mocks.steamApiClient as unknown as SteamApiClient,
      mocks.sessionService as unknown as SessionService,
      mocks.steamOpenIdService as unknown as SteamOpenIdService,
    );
  });

  it('normalizes unsafe returnTo values to prevent open redirects', () => {
    expect(service.parseReturnTo('https://evil.example/path')).toBe('/');
    expect(service.parseReturnTo('//evil.example/path')).toBe('/');
    expect(service.parseReturnTo('/profiles/765')).toBe('/profiles/765');
  });

  it('rejects callbacks with an invalid state', async () => {
    mocks.steamOpenIdService.getCallbackState.mockReturnValue('wrong-state');

    await expect(
      service.handleOpenIdCallback(
        {
          state: 'wrong-state',
          'openid.mode': 'id_res',
        },
        { state: 'expected-state', returnTo: '/', expiresAt: new Date().toISOString() },
      ),
    ).rejects.toMatchObject({
      reasonCode: AUTH_CALLBACK_REASON_CODES.AuthStateInvalid,
    });
  });

  it('persists a verified Steam login and session atomically', async () => {
    await expect(
      service.handleOpenIdCallbackAndCreateSession(
        createCallbackQuery(),
        { state: 'state-1', returnTo: '/', expiresAt: new Date().toISOString() },
        { ip: '127.0.0.1', headers: { 'user-agent': 'vitest' } },
      ),
    ).resolves.toMatchObject({
      userId: 'user-id',
      steamProfileId: 'steam-profile-id',
      steamId: '76561198000000000',
      personaName: 'Steam Persona',
      session: {
        token: 'raw-session-token',
        userId: 'user-id',
      },
    });

    expect(mocks.authCallbackDataService.persistSteamLogin).toHaveBeenCalledWith(
      {
        steamId: '76561198000000000',
        profile: expect.objectContaining({
          personaName: 'Steam Persona',
          avatarUrl: 'https://avatars.example/avatar.jpg',
        }),
        session: {
          sessionTokenHash: 'session-token-hash',
          userAgent: 'vitest',
          ipAddress: '127.0.0.1',
          expiresAt: expect.any(Date) as Date,
        },
      },
    );
  });

  it('returns the user reused by atomic persistence for repeated Steam login', async () => {
    mocks.authCallbackDataService.persistSteamLogin.mockResolvedValue({
      userId: 'existing-user-id',
      steamProfileId: 'steam-profile-id',
      steamId: '76561198000000000',
      personaName: 'Steam Persona',
      avatarUrl: 'https://avatars.example/avatar.jpg',
      steamProfileUrl: 'https://steamcommunity.com/profiles/76561198000000000',
      visibilityState: 3,
      sessionId: 'session-id',
    });

    await expect(
      service.handleOpenIdCallbackAndCreateSession(
        createCallbackQuery(),
        { state: 'state-1', returnTo: '/', expiresAt: new Date().toISOString() },
      ),
    ).resolves.toMatchObject({
      userId: 'existing-user-id',
      steamProfileId: 'steam-profile-id',
    });
  });

  it('creates a minimal profile and account when Steam summary enrichment fails', async () => {
    mocks.steamApiClient.getPlayerSummaries.mockRejectedValue(
      new Error('summary unavailable'),
    );

    await expect(
      service.handleOpenIdCallbackAndCreateSession(
        createCallbackQuery(),
        { state: 'state-1', returnTo: '/', expiresAt: new Date().toISOString() },
      ),
    ).resolves.toMatchObject({
      userId: 'user-id',
      steamProfileId: 'steam-profile-id',
      steamId: '76561198000000000',
      personaName: null,
    });

    expect(mocks.authCallbackDataService.persistSteamLogin).toHaveBeenCalledWith(
      expect.objectContaining({
        steamId: '76561198000000000',
        profile: {
          personaName: null,
          avatarUrl: null,
          profileUrl: null,
          visibilityState: null,
        },
      }),
    );
  });

  it('wraps Steam profile persistence failures in a safe callback reason code', async () => {
    mocks.authCallbackDataService.persistSteamLogin.mockRejectedValue(
      new AuthCallbackError(
        AUTH_CALLBACK_REASON_CODES.SteamProfileUpsertFailed,
        'profile persistence failed',
      ),
    );

    await expect(
      service.handleOpenIdCallbackAndCreateSession(
        createCallbackQuery(),
        { state: 'state-1', returnTo: '/', expiresAt: new Date().toISOString() },
      ),
    ).rejects.toMatchObject({
      reasonCode: AUTH_CALLBACK_REASON_CODES.SteamProfileUpsertFailed,
    });
  });

  it('wraps app user linking failures in a safe callback reason code', async () => {
    mocks.authCallbackDataService.persistSteamLogin.mockRejectedValue(
      new Error('unique violation'),
    );

    await expect(
      service.handleOpenIdCallbackAndCreateSession(
        createCallbackQuery(),
        { state: 'state-1', returnTo: '/', expiresAt: new Date().toISOString() },
      ),
    ).rejects.toMatchObject({
      reasonCode: AUTH_CALLBACK_REASON_CODES.AppUserLinkFailed,
    });
  });
});

interface AuthServiceMocks {
  authCallbackDataService: {
    persistSteamLogin: ReturnType<typeof vi.fn>;
  };
  appUsersDataService: {
    create: ReturnType<typeof vi.fn>;
    findById: ReturnType<typeof vi.fn>;
    touchLastLogin: ReturnType<typeof vi.fn>;
  };
  userSteamAccountsDataService: {
    findBySteamId: ReturnType<typeof vi.fn>;
    createOrRefreshPrimaryAccount: ReturnType<typeof vi.fn>;
    setPrimary: ReturnType<typeof vi.fn>;
    findPrimaryByUserId: ReturnType<typeof vi.fn>;
  };
  publicProfilesDataService: {
    findByUserAndProfileId: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
  };
  steamProfilesDataService: {
    upsertProfile: ReturnType<typeof vi.fn>;
    findById: ReturnType<typeof vi.fn>;
  };
  steamApiClient: {
    getPlayerSummaries: ReturnType<typeof vi.fn>;
  };
  sessionService: {
    prepareSession: ReturnType<typeof vi.fn>;
    createSession: ReturnType<typeof vi.fn>;
    revokeSessionByToken: ReturnType<typeof vi.fn>;
    findSessionByToken: ReturnType<typeof vi.fn>;
  };
  steamOpenIdService: {
    buildLoginUrl: ReturnType<typeof vi.fn>;
    getCallbackState: ReturnType<typeof vi.fn>;
    verifyCallback: ReturnType<typeof vi.fn>;
  };
}

function createMocks(): AuthServiceMocks {
  return {
    authCallbackDataService: {
      persistSteamLogin: vi.fn(async (input: PersistSteamLoginMockInput) => ({
          userId: 'user-id',
          steamProfileId: 'steam-profile-id',
          steamId: input.steamId,
          personaName: input.profile.personaName,
          avatarUrl: input.profile.avatarUrl,
          steamProfileUrl: input.profile.profileUrl,
          visibilityState: input.profile.visibilityState,
          sessionId: 'session-id',
        })),
    },
    appUsersDataService: {
      create: vi.fn(async () => ({
        id: 'user-id',
        displayName: 'Steam Persona',
        avatarUrl: 'https://avatars.example/avatar.jpg',
      })),
      findById: vi.fn(),
      touchLastLogin: vi.fn(),
    },
    userSteamAccountsDataService: {
      findBySteamId: vi.fn(async () => null),
      createOrRefreshPrimaryAccount: vi.fn(async () => ({
        userId: 'user-id',
        steamProfileId: 'steam-profile-id',
        steamId: '76561198000000000',
        isPrimary: true,
      })),
      setPrimary: vi.fn(),
      findPrimaryByUserId: vi.fn(),
    },
    publicProfilesDataService: {
      findByUserAndProfileId: vi.fn(async () => null),
      create: vi.fn(),
    },
    steamProfilesDataService: {
      upsertProfile: vi.fn(async () => ({ id: 'steam-profile-id' })),
      findById: vi.fn(),
    },
    steamApiClient: {
      getPlayerSummaries: vi.fn(async () => [
        {
          steamId: '76561198000000000',
          personaName: 'Steam Persona',
          avatarUrl: 'https://avatars.example/avatar.jpg',
          profileUrl: 'https://steamcommunity.com/profiles/76561198000000000',
          visibilityState: 3,
        },
      ]),
    },
    sessionService: {
      prepareSession: vi.fn(() => ({
        token: 'raw-session-token',
        sessionTokenHash: 'session-token-hash',
        userAgent: 'vitest',
        ipAddress: '127.0.0.1',
        expiresAt: new Date('2030-01-01T00:00:00.000Z'),
      })),
      createSession: vi.fn(),
      revokeSessionByToken: vi.fn(),
      findSessionByToken: vi.fn(),
    },
    steamOpenIdService: {
      buildLoginUrl: vi.fn(),
      getCallbackState: vi.fn(() => 'state-1'),
      verifyCallback: vi.fn(async () => ({
        claimedId: 'https://steamcommunity.com/openid/id/76561198000000000',
        steamId: '76561198000000000',
      })),
    },
  };
}

interface PersistSteamLoginMockInput {
  steamId: string;
  profile: {
    personaName: string | null;
    avatarUrl: string | null;
    profileUrl: string | null;
    visibilityState: number | null;
  };
}

function createCallbackQuery(): Record<string, string> {
  return {
    state: 'state-1',
    'openid.mode': 'id_res',
    'openid.ns': 'http://specs.openid.net/auth/2.0',
    'openid.claimed_id':
      'https://steamcommunity.com/openid/id/76561198000000000',
    'openid.identity':
      'https://steamcommunity.com/openid/id/76561198000000000',
    'openid.assoc_handle': 'assoc',
    'openid.signed': 'signed-fields',
    'openid.sig': 'signature',
  };
}
