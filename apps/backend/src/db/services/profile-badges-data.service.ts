import { Injectable } from '@nestjs/common';

import {
  ProfileBadgesRepository,
  type AwardProfileBadgeInput,
  type ProfileBadge,
  type ProfileBadgeWithBadge,
} from '../repositories/profile-badges.repository';
import type { ProfileMilestone } from '../repositories/profile-milestones.repository';
import { ActivityEventsDataService } from './activity-events-data.service';
import { BadgesDataService } from './badges-data.service';

export type {
  AwardProfileBadgeInput,
  ProfileBadge,
  ProfileBadgeWithBadge,
} from '../repositories/profile-badges.repository';

export interface BadgeAwardSummary {
  badgesAwarded: number;
  activityEventsCreated: number;
}

@Injectable()
export class ProfileBadgesDataService {
  constructor(
    private readonly profileBadgesRepository: ProfileBadgesRepository,
    private readonly badgesDataService: BadgesDataService,
    private readonly activityEventsDataService: ActivityEventsDataService,
  ) {}

  async awardIfNotExists(
    input: AwardProfileBadgeInput,
  ): Promise<ProfileBadge | null> {
    return this.profileBadgesRepository.awardIfNotExists(input);
  }

  async awardFromMilestones(
    milestones: ProfileMilestone[],
  ): Promise<BadgeAwardSummary> {
    let badgesAwarded = 0;
    let activityEventsCreated = 0;

    for (const milestone of milestones) {
      const code = getBadgeCodeForMilestone(milestone);

      if (code === null) {
        continue;
      }

      const badge = await this.badgesDataService.findActiveByCode(code);

      if (badge === null) {
        continue;
      }

      const awarded = await this.awardIfNotExists({
        steamProfileId: milestone.steamProfileId,
        badgeId: badge.id,
        sourceMilestoneId: milestone.id,
        earnedAt: milestone.achievedAt,
        metadata: {
          badgeCode: badge.code,
          sourceMilestoneType: milestone.milestoneType,
          sourceThresholdValue: milestone.thresholdValue,
        },
      });

      if (awarded === null) {
        continue;
      }

      badgesAwarded += 1;
      await this.activityEventsDataService.create({
        steamProfileId: milestone.steamProfileId,
        eventType: 'badge_earned',
        entityType: 'badge',
        entityId: awarded.id,
        metadata: {
          badgeCode: badge.code,
          badgeName: badge.name,
          badgeTier: badge.tier,
          sourceMilestoneId: milestone.id,
        },
      });
      activityEventsCreated += 1;
    }

    return { badgesAwarded, activityEventsCreated };
  }

  async findBySteamProfileId(
    steamProfileId: string,
  ): Promise<ProfileBadgeWithBadge[]> {
    return this.profileBadgesRepository.findBySteamProfileId(steamProfileId);
  }
}

export function getBadgeCodeForMilestone(
  milestone: Pick<ProfileMilestone, 'milestoneType' | 'thresholdValue'>,
): string | null {
  switch (milestone.milestoneType) {
    case 'first_sync':
      return 'first-sync';
    case 'first_completed_game':
      return 'first-completed-game';
    case 'completed_games_count':
      return milestone.thresholdValue !== null &&
        [1, 5, 10, 25].includes(milestone.thresholdValue)
        ? `completed-games-${milestone.thresholdValue}`
        : null;
    case 'unlocked_achievements_count':
      return milestone.thresholdValue !== null &&
        [100, 500, 1000].includes(milestone.thresholdValue)
        ? `achievements-${milestone.thresholdValue}`
        : null;
    case 'completion_percentage':
      return milestone.thresholdValue !== null &&
        [25, 50, 75, 90, 100].includes(milestone.thresholdValue)
        ? `completion-${milestone.thresholdValue}`
        : null;
    case 'rare_achievement':
      return null;
  }

  return null;
}
