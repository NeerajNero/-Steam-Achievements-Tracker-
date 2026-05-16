import { Injectable } from '@nestjs/common';

import {
  AchievementSyncRepository,
  type ApplyGameAchievementSyncInput,
  type ApplyGameAchievementSyncResult,
} from '../repositories/achievement-sync.repository';

export type {
  AchievementProgressResult,
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

  async applyGameAchievementSync(
    input: ApplyGameAchievementSyncInput,
  ): Promise<ApplyGameAchievementSyncResult> {
    return this.achievementSyncRepository.applyGameAchievementSync(input);
  }
}
