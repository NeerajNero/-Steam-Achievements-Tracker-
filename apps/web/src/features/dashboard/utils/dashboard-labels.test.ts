import {
  DashboardGameRefResponseDtoAchievementDataStateEnum,
  DashboardNextTargetResponseDtoTypeEnum,
  type DashboardNextTargetResponseDto,
} from '@steam-achievement/client-sdk';
import { describe, expect, it } from 'vitest';

import {
  getDataQualityLabel,
  getTargetReason,
  getTargetTypeLabel,
} from './dashboard-labels';

describe('dashboard labels', () => {
  it('returns target reasons from deterministic backend rules', () => {
    const target = {
      type: DashboardNextTargetResponseDtoTypeEnum.ClosestCompletion,
      reason: 'Only 3 achievements remaining',
      href: '/profiles/steam/games/1',
      game: {
        steamAppId: 1,
        name: 'Demo',
        totalAchievements: 10,
        unlockedAchievements: 7,
        remainingAchievements: 3,
        completionPercentage: 70,
        achievementDataState:
          DashboardGameRefResponseDtoAchievementDataStateEnum.UnlockStateSynced,
        playtimeMinutes: 120,
        playtimeTwoWeeksMinutes: 0,
      },
    } satisfies DashboardNextTargetResponseDto;

    expect(getTargetReason(target)).toBe('Only 3 achievements remaining');
    expect(getTargetTypeLabel(target.type)).toBe('Close completion');
  });

  it('labels metadata-only and not-synced games distinctly', () => {
    expect(
      getDataQualityLabel(
        DashboardGameRefResponseDtoAchievementDataStateEnum.MetadataOnly,
      ),
    ).toBe('Achievement metadata is available, but Steam did not provide unlock state.');
    expect(
      getDataQualityLabel(
        DashboardGameRefResponseDtoAchievementDataStateEnum.NotSynced,
      ),
    ).toBe('Achievement metadata has not been synced for this game yet.');
  });
});
