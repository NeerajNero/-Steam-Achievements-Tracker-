import type { LeaderboardItemResponseDto } from '@steam-achievement/client-sdk';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { EmptyState, ErrorState, LoadingState } from '@/components/ui/panel-state';
import {
  formatDateTime,
  formatNumber,
  formatPercent,
  getErrorMessage,
} from '@/lib/format';

import { getLeaderboardProfileHref } from '../utils/leaderboard-types';

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
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-normal text-slate-500">
            <tr>
              <th className="px-4 py-3">Rank</th>
              <th className="px-4 py-3">Profile</th>
              <th className="px-4 py-3">Score</th>
              <th className="px-4 py-3">Completed</th>
              <th className="px-4 py-3">Achievements</th>
              <th className="px-4 py-3">Snapshot</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item) => (
              <tr key={`${item.rank}-${item.steamId}`}>
                <td className="px-4 py-3 font-semibold text-slate-950">
                  #{item.rank}
                </td>
                <td className="px-4 py-3">
                  <Link
                    className="flex min-w-52 items-center gap-3 text-slate-950 hover:text-blue-700"
                    href={getLeaderboardProfileHref(item)}
                  >
                    {item.avatarUrl ? (
                      <img
                        alt=""
                        className="h-9 w-9 rounded-md"
                        src={item.avatarUrl}
                      />
                    ) : (
                      <span className="h-9 w-9 rounded-md bg-slate-200" />
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
                <td className="px-4 py-3 font-semibold text-slate-950">
                  {formatLeaderboardScore(item)}
                </td>
                <td className="px-4 py-3 text-slate-700">
                  {formatNumber(item.snapshot.completedGames)} /{' '}
                  {formatNumber(item.snapshot.totalGames)}
                </td>
                <td className="px-4 py-3 text-slate-700">
                  {formatNumber(item.snapshot.unlockedAchievements)} /{' '}
                  {formatNumber(item.snapshot.totalAchievements)}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {formatDateTime(item.snapshot.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
