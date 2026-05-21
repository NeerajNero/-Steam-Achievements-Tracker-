import { Injectable } from '@nestjs/common';

import { TargetsRepository } from '../repositories/targets.repository';

@Injectable()
export class TargetCompletionDataService {
  constructor(private readonly targetsRepository: TargetsRepository) {}

  async completeActiveAchievementTargetsForProfileGames(
    steamProfileId: string,
    steamAppIds: number[],
  ): Promise<number> {
    return this.targetsRepository.completeActiveAchievementTargetsForProfileGames(
      steamProfileId,
      steamAppIds,
    );
  }

  async completeActiveGameTargetsForProfileGames(
    steamProfileId: string,
    steamAppIds: number[],
  ): Promise<number> {
    return this.targetsRepository.completeActiveGameTargetsForProfileGames(
      steamProfileId,
      steamAppIds,
    );
  }
}
