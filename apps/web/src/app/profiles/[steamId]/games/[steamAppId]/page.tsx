'use client';

import {
  ListGameAchievementsOrderEnum,
  ListGameAchievementsSortEnum,
} from '@steam-achievement/client-sdk';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import { ErrorState, LoadingState } from '@/components/ui/panel-state';
import { SummaryCard } from '@/components/ui/summary-card';
import { useGameAchievements } from '@/features/profile/api/use-game-achievements';
import { useProfileGame } from '@/features/profile/api/use-profile-game';
import { AchievementList } from '@/features/profile/components/achievement-list';
import {
  formatDateTime,
  formatNumber,
  formatPercent,
  formatPlaytime,
  getErrorMessage,
  getHttpStatus,
} from '@/lib/format';

export default function GameDetailPage() {
  const params = useParams<{ steamId: string; steamAppId: string }>();
  const steamId = params.steamId;
  const steamAppId = Number(params.steamAppId);

  const game = useProfileGame(steamId, steamAppId);
  const achievements = useGameAchievements(steamId, steamAppId, {
    sort: ListGameAchievementsSortEnum.Rarity,
    order: ListGameAchievementsOrderEnum.Asc,
  });

  const gameMissing = getHttpStatus(game.error) === 404;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 md:px-6">
      <Link
        className="text-sm font-medium text-blue-700"
        href={`/profiles/${steamId}`}
      >
        Back to profile
      </Link>

      {game.isLoading ? <LoadingState message="Loading game..." /> : null}
      {gameMissing ? (
        <div className="mt-4">
          <ErrorState
            message="This game is not stored for the selected profile yet. Run a games sync from the profile dashboard first."
            title="Game not synced yet"
          />
        </div>
      ) : null}
      {!gameMissing && game.isError ? (
        <div className="mt-4">
          <ErrorState
            message={getErrorMessage(game.error)}
            title="Game data is unavailable"
          />
        </div>
      ) : null}

      {game.data ? (
        <section className="mt-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start gap-4">
            {game.data.iconUrl ? (
              <img
                alt=""
                className="h-16 w-16 rounded-md border border-slate-200"
                src={game.data.iconUrl}
              />
            ) : null}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-500">
                App {game.data.steamAppId}
              </p>
              <h1 className="mt-1 text-3xl font-semibold tracking-normal text-slate-950">
                {game.data.name}
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                Last synced {formatDateTime(game.data.lastSyncedAt)}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <SummaryCard
              label="Completion"
              value={formatPercent(game.data.completionPercentage)}
            />
            <SummaryCard
              label="Achievements"
              value={`${formatNumber(game.data.unlockedAchievements)} / ${formatNumber(game.data.totalAchievements)}`}
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
        </section>
      ) : null}

      <AchievementList
        achievements={achievements.data?.items}
        error={achievements.error}
        isError={achievements.isError}
        isLoading={achievements.isLoading}
      />
    </main>
  );
}
