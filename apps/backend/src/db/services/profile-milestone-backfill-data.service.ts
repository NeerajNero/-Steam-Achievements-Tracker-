import { Inject, Injectable } from '@nestjs/common';

import { ActivityEventsDataService } from './activity-events-data.service';
import { ProfileMilestonesDataService } from './profile-milestones-data.service';
import { ProfileSnapshotsDataService } from './profile-snapshots-data.service';

export interface MilestoneBackfillResult {
  steamProfileId: string;
  snapshotId: string | null;
  milestonesCreated: number;
  activityEventsCreated: number;
}

export interface MilestoneBackfillSummary {
  profilesProcessed: number;
  milestonesCreated: number;
  activityEventsCreated: number;
}

@Injectable()
export class ProfileMilestoneBackfillDataService {
  constructor(
    @Inject(ProfileSnapshotsDataService)
    private readonly profileSnapshotsDataService: ProfileSnapshotsDataService,
    @Inject(ProfileMilestonesDataService)
    private readonly profileMilestonesDataService: ProfileMilestonesDataService,
    @Inject(ActivityEventsDataService)
    private readonly activityEventsDataService: ActivityEventsDataService,
  ) {}

  async backfillMilestonesForProfile(
    steamProfileId: string,
  ): Promise<MilestoneBackfillResult> {
    const snapshot =
      await this.profileSnapshotsDataService.findLatestBySteamProfileId(
        steamProfileId,
      );

    if (snapshot === null) {
      return {
        steamProfileId,
        snapshotId: null,
        milestonesCreated: 0,
        activityEventsCreated: 0,
      };
    }

    const milestones =
      await this.profileMilestonesDataService.createFromSnapshot(snapshot);
    let activityEventsCreated = 0;

    for (const milestone of milestones) {
      await this.activityEventsDataService.create({
        steamProfileId: milestone.steamProfileId,
        eventType: 'milestone_reached',
        entityType: 'milestone',
        entityId: milestone.id,
        metadata: {
          milestoneType: milestone.milestoneType,
          thresholdValue: milestone.thresholdValue,
          title: milestone.title,
        },
      });
      activityEventsCreated += 1;
    }

    return {
      steamProfileId,
      snapshotId: snapshot.id,
      milestonesCreated: milestones.length,
      activityEventsCreated,
    };
  }

  async backfillAllProfilesWithSnapshots(): Promise<MilestoneBackfillSummary> {
    const steamProfileIds =
      await this.profileSnapshotsDataService.findSteamProfileIdsWithSnapshots();
    let milestonesCreated = 0;
    let activityEventsCreated = 0;

    for (const steamProfileId of steamProfileIds) {
      const result = await this.backfillMilestonesForProfile(steamProfileId);
      milestonesCreated += result.milestonesCreated;
      activityEventsCreated += result.activityEventsCreated;
    }

    return {
      profilesProcessed: steamProfileIds.length,
      milestonesCreated,
      activityEventsCreated,
    };
  }
}
