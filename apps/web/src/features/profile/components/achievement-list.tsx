import type { AchievementWithUnlockStateResponseDto } from '@steam-achievement/client-sdk';
import type { ReactNode } from 'react';

import { EmptyState, ErrorState, LoadingState } from '@/components/ui/panel-state';
import { SectionCard } from '@/components/ui/section-card';
import { formatDateTime, formatPercent, getErrorMessage } from '@/lib/format';

import { UnlockStateBadge } from './unlock-state-badge';

export function AchievementList({
  achievements,
  error,
  isError,
  isLoading,
}: Readonly<{
  achievements: readonly AchievementWithUnlockStateResponseDto[] | undefined;
  error: unknown;
  isError: boolean;
  isLoading: boolean;
}>): ReactNode {
  return (
    <div className="mt-6">
      <SectionCard
        description="Unknown unlock state means metadata exists but Steam did not provide player unlock state. It is not treated as definitely locked."
        title="Achievements"
      >
      {isLoading ? <LoadingState message="Loading achievements..." /> : null}
      {isError ? (
        <div className="p-4">
          <ErrorState message={getErrorMessage(error)} />
        </div>
      ) : null}
      {achievements?.length === 0 ? (
        <EmptyState message="No achievements are stored for this game." />
      ) : null}
      {achievements && achievements.length > 0 ? (
        <ul className="divide-y divide-white/10">
          {achievements.map((achievement) => (
            <li
              className="grid gap-4 p-4 md:grid-cols-[48px_1fr_auto]"
              key={achievement.apiName}
            >
              {achievement.iconUrl || achievement.iconGrayUrl ? (
                <img
                  alt=""
                  className="h-12 w-12 rounded-xl border border-white/10"
                  src={achievement.iconUrl ?? achievement.iconGrayUrl ?? ''}
                />
              ) : (
                <div className="h-12 w-12 rounded-xl border border-white/10 bg-white/5" />
              )}
              <div>
                <div className="font-medium text-white">
                  {achievement.displayName ?? achievement.apiName}
                </div>
                {achievement.description ? (
                  <p className="mt-1 text-sm leading-6 text-slate-400">
                    {achievement.description}
                  </p>
                ) : null}
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                  <span>{achievement.apiName}</span>
                  {achievement.hidden ? <span>Hidden</span> : null}
                  <span>
                    Rarity:{' '}
                    {achievement.globalPercentage === undefined ||
                    achievement.globalPercentage === null
                      ? 'Unknown'
                      : formatPercent(achievement.globalPercentage)}
                  </span>
                </div>
              </div>
              <div className="md:text-right">
                <UnlockStateBadge unlockState={achievement.unlockState} />
                {achievement.unlockState === 'unknown' ? (
                  <p className="mt-1 text-xs text-amber-800">
                    Unknown unlock state from Steam API availability.
                  </p>
                ) : null}
                {achievement.unlockedAt ? (
                  <div className="mt-2 text-xs text-slate-500">
                    {formatDateTime(achievement.unlockedAt)}
                  </div>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : null}
      </SectionCard>
    </div>
  );
}
