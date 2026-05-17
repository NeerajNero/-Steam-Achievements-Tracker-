import { describe, expect, it, vi } from 'vitest';

import type { ProfileMilestonesRepository } from '../repositories/profile-milestones.repository';
import type { CreateProfileMilestoneInput } from './profile-milestones-data.service';
import { ProfileMilestonesDataService } from './profile-milestones-data.service';
import type { ProfileSnapshot } from './profile-snapshots-data.service';

describe('ProfileMilestonesDataService', () => {
  it('creates milestone candidates from a snapshot and relies on repository idempotency', async () => {
    const repository = {
      createIfNotExists: vi.fn(async (input: CreateProfileMilestoneInput) => ({
        id: `${input.milestoneType}-${input.thresholdValue ?? 'none'}`,
        ...input,
        thresholdValue: input.thresholdValue ?? null,
        description: input.description ?? null,
        achievedAt: new Date('2026-01-01T00:00:00.000Z'),
        sourceSnapshotId: input.sourceSnapshotId ?? null,
        metadata: input.metadata ?? {},
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      })),
      findBySteamProfileId: vi.fn(async () => []),
      countBySteamProfileId: vi.fn(async () => 0),
    };
    const service = new ProfileMilestonesDataService(
      repository as unknown as ProfileMilestonesRepository,
    );

    const milestones = await service.createFromSnapshot(createSnapshot());

    expect(milestones).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ milestoneType: 'first_sync' }),
        expect.objectContaining({ milestoneType: 'first_completed_game' }),
        expect.objectContaining({
          milestoneType: 'completed_games_count',
          thresholdValue: 5,
        }),
        expect.objectContaining({
          milestoneType: 'unlocked_achievements_count',
          thresholdValue: 500,
        }),
        expect.objectContaining({
          milestoneType: 'completion_percentage',
          thresholdValue: 75,
        }),
      ]),
    );
    expect(repository.createIfNotExists).toHaveBeenCalledWith(
      expect.objectContaining({
        steamProfileId: 'profile-id',
        sourceSnapshotId: 'snapshot-id',
      }),
    );
  });

  it('returns only newly inserted milestones', async () => {
    const repository = {
      createIfNotExists: vi.fn(async () => null),
      findBySteamProfileId: vi.fn(async () => []),
      countBySteamProfileId: vi.fn(async () => 0),
    };
    const service = new ProfileMilestonesDataService(
      repository as unknown as ProfileMilestonesRepository,
    );

    await expect(service.createFromSnapshot(createSnapshot())).resolves.toEqual([]);
  });
});

function createSnapshot(): ProfileSnapshot {
  return {
    id: 'snapshot-id',
    steamProfileId: 'profile-id',
    totalGames: 8,
    completedGames: 5,
    totalAchievements: 800,
    unlockedAchievements: 520,
    remainingAchievements: 280,
    averageCompletionPercentage: 76,
    totalPlaytimeMinutes: 1200,
    rarestUnlockedGlobalPercentage: 0.5,
    snapshotReason: 'sync_completed',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  };
}
