import { describe, expect, it, vi } from 'vitest';

import type { ActivityEventsDataService } from './activity-events-data.service';
import { ProfileMilestoneBackfillDataService } from './profile-milestone-backfill-data.service';
import type { ProfileMilestonesDataService } from './profile-milestones-data.service';
import type { ProfileSnapshot, ProfileSnapshotsDataService } from './profile-snapshots-data.service';

describe('ProfileMilestoneBackfillDataService', () => {
  it('creates milestones and milestone activity from the latest snapshot', async () => {
    const services = createServices({
      latestSnapshot: createSnapshot(),
      createdMilestones: [
        {
          id: 'milestone-id',
          steamProfileId: 'profile-id',
          milestoneType: 'first_sync',
          thresholdValue: null,
          title: 'First Sync',
          description: null,
          achievedAt: new Date('2026-01-01T00:00:00.000Z'),
          sourceSnapshotId: 'snapshot-id',
          metadata: {},
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
        },
      ],
    });
    const service = new ProfileMilestoneBackfillDataService(
      services.snapshots,
      services.milestones,
      services.activity,
    );

    await expect(
      service.backfillMilestonesForProfile('profile-id'),
    ).resolves.toEqual({
      steamProfileId: 'profile-id',
      snapshotId: 'snapshot-id',
      milestonesCreated: 1,
      activityEventsCreated: 1,
    });
    expect(services.milestones.createFromSnapshot).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'snapshot-id' }),
    );
    expect(services.activity.create).toHaveBeenCalledWith(
      expect.objectContaining({
        steamProfileId: 'profile-id',
        eventType: 'milestone_reached',
        entityType: 'milestone',
        entityId: 'milestone-id',
      }),
    );
  });

  it('is idempotent when no new milestones are inserted', async () => {
    const services = createServices({
      latestSnapshot: createSnapshot(),
      createdMilestones: [],
    });
    const service = new ProfileMilestoneBackfillDataService(
      services.snapshots,
      services.milestones,
      services.activity,
    );

    await expect(
      service.backfillMilestonesForProfile('profile-id'),
    ).resolves.toEqual({
      steamProfileId: 'profile-id',
      snapshotId: 'snapshot-id',
      milestonesCreated: 0,
      activityEventsCreated: 0,
    });
    expect(services.activity.create).not.toHaveBeenCalled();
  });

  it('handles profiles with no snapshots safely', async () => {
    const services = createServices({
      latestSnapshot: null,
      createdMilestones: [],
    });
    const service = new ProfileMilestoneBackfillDataService(
      services.snapshots,
      services.milestones,
      services.activity,
    );

    await expect(
      service.backfillMilestonesForProfile('profile-id'),
    ).resolves.toEqual({
      steamProfileId: 'profile-id',
      snapshotId: null,
      milestonesCreated: 0,
      activityEventsCreated: 0,
    });
    expect(services.milestones.createFromSnapshot).not.toHaveBeenCalled();
  });

  it('backfills all profiles with snapshots', async () => {
    const services = createServices({
      latestSnapshot: createSnapshot(),
      createdMilestones: [],
      steamProfileIds: ['profile-a', 'profile-b'],
    });
    const service = new ProfileMilestoneBackfillDataService(
      services.snapshots,
      services.milestones,
      services.activity,
    );

    await expect(service.backfillAllProfilesWithSnapshots()).resolves.toEqual({
      profilesProcessed: 2,
      milestonesCreated: 0,
      activityEventsCreated: 0,
    });
    expect(services.snapshots.findLatestBySteamProfileId).toHaveBeenCalledTimes(2);
  });
});

function createServices(input: {
  latestSnapshot: ProfileSnapshot | null;
  createdMilestones: Awaited<
    ReturnType<ProfileMilestonesDataService['createFromSnapshot']>
  >;
  steamProfileIds?: string[];
}): {
  snapshots: ProfileSnapshotsDataService;
  milestones: ProfileMilestonesDataService;
  activity: ActivityEventsDataService;
} {
  return {
    snapshots: {
      findLatestBySteamProfileId: vi.fn(async () => input.latestSnapshot),
      findSteamProfileIdsWithSnapshots: vi.fn(
        async () => input.steamProfileIds ?? ['profile-id'],
      ),
    } as unknown as ProfileSnapshotsDataService,
    milestones: {
      createFromSnapshot: vi.fn(async () => input.createdMilestones),
    } as unknown as ProfileMilestonesDataService,
    activity: {
      create: vi.fn(async (event) => ({
        id: 'activity-id',
        actorUserId: event.actorUserId ?? null,
        steamProfileId: event.steamProfileId ?? null,
        eventType: event.eventType,
        visibility: event.visibility ?? 'public',
        entityType: event.entityType,
        entityId: event.entityId ?? null,
        steamAppId: event.steamAppId ?? null,
        metadata: event.metadata ?? {},
        occurredAt: new Date('2026-01-01T00:00:00.000Z'),
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      })),
    } as unknown as ActivityEventsDataService,
  };
}

function createSnapshot(): ProfileSnapshot {
  return {
    id: 'snapshot-id',
    steamProfileId: 'profile-id',
    totalGames: 8,
    completedGames: 1,
    totalAchievements: 120,
    unlockedAchievements: 100,
    remainingAchievements: 20,
    averageCompletionPercentage: 75,
    totalPlaytimeMinutes: 1500,
    rarestUnlockedGlobalPercentage: 0.7,
    snapshotReason: 'manual',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  };
}
