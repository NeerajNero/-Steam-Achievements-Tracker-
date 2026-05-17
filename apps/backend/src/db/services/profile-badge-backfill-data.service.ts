import { Inject, Injectable } from '@nestjs/common';

import { ProfileBadgesDataService } from './profile-badges-data.service';
import { ProfileMilestonesDataService } from './profile-milestones-data.service';
import { ProfileSnapshotsDataService } from './profile-snapshots-data.service';

export interface BadgeBackfillResult {
  steamProfileId: string;
  milestonesProcessed: number;
  badgesAwarded: number;
  activityEventsCreated: number;
}

export interface BadgeBackfillSummary {
  profilesProcessed: number;
  milestonesProcessed: number;
  badgesAwarded: number;
  activityEventsCreated: number;
}

@Injectable()
export class ProfileBadgeBackfillDataService {
  constructor(
    @Inject(ProfileSnapshotsDataService)
    private readonly profileSnapshotsDataService: ProfileSnapshotsDataService,
    @Inject(ProfileMilestonesDataService)
    private readonly profileMilestonesDataService: ProfileMilestonesDataService,
    @Inject(ProfileBadgesDataService)
    private readonly profileBadgesDataService: ProfileBadgesDataService,
  ) {}

  async backfillBadgesForProfile(
    steamProfileId: string,
  ): Promise<BadgeBackfillResult> {
    const milestones = await this.profileMilestonesDataService.findBySteamProfileId(
      steamProfileId,
      { limit: 500, offset: 0 },
    );
    const result = await this.profileBadgesDataService.awardFromMilestones(
      milestones,
    );

    return {
      steamProfileId,
      milestonesProcessed: milestones.length,
      badgesAwarded: result.badgesAwarded,
      activityEventsCreated: result.activityEventsCreated,
    };
  }

  async backfillAllProfilesWithMilestones(): Promise<BadgeBackfillSummary> {
    const steamProfileIds =
      await this.profileSnapshotsDataService.findSteamProfileIdsWithSnapshots();
    let milestonesProcessed = 0;
    let badgesAwarded = 0;
    let activityEventsCreated = 0;

    for (const steamProfileId of steamProfileIds) {
      const result = await this.backfillBadgesForProfile(steamProfileId);
      milestonesProcessed += result.milestonesProcessed;
      badgesAwarded += result.badgesAwarded;
      activityEventsCreated += result.activityEventsCreated;
    }

    return {
      profilesProcessed: steamProfileIds.length,
      milestonesProcessed,
      badgesAwarded,
      activityEventsCreated,
    };
  }
}
