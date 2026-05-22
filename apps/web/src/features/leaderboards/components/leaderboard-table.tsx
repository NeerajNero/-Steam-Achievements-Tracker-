import type { LeaderboardItemResponseDto } from '@steam-achievement/client-sdk';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { EmptyState, ErrorState, LoadingState } from '@/components/ui/panel-state';
import { SectionCard } from '@/components/ui/section-card';
import {
  formatDateTime,
  formatNumber,
  formatPercent,
  getErrorMessage,
} from '@/lib/format';

import {
  getLeaderboardProfileHref,
  getLeaderboardRankClassName,
} from '../utils/leaderboard-types';

function formatLeaderboardScore(item: LeaderboardItemResponseDto): string {
  if (item.snapshot.averageCompletionPercentage === item.score) {
    return formatPercent(item.score);
  }

  return formatNumber(item.score);
}

export function LeaderboardTable({
  error,
  isError,
  isLoading,
  items,
}: Readonly<{
  error: unknown;
  isError: boolean;
  isLoading: boolean;
  items: LeaderboardItemResponseDto[] | undefined;
}>): ReactNode {
  if (isLoading) {
    return <LoadingState message="Loading leaderboard..." />;
  }

  if (isError) {
    return (
      <ErrorState
        message={getErrorMessage(error)}
        title="Leaderboard is unavailable"
      />
    );
  }

  if (!items || items.length === 0) {
    return (
      <EmptyState
        message="No profiles have leaderboard snapshots yet."
        title="No leaderboard entries"
      />
    );
  }

  return (
    <SectionCard title="Rankings">
      <div className="grid gap-3 lg:hidden">
        {items.map((item) => (
          <article
            className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4"
            key={`${item.rank}-${item.steamId}-mobile`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`grid h-12 w-12 place-items-center rounded-2xl border font-semibold ${getLeaderboardRankClassName(item.rank)}`}
                >
                  #{item.rank}
                </div>
                <Link
                  className="flex items-center gap-3 text-white hover:text-lime-200"
                  href={getLeaderboardProfileHref(item)}
                >
                  {item.avatarUrl ? (
                    <img
                      alt=""
                      className="h-10 w-10 rounded-xl"
                      src={item.avatarUrl}
                    />
                  ) : (
                    <span className="h-10 w-10 rounded-xl bg-white/10" />
                  )}
                  <span>
                    <span className="block font-medium">
                      {item.personaName ?? item.steamId}
                    </span>
                    <span className="block text-xs text-slate-500">
                      {item.publicSlug ? `/u/${item.publicSlug}` : item.steamId}
                    </span>
                  </span>
                </Link>
              </div>
              <span className="font-semibold text-lime-100">
                {formatLeaderboardScore(item)}
              </span>
            </div>
            <div className="mt-4 grid gap-3 text-sm text-slate-300 sm:grid-cols-3">
              <div>
                <p className="text-xs uppercase tracking-[0.12em] text-slate-500">
                  Completed
                </p>
                <p className="mt-1">
                  {formatNumber(item.snapshot.completedGames)} /{' '}
                  {formatNumber(item.snapshot.totalGames)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.12em] text-slate-500">
                  Achievements
                </p>
                <p className="mt-1">
                  {formatNumber(item.snapshot.unlockedAchievements)} /{' '}
                  {formatNumber(item.snapshot.totalAchievements)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.12em] text-slate-500">
                  Snapshot
                </p>
                <p className="mt-1">{formatDateTime(item.snapshot.createdAt)}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
      <div className="hidden overflow-x-auto lg:block">
        <table className="min-w-full divide-y divide-white/10 text-sm">
          <thead className="bg-white/5 text-left text-xs font-semibold uppercase tracking-normal text-slate-400">
            <tr>
              <th className="px-4 py-3">Rank</th>
              <th className="px-4 py-3">Profile</th>
              <th className="px-4 py-3">Score</th>
              <th className="px-4 py-3">Completed</th>
              <th className="px-4 py-3">Achievements</th>
              <th className="px-4 py-3">Snapshot</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {items.map((item) => (
              <tr key={`${item.rank}-${item.steamId}`}>
                <td className="px-4 py-3">
                  <span
                    className={`inline-grid h-10 min-w-10 place-items-center rounded-2xl border px-3 font-semibold ${getLeaderboardRankClassName(item.rank)}`}
                  >
                    #{item.rank}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Link
                    className="flex min-w-52 items-center gap-3 text-white hover:text-lime-200"
                    href={getLeaderboardProfileHref(item)}
                  >
                    {item.avatarUrl ? (
                      <img
                        alt=""
                        className="h-9 w-9 rounded-xl"
                        src={item.avatarUrl}
                      />
                    ) : (
                      <span className="h-9 w-9 rounded-xl bg-white/10" />
                    )}
                    <span>
                      <span className="block font-medium">
                        {item.personaName ?? item.steamId}
                      </span>
                      <span className="block text-xs text-slate-500">
                        {item.publicSlug ? `/u/${item.publicSlug}` : item.steamId}
                      </span>
                    </span>
                  </Link>
                </td>
                <td className="px-4 py-3 font-semibold text-lime-100">
                  {formatLeaderboardScore(item)}
                </td>
                <td className="px-4 py-3 text-slate-300">
                  {formatNumber(item.snapshot.completedGames)} /{' '}
                  {formatNumber(item.snapshot.totalGames)}
                </td>
                <td className="px-4 py-3 text-slate-300">
                  {formatNumber(item.snapshot.unlockedAchievements)} /{' '}
                  {formatNumber(item.snapshot.totalAchievements)}
                </td>
                <td className="px-4 py-3 text-slate-400">
                  {formatDateTime(item.snapshot.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}
