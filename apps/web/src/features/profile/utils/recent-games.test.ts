import { describe, expect, it } from 'vitest';
import { GameLibraryItemResponseDtoAchievementDataStateEnum } from '@steam-achievement/client-sdk';

import { getRecentProfileGames } from './recent-games';

describe('recent games helpers', () => {
  it('keeps games with two-week playtime or a last played timestamp', () => {
    const recent = getRecentProfileGames([
      createGame(1, 0, null),
      createGame(2, 15, null),
      createGame(3, 0, '2026-05-01T00:00:00.000Z'),
    ]);

    expect(recent.map((game) => game.steamAppId)).toEqual([2, 3]);
  });
});

function createGame(
  steamAppId: number,
  playtimeTwoWeeksMinutes: number,
  lastPlayedAt: string | null,
) {
  return {
    steamAppId,
    name: `Game ${steamAppId}`,
    iconUrl: null,
    logoUrl: null,
    hasAchievements: true,
    playtimeMinutes: 100,
    playtimeTwoWeeksMinutes,
    totalAchievements: 10,
    achievementMetadataCount: 10,
    knownUnlockStateCount: 10,
    achievementDataState:
      GameLibraryItemResponseDtoAchievementDataStateEnum.UnlockStateSynced,
    unlockedAchievements: 5,
    remainingAchievements: 5,
    completionPercentage: 50,
    lastPlayedAt,
    lastSyncedAt: null,
  };
}
