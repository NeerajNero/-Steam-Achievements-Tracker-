import { AchievementWithUnlockStateResponseDtoUnlockStateEnum } from '@steam-achievement/client-sdk';

export function getUnlockStateLabel(
  unlockState: AchievementWithUnlockStateResponseDtoUnlockStateEnum,
): string {
  if (
    unlockState === AchievementWithUnlockStateResponseDtoUnlockStateEnum.Unknown
  ) {
    return 'Unknown unlock state';
  }

  return unlockState;
}

export function getUnlockStateBadgeClassName(
  unlockState: AchievementWithUnlockStateResponseDtoUnlockStateEnum,
): string {
  const base =
    'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize tracking-normal';

  if (
    unlockState === AchievementWithUnlockStateResponseDtoUnlockStateEnum.Unlocked
  ) {
    return `${base} bg-emerald-50 text-emerald-700`;
  }

  if (
    unlockState === AchievementWithUnlockStateResponseDtoUnlockStateEnum.Unknown
  ) {
    return `${base} bg-amber-50 text-amber-800`;
  }

  return `${base} bg-slate-100 text-slate-700`;
}
