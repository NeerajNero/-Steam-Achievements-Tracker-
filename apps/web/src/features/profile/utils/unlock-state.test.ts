import { AchievementWithUnlockStateResponseDtoUnlockStateEnum } from '@steam-achievement/client-sdk';
import { describe, expect, it } from 'vitest';

import {
  getUnlockStateBadgeClassName,
  getUnlockStateLabel,
} from './unlock-state';

describe('unlock state helpers', () => {
  it('labels unknown unlock state explicitly', () => {
    expect(
      getUnlockStateLabel(
        AchievementWithUnlockStateResponseDtoUnlockStateEnum.Unknown,
      ),
    ).toBe('Unknown unlock state');
  });

  it('styles unknown differently from locked', () => {
    const unknownClassName = getUnlockStateBadgeClassName(
      AchievementWithUnlockStateResponseDtoUnlockStateEnum.Unknown,
    );
    const lockedClassName = getUnlockStateBadgeClassName(
      AchievementWithUnlockStateResponseDtoUnlockStateEnum.Locked,
    );

    expect(unknownClassName).toContain('amber');
    expect(lockedClassName).toContain('slate');
    expect(unknownClassName).not.toEqual(lockedClassName);
  });
});
