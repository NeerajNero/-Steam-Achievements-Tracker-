import { HttpStatus } from '@nestjs/common';
import { GUARDS_METADATA, HTTP_CODE_METADATA } from '@nestjs/common/constants';
import { describe, expect, it, vi } from 'vitest';

import type { AuthenticatedUserContext } from '../auth/authenticated-user.types';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import { SnapshotsController } from './snapshots.controller';
import type { SnapshotsService } from './snapshots.service';

describe('SnapshotsController', () => {
  it('keeps snapshot reads public', async () => {
    const service = createService();
    const controller = new SnapshotsController(
      service as unknown as SnapshotsService,
    );

    await expect(
      controller.listProfileSnapshots(
        { steamId: '76561198000000000' },
        { limit: 20, offset: 0 },
      ),
    ).resolves.toEqual({
      steamId: '76561198000000000',
      items: [],
      total: 0,
      limit: 20,
      offset: 0,
    });
    expect(Reflect.getMetadata(GUARDS_METADATA, controller.listProfileSnapshots)).toBeUndefined();
  });

  it('protects manual snapshot creation with session auth', async () => {
    const service = createService();
    const controller = new SnapshotsController(
      service as unknown as SnapshotsService,
    );
    const currentUser = createAuthenticatedUser();

    await expect(
      controller.createProfileSnapshot(
        { steamId: '76561198000000000' },
        currentUser,
      ),
    ).resolves.toMatchObject({ id: 'snapshot-id' });
    expect(service.createProfileSnapshot).toHaveBeenCalledWith(
      '76561198000000000',
      currentUser,
    );
    expect(
      Reflect.getMetadata(HTTP_CODE_METADATA, controller.createProfileSnapshot),
    ).toBe(HttpStatus.CREATED);
    expect(
      Reflect.getMetadata(GUARDS_METADATA, controller.createProfileSnapshot),
    ).toEqual([SessionAuthGuard]);
  });
});

function createService(): {
  createProfileSnapshot: ReturnType<typeof vi.fn>;
  listProfileSnapshots: ReturnType<typeof vi.fn>;
} {
  return {
    createProfileSnapshot: vi.fn(async () => ({
      id: 'snapshot-id',
      totalGames: 6,
      completedGames: 1,
      totalAchievements: 41,
      unlockedAchievements: 24,
      remainingAchievements: 17,
      averageCompletionPercentage: 49.03,
      totalPlaytimeMinutes: 15365,
      rarestUnlockedGlobalPercentage: 0.4,
      snapshotReason: 'manual',
      createdAt: '2026-01-01T00:00:00.000Z',
    })),
    listProfileSnapshots: vi.fn(async () => ({
      steamId: '76561198000000000',
      items: [],
      total: 0,
      limit: 20,
      offset: 0,
    })),
  };
}

function createAuthenticatedUser(): AuthenticatedUserContext {
  return {
    userId: 'user-id',
    user: {
      id: 'user-id',
      displayName: 'Steam User',
      avatarUrl: null,
      role: 'user',
      status: 'active',
    },
    steamAccount: {
      steamId: '76561198000000000',
      steamProfileId: 'profile-id',
      personaName: 'Steam User',
      avatarUrl: null,
      isPrimary: true,
    },
    publicProfile: null,
  };
}
