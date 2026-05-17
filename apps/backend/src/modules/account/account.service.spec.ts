import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import type { AppUsersDataService } from '../../db/services/app-users-data.service';
import type { PublicProfilesDataService } from '../../db/services/public-profiles-data.service';
import type { SteamProfilesDataService } from '../../db/services/steam-profiles-data.service';
import type { UserPreferencesDataService } from '../../db/services/user-preferences-data.service';
import type { UserSteamAccountsDataService } from '../../db/services/user-steam-accounts-data.service';
import { AccountService } from './account.service';

describe('AccountService', () => {
  it('returns account settings with linked Steam account, preferences, and public profile', async () => {
    const service = createService();

    await expect(service.getAccount('user-id')).resolves.toMatchObject({
      user: {
        id: 'user-id',
        displayName: 'Steam User',
        role: 'user',
        status: 'active',
      },
      steamAccount: {
        steamId: '76561198000000000',
        steamProfileId: 'steam-profile-id',
        personaName: 'Steam Persona',
        isPrimary: true,
      },
      preferences: {
        settings: {
          defaultGameSort: 'completion',
          defaultGameOrder: 'desc',
          showPrivateHints: true,
        },
      },
      publicProfile: {
        slug: 'steam-user',
        isPublic: true,
        settings: {
          showRarestAchievements: true,
          showRecentSyncs: true,
          showSteamId: true,
        },
      },
    });
  });

  it('updates display profile fields without allowing role or status updates', async () => {
    const service = createService();

    await service.updateAccount('user-id', {
      displayName: '  New Name  ',
      avatarUrl: null,
    });

    expect(mocks.appUsers.update).toHaveBeenCalledWith('user-id', {
      displayName: 'New Name',
      avatarUrl: null,
    });
  });

  it('normalizes public profile slugs to lowercase', async () => {
    const service = createService();

    await expect(
      service.updatePublicProfileSettings('user-id', {
        slug: '  My-Steam-Profile  ',
        isPublic: true,
      }),
    ).resolves.toMatchObject({
      slug: 'my-steam-profile',
      isPublic: true,
    });

    expect(mocks.publicProfiles.updateById).toHaveBeenCalledWith(
      'public-profile-id',
      expect.objectContaining({ slug: 'my-steam-profile' }),
    );
  });

  it('rejects invalid and reserved public profile slugs', async () => {
    const service = createService();

    await expect(
      service.updatePublicProfileSettings('user-id', { slug: 'bad_slug' }),
    ).rejects.toBeInstanceOf(BadRequestException);

    await expect(
      service.updatePublicProfileSettings('user-id', { slug: 'admin' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('returns conflict when the public profile slug is already used', async () => {
    const service = createService({
      existingSlugProfileId: 'other-public-profile-id',
    });

    await expect(
      service.updatePublicProfileSettings('user-id', { slug: 'taken' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('throws when a user has no linked Steam profile for public profile settings', async () => {
    const service = createService({ primaryAccount: null });

    await expect(service.getPublicProfileSettings('user-id')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

const now = new Date('2026-01-01T00:00:00.000Z');

let mocks: ReturnType<typeof createMocks>;

function createService(options: {
  primaryAccount?: ReturnType<typeof createPrimaryAccount> | null;
  existingSlugProfileId?: string | null;
} = {}): AccountService {
  mocks = createMocks(options);

  return new AccountService(
    mocks.appUsers as unknown as AppUsersDataService,
    mocks.userSteamAccounts as unknown as UserSteamAccountsDataService,
    mocks.userPreferences as unknown as UserPreferencesDataService,
    mocks.publicProfiles as unknown as PublicProfilesDataService,
    mocks.steamProfiles as unknown as SteamProfilesDataService,
  );
}

function createMocks(options: {
  primaryAccount?: ReturnType<typeof createPrimaryAccount> | null;
  existingSlugProfileId?: string | null;
}) {
  const primaryAccount =
    options.primaryAccount === undefined
      ? createPrimaryAccount()
      : options.primaryAccount;
  const publicProfile = createPublicProfile();

  return {
    appUsers: {
      findById: vi.fn(async () => ({
        id: 'user-id',
        displayName: 'Steam User',
        avatarUrl: 'https://example.com/avatar.jpg',
        role: 'user',
        status: 'active',
        lastLoginAt: now,
        createdAt: now,
        updatedAt: now,
      })),
      update: vi.fn(async () => ({
        id: 'user-id',
        displayName: 'New Name',
        avatarUrl: null,
        role: 'user',
        status: 'active',
        lastLoginAt: now,
        createdAt: now,
        updatedAt: now,
      })),
    },
    userSteamAccounts: {
      findPrimaryByUserId: vi.fn(async () => primaryAccount),
    },
    userPreferences: {
      findByUserId: vi.fn(async () => ({
        id: 'preferences-id',
        userId: 'user-id',
        settings: {
          defaultGameSort: 'completion',
          defaultGameOrder: 'desc',
          showPrivateHints: true,
        },
        createdAt: now,
        updatedAt: now,
      })),
      create: vi.fn(),
      upsertSettings: vi.fn(async (_userId: string, settings: object) => ({
        id: 'preferences-id',
        userId: 'user-id',
        settings,
        createdAt: now,
        updatedAt: now,
      })),
    },
    publicProfiles: {
      findByUserAndProfileId: vi.fn(async () => publicProfile),
      findBySlug: vi.fn(async () =>
        options.existingSlugProfileId === undefined ||
        options.existingSlugProfileId === null
          ? null
          : { ...publicProfile, id: options.existingSlugProfileId },
      ),
      updateById: vi.fn(async (_id: string, input: object) => ({
        ...publicProfile,
        ...input,
      })),
      create: vi.fn(),
    },
    steamProfiles: {
      findById: vi.fn(async () => ({
        id: 'steam-profile-id',
        steamId: '76561198000000000',
        personaName: 'Steam Persona',
        avatarUrl: 'https://example.com/steam-avatar.jpg',
        profileUrl: 'https://steamcommunity.com/id/example',
        visibilityState: 3,
        isPrivate: false,
        lastSyncedAt: now,
        createdAt: now,
        updatedAt: now,
      })),
    },
  };
}

function createPrimaryAccount() {
  return {
    id: 'account-id',
    userId: 'user-id',
    steamProfileId: 'steam-profile-id',
    steamId: '76561198000000000',
    isPrimary: true,
    linkedAt: now,
    createdAt: now,
    updatedAt: now,
  };
}

function createPublicProfile() {
  return {
    id: 'public-profile-id',
    userId: 'user-id',
    steamProfileId: 'steam-profile-id',
    slug: 'steam-user',
    isPublic: true,
    settings: {
      showRarestAchievements: true,
      showRecentSyncs: true,
      showSteamId: true,
    },
    createdAt: now,
    updatedAt: now,
  };
}
