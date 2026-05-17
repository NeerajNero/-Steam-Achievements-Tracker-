import { NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import type { LeaderboardsDataService } from '../../db/services/leaderboards-data.service';
import { LeaderboardsService } from './leaderboards.service';

describe('LeaderboardsService', () => {
  it('lists available Steam leaderboard types', () => {
    const service = createService();

    expect(service.listLeaderboards().items.map((item) => item.type)).toEqual([
      'completion_percentage',
      'completed_games',
      'unlocked_achievements',
      'rarest_unlocks',
    ]);
  });

  it('returns ranked rows without private account fields', async () => {
    const service = createService();

    const result = await service.getLeaderboard('completion_percentage', {
      limit: 50,
      offset: 0,
    });

    expect(result.items[0]).toMatchObject({
      rank: 1,
      steamId: '76561198000000000',
      publicSlug: 'nero',
      score: 98.5,
      snapshot: {
        completedGames: 80,
        averageCompletionPercentage: 98.5,
      },
    });
    expect(Object.keys(result.items[0])).not.toEqual(
      expect.arrayContaining(['userId', 'sessionTokenHash', 'session_token_hash']),
    );
  });

  it('rejects unknown leaderboard types', async () => {
    const service = createService();

    await expect(
      service.getLeaderboard('unknown', { limit: 50, offset: 0 }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

function createService(): LeaderboardsService {
  const dataService = {
    findLeaderboard: vi.fn(async () => [
      {
        rank: 1,
        steamId: '76561198000000000',
        personaName: 'Demo Player',
        avatarUrl: null,
        publicSlug: 'nero',
        score: 98.5,
        snapshotId: 'snapshot-id',
        totalGames: 100,
        completedGames: 80,
        totalAchievements: 2000,
        unlockedAchievements: 1900,
        remainingAchievements: 100,
        averageCompletionPercentage: 98.5,
        totalPlaytimeMinutes: 12000,
        rarestUnlockedGlobalPercentage: 0.5,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    ]),
  };

  return new LeaderboardsService(
    dataService as unknown as LeaderboardsDataService,
  );
}
