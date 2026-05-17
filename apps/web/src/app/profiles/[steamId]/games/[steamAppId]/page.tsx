'use client';

import {
  ListGameAchievementsOrderEnum,
  ListGameAchievementsSortEnum,
  ListGameAchievementsStatusEnum,
} from '@steam-achievement/client-sdk';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { PageShell } from '@/components/layout/page-shell';
import { ErrorState, LoadingState } from '@/components/ui/panel-state';
import { ProgressBar } from '@/components/ui/progress-bar';
import { SummaryCard } from '@/components/ui/summary-card';
import { useGameAchievements } from '@/features/profile/api/use-game-achievements';
import { useProfileGame } from '@/features/profile/api/use-profile-game';
import { AchievementList } from '@/features/profile/components/achievement-list';
import { GameAchievementFilters } from '@/features/profile/components/game-achievement-filters';
import {
  DEFAULT_GAME_ACHIEVEMENT_FILTERS,
  parseGameAchievementFilters,
  toGameAchievementSearchParams,
  type GameAchievementFilters as GameAchievementFiltersType,
} from '../../../../../features/profile/utils/game-achievement-filters';
import { formatDateTime, formatNumber, formatPercent, formatPlaytime, getErrorMessage, getHttpStatus } from '@/lib/format';

export default function GameDetailPage() {
  const params = useParams<{ steamId: string; steamAppId: string }>();
  const steamId = params.steamId;
  const steamAppId = Number(params.steamAppId);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const parsedSearchParams = useMemo(
    () => parseGameAchievementFilters(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  const [filters, setFilters] = useState<GameAchievementFiltersType>(() => parsedSearchParams);

  useEffect(() => {
    setFilters(parsedSearchParams);
  }, [parsedSearchParams]);

  const game = useProfileGame(steamId, steamAppId);
  const achievements = useGameAchievements(steamId, steamAppId, {
    status: filters.status,
    sort: filters.sort,
    order: filters.order,
  });

  const isMissing = getHttpStatus(game.error) === 404;

  useEffect(() => {
    const normalizedParams = toGameAchievementSearchParams({
      ...DEFAULT_GAME_ACHIEVEMENT_FILTERS,
      ...filters,
    });
    const href = normalizedParams.length > 0 ? `${pathname}?${normalizedParams}` : pathname;
    void router.replace(href, { scroll: false });
  }, [filters, pathname, router]);

  function updateFilters(nextFilters: Partial<GameAchievementFiltersType>): void {
    const merged: GameAchievementFiltersType = {
      ...filters,
      ...nextFilters,
    };
    setFilters(merged);
  }

  return (
    <PageShell maxWidth="max-w-6xl">
      <Link
        className="text-sm font-medium text-lime-200 hover:text-lime-100"
        href={`/profiles/${steamId}`}
      >
        Back to profile
      </Link>

      {game.isLoading ? <LoadingState message="Loading game..." /> : null}
      {isMissing ? (
        <div className="mt-4">
          <ErrorState
            message="This game is not stored for the selected profile yet. Run a games sync from the profile dashboard first."
            title="Game not synced yet"
          />
        </div>
      ) : null}
      {!isMissing && game.isError ? (
        <div className="mt-4">
          <ErrorState
            message={getErrorMessage(game.error)}
            title="Game data is unavailable"
          />
        </div>
      ) : null}

      {game.data ? (
        <section className="mt-4 rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.2),transparent_34%),linear-gradient(135deg,rgba(15,23,42,0.98),rgba(2,6,23,0.96))] p-6 shadow-2xl shadow-black/30 md:p-8">
          <div className="flex flex-wrap items-start gap-4">
            {game.data.iconUrl ? (
              <img
                alt=""
                className="h-20 w-20 rounded-2xl border border-white/10"
                src={game.data.iconUrl}
              />
            ) : null}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-lime-200">Profile game</p>
              <h1 className="mt-1 text-3xl font-semibold tracking-normal text-white md:text-5xl">
                {game.data.name}
              </h1>
              <p className="mt-2 text-sm text-slate-300">
                Steam App {game.data.steamAppId}
              </p>
              <p className="mt-1 text-sm text-slate-400">
                Last synced {formatDateTime(game.data.lastSyncedAt)}
              </p>
              <div className="mt-4 max-w-md">
                <ProgressBar value={game.data.completionPercentage} />
              </div>
            </div>
            <div className="w-full md:w-auto">
              <div className="grid grid-cols-2 gap-3 md:grid-cols-1">
                <SummaryCard
                  label="Achievements"
                  value={
                    `${formatNumber(game.data.unlockedAchievements)} / ${formatNumber(game.data.totalAchievements)}`
                  }
                />
                <SummaryCard
                  label="Completion"
                  value={formatPercent(game.data.completionPercentage)}
                />
                <SummaryCard
                  label="Remaining"
                  value={formatNumber(game.data.remainingAchievements)}
                />
                <SummaryCard
                  label="Playtime"
                  value={formatPlaytime(game.data.playtimeMinutes)}
                />
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <GameAchievementFilters
        filters={filters}
        onOrderChange={(order) => updateFilters({ order })}
        onSortChange={(sort) => updateFilters({ sort })}
        onStatusChange={(status) => updateFilters({ status })}
      />

      {isMissing ? null : (
        <AchievementList
          achievements={achievements.data?.items}
          error={achievements.error}
          isError={achievements.isError}
          isLoading={achievements.isLoading}
        />
      )}
    </PageShell>
  );
}
