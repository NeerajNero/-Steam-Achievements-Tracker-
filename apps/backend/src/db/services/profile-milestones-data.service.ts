import { Injectable } from '@nestjs/common';

import {
  ProfileMilestonesRepository,
  type CreateProfileMilestoneInput,
  type ProfileMilestone,
  type ProfileMilestoneType,
} from '../repositories/profile-milestones.repository';
import type { ProfileSnapshot } from './profile-snapshots-data.service';

export type {
  CreateProfileMilestoneInput,
  ProfileMilestone,
  ProfileMilestoneType,
} from '../repositories/profile-milestones.repository';

@Injectable()
export class ProfileMilestonesDataService {
  constructor(
    private readonly profileMilestonesRepository: ProfileMilestonesRepository,
  ) {}

  async createIfNotExists(
    input: CreateProfileMilestoneInput,
  ): Promise<ProfileMilestone | null> {
    return this.profileMilestonesRepository.createIfNotExists(input);
  }

  async createFromSnapshot(snapshot: ProfileSnapshot): Promise<ProfileMilestone[]> {
    const candidates = getMilestoneCandidates(snapshot);
    const created: ProfileMilestone[] = [];

    for (const candidate of candidates) {
      const milestone = await this.createIfNotExists(candidate);
      if (milestone !== null) {
        created.push(milestone);
      }
    }

    return created;
  }

  async findBySteamProfileId(
    steamProfileId: string,
    input: { limit: number; offset: number },
  ): Promise<ProfileMilestone[]> {
    return this.profileMilestonesRepository.findBySteamProfileId(
      steamProfileId,
      input,
    );
  }

  async countBySteamProfileId(steamProfileId: string): Promise<number> {
    return this.profileMilestonesRepository.countBySteamProfileId(steamProfileId);
  }
}

function getMilestoneCandidates(
  snapshot: ProfileSnapshot,
): CreateProfileMilestoneInput[] {
  const candidates: CreateProfileMilestoneInput[] = [
    {
      steamProfileId: snapshot.steamProfileId,
      milestoneType: 'first_sync',
      thresholdValue: null,
      title: 'First Sync',
      description: 'Synced this Steam profile for the first time.',
      sourceSnapshotId: snapshot.id,
    },
  ];

  if (snapshot.completedGames >= 1) {
    candidates.push({
      steamProfileId: snapshot.steamProfileId,
      milestoneType: 'first_completed_game',
      thresholdValue: null,
      title: 'First Completed Game',
      description: 'Completed the first tracked Steam game.',
      sourceSnapshotId: snapshot.id,
    });
  }

  for (const threshold of [1, 5, 10, 25, 50, 100]) {
    if (snapshot.completedGames >= threshold) {
      candidates.push({
        steamProfileId: snapshot.steamProfileId,
        milestoneType: 'completed_games_count',
        thresholdValue: threshold,
        title: `${threshold} Completed Game${threshold === 1 ? '' : 's'}`,
        description: `Reached ${threshold} completed tracked Steam game${threshold === 1 ? '' : 's'}.`,
        sourceSnapshotId: snapshot.id,
      });
    }
  }

  for (const threshold of [100, 500, 1000, 2500, 5000]) {
    if (snapshot.unlockedAchievements >= threshold) {
      candidates.push({
        steamProfileId: snapshot.steamProfileId,
        milestoneType: 'unlocked_achievements_count',
        thresholdValue: threshold,
        title: `${threshold} Achievements Unlocked`,
        description: `Reached ${threshold} unlocked tracked Steam achievements.`,
        sourceSnapshotId: snapshot.id,
      });
    }
  }

  for (const threshold of [25, 50, 75, 90, 100]) {
    if (snapshot.averageCompletionPercentage >= threshold) {
      candidates.push({
        steamProfileId: snapshot.steamProfileId,
        milestoneType: 'completion_percentage',
        thresholdValue: threshold,
        title: `${threshold}% Average Completion`,
        description: `Reached ${threshold}% average completion across tracked Steam games.`,
        sourceSnapshotId: snapshot.id,
      });
    }
  }

  return candidates;
}
