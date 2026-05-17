import Link from 'next/link';
import type { ReactNode } from 'react';

import type { RarestAchievementResponseDto } from '@steam-achievement/client-sdk';

import { EmptyState, ErrorState, LoadingState } from '@/components/ui/panel-state';
import {
  formatDateTime,
  formatPercent,
  getErrorMessage,
} from '@/lib/format';

import { AchievementRarityBadge } from './achievement-rarity-badge';

export function RarestAchievements({
  error,
  isError,
  isLoading,
  items,
  steamId,
}: Readonly<{
  error: unknown;
  isError: boolean;
  isLoading: boolean;
  items: readonly RarestAchievementResponseDto[] | undefined;
  steamId: string;
}>): ReactNode {
  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-5">
        <h2 className="text-lg font-semibold text-slate-950">Rarest Achievements</h2>
        <p className="mt-1 text-sm text-slate-600">
          Lowest global rarity among unlocked achievement rows.
        </p>
      </div>

      {isLoading ? <LoadingState message="Loading rarest achievements..." /> : null}
      {isError ? (
        <div className="p-4">
          <ErrorState message={getErrorMessage(error)} />
        </div>
      ) : null}

      {items && items.length > 0 ? (
        <ul className="divide-y divide-slate-100">
          {items.map((achievement) => (
            <li className="p-4" key={`${achievement.steamAppId}-${achievement.apiName}`}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="font-medium text-slate-900">
                    <Link
                      className="text-blue-700 hover:text-blue-900"
                      href={`/profiles/${steamId}/games/${achievement.steamAppId}`}
                    >
                      {achievement.displayName ?? achievement.apiName}
                    </Link>
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    {achievement.steamAppId}
                    {achievement.unlockedAt ? ` · Unlocked ${formatDateTime(achievement.unlockedAt)}` : null}
                  </div>
                </div>
                <AchievementRarityBadge
                  isLocked={achievement.unlockedAt === undefined || achievement.unlockedAt === null}
                  rarity={achievement.globalPercentage}
                />
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {items && items.length === 0 ? (
        <EmptyState message="No rare unlocked achievements available yet." />
      ) : null}
    </section>
  );
}
