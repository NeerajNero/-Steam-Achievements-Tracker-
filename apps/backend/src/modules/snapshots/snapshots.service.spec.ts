import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import type { ActivityEventsDataService } from '../../db/services/activity-events-data.service';
import type { ProfileMilestonesDataService } from '../../db/services/profile-milestones-data.service';
import type { ProfileSnapshotsDataService } from '../../db/services/profile-snapshots-data.service';
import type { SteamProfilesDataService } from '../../db/services/steam-profiles-data.service';
import type { UserSteamAccountsDataService } from '../../db/services/user-steam-accounts-data.service';
import type { AuthenticatedUserContext } from '../auth/authenticated-user.types';
import { SnapshotsService } from './snapshots.service';

describe('SnapshotsService', () => {
  it('creates a manual profile snapshot', async () => {
    const service = createService();

    await expect(
      service.createProfileSnapshot(
        '76561198000000000',
        createAuthenticatedUser(),
      ),
    ).resolves.toMatchObject({
      totalGames: 6,
      completedGames: 1,
      snapshotReason: 'manual',
    });
  });

  it('rejects manual snapshot creation for authenticated non-owners', async () => {
    const service = createService({ owner: false });

    await expect(
      service.createProfileSnapshot(
        '76561198000000000',
        createAuthenticatedUser(),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows moderators to create snapshots for any profile', async () => {
    const service = createService({ owner: false });

    await expect(
      service.createProfileSnapshot(
        '76561198000000000',
        createAuthenticatedUser({ role: 'moderator' }),
      ),
    ).resolves.toMatchObject({
      snapshotReason: 'manual',
    });
  });

  it('lists snapshots for a Steam profile', async () => {
    const service = createService();

    await expect(
      service.listProfileSnapshots('76561198000000000', {
        limit: 20,
        offset: 0,
      }),
    ).resolves.toMatchObject({
      steamId: '76561198000000000',
      total: 1,
      items: [{ totalGames: 6 }],
    });
  });

  it('returns 404 for missing profiles', async () => {
    const service = createService({ missingProfile: true });

    await expect(
      service.createProfileSnapshot(
        '76561198000000000',
        createAuthenticatedUser(),
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

function createService(
  options: { missingProfile?: boolean; owner?: boolean } = {},
): SnapshotsService {
  const snapshot = {
    id: 'snapshot-id',
    steamProfileId: 'profile-id',
    totalGames: 6,
    completedGames: 1,
    totalAchievements: 30,
    unlockedAchievements: 18,
    remainingAchievements: 12,
    averageCompletionPercentage: 62.5,
    totalPlaytimeMinutes: 1234,
    rarestUnlockedGlobalPercentage: 0.7,
    snapshotReason: 'manual',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  };
  const steamProfilesDataService = {
    findBySteamId: vi.fn(async () =>
      options.missingProfile
        ? null
        : {
            id: 'profile-id',
            steamId: '76561198000000000',
          },
    ),
  };
  const profileSnapshotsDataService = {
    createForProfileId: vi.fn(async () => snapshot),
    findBySteamProfileId: vi.fn(async () => [snapshot]),
    countBySteamProfileId: vi.fn(async () => 1),
  };
  const profileMilestonesDataService = {
    createFromSnapshot: vi.fn(async () => []),
  };
  const activityEventsDataService = {
    create: vi.fn(async () => ({ id: 'activity-id' })),
  };
  const userSteamAccountsDataService = {
    findByUserAndProfileId: vi.fn(async () =>
      options.owner === false
        ? null
        : {
            id: 'account-id',
            userId: 'user-id',
            steamProfileId: 'profile-id',
            steamId: '76561198000000000',
          },
    ),
  };

  return new SnapshotsService(
    steamProfilesDataService as unknown as SteamProfilesDataService,
    profileSnapshotsDataService as unknown as ProfileSnapshotsDataService,
    profileMilestonesDataService as unknown as ProfileMilestonesDataService,
    activityEventsDataService as unknown as ActivityEventsDataService,
    userSteamAccountsDataService as unknown as UserSteamAccountsDataService,
  );
}

function createAuthenticatedUser(
  options: { role?: string } = {},
): AuthenticatedUserContext {
  return {
    userId: 'user-id',
    user: {
      id: 'user-id',
      displayName: 'Steam User',
      avatarUrl: null,
      role: options.role ?? 'user',
      status: 'active',
    },
    steamAccount: {
      steamId: '76561198000000000',
      steamProfileId: 'profile-id',
      personaName: 'Steam User',
      avatarUrl: null,
      isPrimary: true,
    },
    publicProfile: {
      slug: 'steam-user',
      isPublic: true,
    },
  };
}
