import { Injectable } from '@nestjs/common';

import {
  ProfileAchievementsRepository,
  type AchievementUnlockStateFilters,
  type AchievementWithUnlockState,
  type ProfileAchievement,
  type RarestUnlockedAchievement,
  type UpsertProfileAchievementInput,
} from '../repositories/profile-achievements.repository';

export type {
  AchievementSort,
  AchievementStatusFilter,
  AchievementUnlockStateFilters,
  AchievementWithUnlockState,
  NewProfileAchievement,
  ProfileAchievement,
  RarestUnlockedAchievement,
  SortOrder,
  UpsertProfileAchievementInput,
} from '../repositories/profile-achievements.repository';

@Injectable()
export class ProfileAchievementsDataService {
  constructor(
    private readonly profileAchievementsRepository: ProfileAchievementsRepository,
  ) {}

  async upsertProfileAchievement(
    input: UpsertProfileAchievementInput,
  ): Promise<ProfileAchievement> {
    return this.profileAchievementsRepository.upsertProfileAchievement(input);
  }

  async findByProfileAndAchievement(
    profileId: string,
    achievementId: string,
  ): Promise<ProfileAchievement | null> {
    return this.profileAchievementsRepository.findByProfileAndAchievement(
      profileId,
      achievementId,
    );
  }

  async findUnlockedByProfile(
    profileId: string,
    limit?: number,
  ): Promise<ProfileAchievement[]> {
    return this.profileAchievementsRepository.findUnlockedByProfile(
      profileId,
      limit,
    );
  }

  async findRarestUnlockedByProfile(
    profileId: string,
    limit: number,
  ): Promise<RarestUnlockedAchievement[]> {
    return this.profileAchievementsRepository.findRarestUnlockedByProfile(
      profileId,
      limit,
    );
  }

  async findAchievementsWithUnlockState(
    profileId: string,
    steamAppId: number,
    filters: AchievementUnlockStateFilters = {},
  ): Promise<AchievementWithUnlockState[]> {
    return this.profileAchievementsRepository.findAchievementsWithUnlockState(
      profileId,
      steamAppId,
      filters,
    );
  }
}
