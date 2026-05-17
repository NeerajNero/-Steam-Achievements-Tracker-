import Link from 'next/link';
import type { ReactNode } from 'react';

import type { GameLibraryItemResponseDto } from '@steam-achievement/client-sdk';

import { EmptyState, ErrorState, LoadingState } from '@/components/ui/panel-state';
import { SectionCard } from '@/components/ui/section-card';
import { formatDateTime, formatPlaytime, getErrorMessage } from '@/lib/format';

import { getRecentProfileGames } from '../utils/recent-games';

export function RecentGames({
  error,
  isError,
  isLoading,
  items,
  steamId,
}: Readonly<{
  error: unknown;
  isError: boolean;
  isLoading: boolean;
  items: readonly GameLibraryItemResponseDto[] | undefined;
  steamId: string;
}>): ReactNode {
  const recentItems = getRecentProfileGames(items);

  return (
    <SectionCard
      description="Recent play is sourced from Steam owned-game and recently-played data when Steam exposes it."
      title="Recently Played"
    >
      {isLoading ? <LoadingState message="Loading recent games..." /> : null}
      {isError ? (
        <div className="p-4">
          <ErrorState message={getErrorMessage(error)} />
        </div>
      ) : null}
      {!isLoading && !isError && recentItems.length === 0 ? (
        <EmptyState
          message="No recent play data is stored. Steam may not expose recent data, the profile may be private, or nothing was played recently."
          title="No recent play data"
        />
      ) : null}
      {recentItems.length > 0 ? (
        <ul className="divide-y divide-white/10">
          {recentItems.map((game) => (
            <li className="flex items-center justify-between gap-4 p-4" key={game.steamAppId}>
              <div className="min-w-0">
                <Link
                  className="truncate font-medium text-lime-200 hover:text-lime-100"
                  href={`/profiles/${steamId}/games/${game.steamAppId}`}
                >
                  {game.name}
                </Link>
                <div className="mt-1 text-xs text-slate-500">
                  Last played {formatDateTime(game.lastPlayedAt)}
                </div>
              </div>
              <div className="shrink-0 text-right text-sm">
                <div className="font-semibold text-white">
                  {formatPlaytime(game.playtimeTwoWeeksMinutes)}
                </div>
                <div className="text-xs text-slate-500">past 2 weeks</div>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </SectionCard>
  );
}
