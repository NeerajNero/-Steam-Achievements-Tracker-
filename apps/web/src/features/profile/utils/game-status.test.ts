import { describe, expect, it } from 'vitest';
import { GameLibraryItemResponseDtoAchievementDataStateEnum } from '@steam-achievement/client-sdk';

import { formatProfileGameStatusLabel, getProfileGameStatus } from './game-status';

describe('profile game status helpers', () => {
  it('distinguishes metadata-only achievement data from no-achievement games', () => {
    expect(
      getProfileGameStatus({
        steamAppId: 550,
        name: 'Metadata Game',
        iconUrl: null,
        logoUrl: null,
        hasAchievements: true,
        playtimeMinutes: 120,
        playtimeTwoWeeksMinutes: 0,
        totalAchievements: 39,
        achievementMetadataCount: 39,
        knownUnlockStateCount: 0,
        achievementDataState:
          GameLibraryItemResponseDtoAchievementDataStateEnum.MetadataOnly,
        unlockedAchievements: 0,
        remainingAchievements: 0,
        completionPercentage: 0,
        lastPlayedAt: null,
        lastSyncedAt: null,
      }),
    ).toBe('metadata_only');

    expect(formatProfileGameStatusLabel('metadata_only')).toBe('Metadata Available');
  });

  it('does not label missing achievement metadata as no achievements', () => {
    expect(
      getProfileGameStatus({
        steamAppId: 2669320,
        name: 'Not Synced Game',
        iconUrl: null,
        logoUrl: null,
        hasAchievements: false,
        playtimeMinutes: 300,
        playtimeTwoWeeksMinutes: 0,
        totalAchievements: 0,
        achievementMetadataCount: 0,
        knownUnlockStateCount: 0,
        achievementDataState: GameLibraryItemResponseDtoAchievementDataStateEnum.NotSynced,
        unlockedAchievements: 0,
        remainingAchievements: 0,
        completionPercentage: 0,
        lastPlayedAt: null,
        lastSyncedAt: null,
      }),
    ).toBe('not_synced');

    expect(formatProfileGameStatusLabel('not_synced')).toBe('Metadata Not Synced');
  });
});
