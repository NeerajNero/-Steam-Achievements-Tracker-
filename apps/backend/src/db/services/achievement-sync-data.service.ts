import { Injectable } from '@nestjs/common';

import {
  AchievementSyncRepository,
  type ApplyGameAchievementMetadataInput,
  type ApplyGameAchievementMetadataResult,
  type ApplyGameAchievementSyncInput,
  type ApplyGameAchievementSyncResult,
} from '../repositories/achievement-sync.repository';

export type {
  AchievementProgressResult,
  ApplyGameAchievementMetadataInput,
  ApplyGameAchievementMetadataResult,
  ApplyGameAchievementSyncInput,
  ApplyGameAchievementSyncResult,
  SyncedAchievementInput,
  SyncedProfileAchievementInput,
} from '../repositories/achievement-sync.repository';

@Injectable()
export class AchievementSyncDataService {
  constructor(
    private readonly achievementSyncRepository: AchievementSyncRepository,
  ) {}

  async applyGameAchievementMetadata(
    input: ApplyGameAchievementMetadataInput,
  ): Promise<ApplyGameAchievementMetadataResult> {
    return this.achievementSyncRepository.applyGameAchievementMetadata(input);
  }

  async applyGameAchievementSync(
    input: ApplyGameAchievementSyncInput,
  ): Promise<ApplyGameAchievementSyncResult> {
    return this.achievementSyncRepository.applyGameAchievementSync(input);
  }
}
