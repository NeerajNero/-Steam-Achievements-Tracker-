import { Injectable } from '@nestjs/common';

import {
  GuideVotesRepository,
  type GuideVote,
  type GuideVoteSummary,
  type GuideVoteValue,
} from '../repositories/guide-votes.repository';

export type {
  GuideVote,
  GuideVoteSummary,
  GuideVoteValue,
} from '../repositories/guide-votes.repository';

@Injectable()
export class GuideVotesDataService {
  constructor(private readonly guideVotesRepository: GuideVotesRepository) {}

  async getSummary(
    guideId: string,
    currentUserId?: string,
  ): Promise<GuideVoteSummary> {
    return this.guideVotesRepository.getSummary(guideId, currentUserId);
  }

  async upsert(
    guideId: string,
    userId: string,
    value: GuideVoteValue,
  ): Promise<GuideVote> {
    return this.guideVotesRepository.upsert(guideId, userId, value);
  }

  async remove(guideId: string, userId: string): Promise<boolean> {
    return this.guideVotesRepository.remove(guideId, userId);
  }
}
