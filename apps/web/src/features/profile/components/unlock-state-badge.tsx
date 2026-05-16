import type { AchievementWithUnlockStateResponseDtoUnlockStateEnum } from '@steam-achievement/client-sdk';
import type { ReactNode } from 'react';

import {
  getUnlockStateBadgeClassName,
  getUnlockStateLabel,
} from '../utils/unlock-state';

export function UnlockStateBadge({
  unlockState,
}: Readonly<{
  unlockState: AchievementWithUnlockStateResponseDtoUnlockStateEnum;
}>): ReactNode {
  return (
    <span className={getUnlockStateBadgeClassName(unlockState)}>
      {getUnlockStateLabel(unlockState)}
    </span>
  );
}
