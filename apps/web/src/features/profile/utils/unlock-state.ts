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
    'inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold tracking-normal';

  if (
    unlockState === AchievementWithUnlockStateResponseDtoUnlockStateEnum.Unlocked
  ) {
    return `${base} border-emerald-300/25 bg-emerald-400/10 text-emerald-100`;
  }

  if (
    unlockState === AchievementWithUnlockStateResponseDtoUnlockStateEnum.Unknown
  ) {
    return `${base} border-amber-300/25 bg-amber-400/10 text-amber-100`;
  }

  return `${base} border-white/10 bg-white/10 text-slate-200`;
}
