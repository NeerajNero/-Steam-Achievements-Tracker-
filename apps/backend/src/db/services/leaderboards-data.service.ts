import { Injectable } from '@nestjs/common';

import {
  LeaderboardsRepository,
  type LeaderboardFilters,
  type LeaderboardRow,
  type LeaderboardType,
} from '../repositories/leaderboards.repository';

export type {
  LeaderboardFilters,
  LeaderboardRow,
  LeaderboardType,
} from '../repositories/leaderboards.repository';

@Injectable()
export class LeaderboardsDataService {
  constructor(private readonly leaderboardsRepository: LeaderboardsRepository) {}

  async findLeaderboard(filters: LeaderboardFilters): Promise<LeaderboardRow[]> {
    return this.leaderboardsRepository.findLeaderboard(filters);
  }
}
