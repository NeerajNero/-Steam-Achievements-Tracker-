import { describe, expect, it, vi } from 'vitest';

import type { ActivityEventsDataService } from './activity-events-data.service';
import type { BadgesDataService } from './badges-data.service';
import {
  getBadgeCodeForMilestone,
  ProfileBadgesDataService,
} from './profile-badges-data.service';
import type { ProfileBadgesRepository } from '../repositories/profile-badges.repository';
import type { ProfileMilestone } from '../repositories/profile-milestones.repository';

describe('ProfileBadgesDataService', () => {
  it('maps milestone types to baseline badge codes', () => {
    expect(getBadgeCodeForMilestone(milestone('first_sync', null))).toBe(
      'first-sync',
    );
    expect(
      getBadgeCodeForMilestone(milestone('completed_games_count', 10)),
    ).toBe('completed-games-10');
    expect(
      getBadgeCodeForMilestone(milestone('unlocked_achievements_count', 500)),
    ).toBe('achievements-500');
    expect(
      getBadgeCodeForMilestone(milestone('completion_percentage', 90)),
    ).toBe('completion-90');
    expect(
      getBadgeCodeForMilestone(milestone('completed_games_count', 100)),
    ).toBeNull();
  });

  it('awards badges idempotently and records activity only for new awards', async () => {
    const repository = {
      awardIfNotExists: vi.fn(async () => ({
        id: 'profile-badge-id',
        steamProfileId: 'profile-id',
        badgeId: 'badge-id',
        sourceMilestoneId: 'milestone-id',
        earnedAt: new Date('2026-05-17T00:00:00.000Z'),
        metadata: {},
        createdAt: new Date('2026-05-17T00:00:00.000Z'),
      })),
    };
    const badges = {
      findActiveByCode: vi.fn(async () => ({
        id: 'badge-id',
        code: 'first-sync',
        name: 'First Sync',
        description: null,
        badgeType: 'milestone',
        tier: 'bronze',
        iconKey: 'spark',
        sortOrder: 10,
        isActive: true,
        createdAt: new Date('2026-05-17T00:00:00.000Z'),
        updatedAt: new Date('2026-05-17T00:00:00.000Z'),
      })),
    };
    const activity = {
      create: vi.fn(async () => ({ id: 'activity-id' })),
    };
    const service = new ProfileBadgesDataService(
      repository as unknown as ProfileBadgesRepository,
      badges as unknown as BadgesDataService,
      activity as unknown as ActivityEventsDataService,
    );

    const result = await service.awardFromMilestones([
      fullMilestone('first_sync', null),
    ]);

    expect(result).toEqual({ badgesAwarded: 1, activityEventsCreated: 1 });
    expect(activity.create).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'badge_earned',
        entityType: 'badge',
        entityId: 'profile-badge-id',
      }),
    );
  });

  it('does not create activity for already awarded badges', async () => {
    const repository = {
      awardIfNotExists: vi.fn(async () => null),
    };
    const badges = {
      findActiveByCode: vi.fn(async () => ({
        id: 'badge-id',
        code: 'first-sync',
        name: 'First Sync',
        description: null,
        badgeType: 'milestone',
        tier: 'bronze',
        iconKey: 'spark',
        sortOrder: 10,
        isActive: true,
        createdAt: new Date('2026-05-17T00:00:00.000Z'),
        updatedAt: new Date('2026-05-17T00:00:00.000Z'),
      })),
    };
    const activity = {
      create: vi.fn(async () => ({ id: 'activity-id' })),
    };
    const service = new ProfileBadgesDataService(
      repository as unknown as ProfileBadgesRepository,
      badges as unknown as BadgesDataService,
      activity as unknown as ActivityEventsDataService,
    );

    const result = await service.awardFromMilestones([
      fullMilestone('first_sync', null),
    ]);

    expect(result).toEqual({ badgesAwarded: 0, activityEventsCreated: 0 });
    expect(activity.create).not.toHaveBeenCalled();
  });
});

function milestone(
  milestoneType: ProfileMilestone['milestoneType'],
  thresholdValue: number | null,
) {
  return { milestoneType, thresholdValue };
}

function fullMilestone(
  milestoneType: ProfileMilestone['milestoneType'],
  thresholdValue: number | null,
): ProfileMilestone {
  return {
    id: 'milestone-id',
    steamProfileId: 'profile-id',
    milestoneType,
    thresholdValue,
    title: 'Milestone',
    description: null,
    achievedAt: new Date('2026-05-17T00:00:00.000Z'),
    sourceSnapshotId: 'snapshot-id',
    metadata: {},
    createdAt: new Date('2026-05-17T00:00:00.000Z'),
  };
}
