import { Injectable } from '@nestjs/common';

import { TargetCompletionDataService } from '../../db/services/target-completion-data.service';

export interface AchievementSyncTargetCompletionResult {
  achievementTargetsCompleted: number;
  gameTargetsCompleted: number;
}

@Injectable()
export class TargetCompletionService {
  constructor(
    private readonly targetCompletionDataService: TargetCompletionDataService,
  ) {}

  async completeAfterAchievementSync(
    steamProfileId: string,
    steamAppId: number,
  ): Promise<AchievementSyncTargetCompletionResult> {
    const [achievementTargetsCompleted, gameTargetsCompleted] =
      await Promise.all([
        this.targetCompletionDataService.completeActiveAchievementTargetsForProfileGames(
          steamProfileId,
          [steamAppId],
        ),
        this.targetCompletionDataService.completeActiveGameTargetsForProfileGames(
          steamProfileId,
          [steamAppId],
        ),
      ]);

    return {
      achievementTargetsCompleted,
      gameTargetsCompleted,
    };
  }
}
