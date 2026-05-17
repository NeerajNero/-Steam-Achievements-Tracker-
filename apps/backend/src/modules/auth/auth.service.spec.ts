import { UnauthorizedException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AppUsersDataService } from '../../db/services/app-users-data.service';
import type { PublicProfilesDataService } from '../../db/services/public-profiles-data.service';
import type { SteamProfilesDataService } from '../../db/services/steam-profiles-data.service';
import type { UserPreferencesDataService } from '../../db/services/user-preferences-data.service';
import type { UserSteamAccountsDataService } from '../../db/services/user-steam-accounts-data.service';
import type { SteamApiClient } from '../steam/steam-api.client';
import { AuthService } from './auth.service';
import type { SessionService } from './session.service';
import type { SteamOpenIdService } from './steam-openid.service';

describe('AuthService', () => {
  let mocks: AuthServiceMocks;
  let service: AuthService;

  beforeEach(() => {
    mocks = createMocks();
    service = new AuthService(
      mocks.appUsersDataService as unknown as AppUsersDataService,
      mocks.userSteamAccountsDataService as unknown as UserSteamAccountsDataService,
      mocks.userPreferencesDataService as unknown as UserPreferencesDataService,
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
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('creates user, linked Steam account, preferences, and public profile for a new Steam login', async () => {
    await expect(
      service.handleOpenIdCallback(
        createCallbackQuery(),
        { state: 'state-1', returnTo: '/', expiresAt: new Date().toISOString() },
      ),
    ).resolves.toMatchObject({
      userId: 'user-id',
      steamProfileId: 'steam-profile-id',
      steamId: '76561198000000000',
      personaName: 'Steam Persona',
    });

    expect(mocks.steamProfilesDataService.upsertProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        steamId: '76561198000000000',
        personaName: 'Steam Persona',
      }),
    );
    expect(mocks.appUsersDataService.create).toHaveBeenCalledWith({
      displayName: 'Steam Persona',
      avatarUrl: 'https://avatars.example/avatar.jpg',
    });
    expect(
      mocks.userSteamAccountsDataService.createOrRefreshPrimaryAccount,
    ).toHaveBeenCalledWith({
      userId: 'user-id',
      steamProfileId: 'steam-profile-id',
      steamId: '76561198000000000',
    });
    expect(mocks.userPreferencesDataService.create).toHaveBeenCalledWith('user-id');
    expect(mocks.publicProfilesDataService.create).toHaveBeenCalledWith({
      userId: 'user-id',
      steamProfileId: 'steam-profile-id',
    });
  });

  it('reuses an existing linked Steam account and backfills missing profile settings', async () => {
    mocks.userSteamAccountsDataService.findBySteamId.mockResolvedValue({
      userId: 'existing-user-id',
      steamProfileId: 'steam-profile-id',
      steamId: '76561198000000000',
      isPrimary: true,
    });

    await expect(
      service.handleOpenIdCallback(
        createCallbackQuery(),
        { state: 'state-1', returnTo: '/', expiresAt: new Date().toISOString() },
      ),
    ).resolves.toMatchObject({
      userId: 'existing-user-id',
      steamProfileId: 'steam-profile-id',
    });

    expect(mocks.appUsersDataService.create).not.toHaveBeenCalled();
    expect(mocks.userSteamAccountsDataService.setPrimary).toHaveBeenCalledWith(
      'existing-user-id',
      'steam-profile-id',
    );
    expect(mocks.userPreferencesDataService.create).toHaveBeenCalledWith(
      'existing-user-id',
    );
    expect(mocks.publicProfilesDataService.create).toHaveBeenCalledWith({
      userId: 'existing-user-id',
      steamProfileId: 'steam-profile-id',
    });
  });
});

interface AuthServiceMocks {
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
  userPreferencesDataService: {
    findByUserId: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
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
    userPreferencesDataService: {
      findByUserId: vi.fn(async () => null),
      create: vi.fn(),
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

function createCallbackQuery(): Record<string, string> {
  return {
    state: 'state-1',
    'openid.mode': 'id_res',
    'openid.claimed_id':
      'https://steamcommunity.com/openid/id/76561198000000000',
  };
}
