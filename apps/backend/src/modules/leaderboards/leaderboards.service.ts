import { Injectable, NotFoundException } from '@nestjs/common';

import {
  LeaderboardsDataService,
  type LeaderboardRow,
  type LeaderboardType,
} from '../../db/services/leaderboards-data.service';
import type { LeaderboardQueryDto } from './dto/leaderboard-query.dto';
import {
  LEADERBOARD_TYPES,
  type LeaderboardItemResponseDto,
  type LeaderboardResponseDto,
  type LeaderboardsResponseDto,
  type LeaderboardTypeDto,
} from './dto/leaderboard-response.dto';

const LEADERBOARD_METADATA: Record<
  LeaderboardTypeDto,
  { label: string; description: string }
> = {
  completion_percentage: {
    label: 'Completion Percentage',
    description: 'Highest average completion percentage across tracked games.',
  },
  completed_games: {
    label: 'Completed Games',
    description: 'Most tracked games completed to 100%.',
  },
  unlocked_achievements: {
    label: 'Unlocked Achievements',
    description: 'Most unlocked achievements across tracked games.',
  },
  rarest_unlocks: {
    label: 'Rarest Unlocks',
    description: 'Lowest global rarity among unlocked achievements.',
  },
};

@Injectable()
export class LeaderboardsService {
  constructor(private readonly leaderboardsDataService: LeaderboardsDataService) {}

  listLeaderboards(): LeaderboardsResponseDto {
    return {
      items: LEADERBOARD_TYPES.map((type) => ({
        type,
        ...LEADERBOARD_METADATA[type],
      })),
    };
  }

  async getLeaderboard(
    type: string,
    query: LeaderboardQueryDto,
  ): Promise<LeaderboardResponseDto> {
    if (!isLeaderboardType(type)) {
      throw new NotFoundException(`Leaderboard ${type} was not found`);
    }

    const items = await this.leaderboardsDataService.findLeaderboard({
      type,
      limit: query.limit,
      offset: query.offset,
    });

    return {
      type,
      items: items.map(mapLeaderboardItem),
      limit: query.limit,
      offset: query.offset,
    };
  }
}

function mapLeaderboardItem(row: LeaderboardRow): LeaderboardItemResponseDto {
  return {
    rank: row.rank,
    steamId: row.steamId,
    personaName: row.personaName,
    avatarUrl: row.avatarUrl,
    publicSlug: row.publicSlug,
    score: roundScore(row.score),
    snapshot: {
      totalGames: row.totalGames,
      completedGames: row.completedGames,
      totalAchievements: row.totalAchievements,
      unlockedAchievements: row.unlockedAchievements,
      remainingAchievements: row.remainingAchievements,
      averageCompletionPercentage: row.averageCompletionPercentage,
      rarestUnlockedGlobalPercentage: row.rarestUnlockedGlobalPercentage,
      createdAt: row.createdAt.toISOString(),
    },
  };
}

function isLeaderboardType(type: string): type is LeaderboardType {
  return LEADERBOARD_TYPES.includes(type as LeaderboardTypeDto);
}

function roundScore(value: number): number {
  return Math.round(value * 1000) / 1000;
}
