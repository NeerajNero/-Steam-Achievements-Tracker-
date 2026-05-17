'use client';

import Link from 'next/link';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';

import { ErrorState, LoadingState } from '@/components/ui/panel-state';
import { useGameActivity } from '@/features/activity/api/use-game-activity';
import { ActivityFeed } from '@/features/activity/components/activity-feed';
import { AuthStatus } from '@/features/auth/components/auth-status';
import { useGlobalGame } from '@/features/games/api/use-global-game';
import { useGlobalGameAchievements } from '@/features/games/api/use-global-game-achievements';
import { useGlobalGamePlayers } from '@/features/games/api/use-global-game-players';
import { GlobalGameAchievements } from '@/features/games/components/global-game-achievements';
import { GlobalGameHeader } from '@/features/games/components/global-game-header';
import { GlobalGamePlayers } from '@/features/games/components/global-game-players';
import { GlobalGameStats } from '@/features/games/components/global-game-stats';
import {
  type GlobalGameAchievementFilters,
  type GlobalGamePlayerFilters,
  normalizeGlobalGameAchievementFilters,
  normalizeGlobalGamePlayerFilters,
  parseGlobalGameAchievementFilters,
  parseGlobalGamePlayerFilters,
  toGlobalGameDetailSearchParams,
} from '@/features/games/utils/global-game-filters';
import { getErrorMessage, getHttpStatus } from '@/lib/format';

export default function GlobalGameDetailPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6">
      <h1 className="sr-only">Global Steam Game</h1>
      <Suspense
        fallback={<div className="p-6 text-sm text-slate-500">Loading game...</div>}
      >
        <GlobalGameDetailPageContent />
      </Suspense>
    </main>
  );
}

function GlobalGameDetailPageContent() {
  const params = useParams<{ steamAppId: string }>();
  const steamAppId = Number(params.steamAppId);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const parsedAchievementFilters = useMemo(
    () => parseGlobalGameAchievementFilters(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );
  const parsedPlayerFilters = useMemo(
    () => parseGlobalGamePlayerFilters(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  const [achievementFilters, setAchievementFilters] =
    useState<GlobalGameAchievementFilters>(() =>
      normalizeGlobalGameAchievementFilters(parsedAchievementFilters),
    );
  const [playerFilters, setPlayerFilters] = useState<GlobalGamePlayerFilters>(() =>
    normalizeGlobalGamePlayerFilters(parsedPlayerFilters),
  );
  const [achievementSearchInput, setAchievementSearchInput] = useState(
    achievementFilters.search,
  );

  useEffect(() => {
    const nextAchievementFilters =
      normalizeGlobalGameAchievementFilters(parsedAchievementFilters);
    const nextPlayerFilters = normalizeGlobalGamePlayerFilters(parsedPlayerFilters);

    if (
      JSON.stringify(nextAchievementFilters) !== JSON.stringify(achievementFilters)
    ) {
      setAchievementFilters(nextAchievementFilters);
      setAchievementSearchInput(nextAchievementFilters.search);
    }

    if (JSON.stringify(nextPlayerFilters) !== JSON.stringify(playerFilters)) {
      setPlayerFilters(nextPlayerFilters);
    }
  }, [
    achievementFilters,
    parsedAchievementFilters,
    parsedPlayerFilters,
    playerFilters,
  ]);

  const game = useGlobalGame(steamAppId);
  const achievements = useGlobalGameAchievements(steamAppId, {
    search: achievementFilters.search || undefined,
    hidden: achievementFilters.hidden,
    sort: achievementFilters.sort,
    order: achievementFilters.order,
    limit: achievementFilters.limit,
    offset: achievementFilters.offset,
  });
  const players = useGlobalGamePlayers(steamAppId, {
    status: playerFilters.status,
    sort: playerFilters.sort,
    order: playerFilters.order,
    limit: playerFilters.limit,
    offset: playerFilters.offset,
  });
  const activity = useGameActivity(steamAppId, { limit: 5, offset: 0 });
  const isMissing = getHttpStatus(game.error) === 404;

  function replaceSearchParams(
    nextAchievements: GlobalGameAchievementFilters,
    nextPlayers: GlobalGamePlayerFilters,
  ): void {
    const params = toGlobalGameDetailSearchParams(nextAchievements, nextPlayers);
    const href = params.length > 0 ? `${pathname}?${params}` : pathname;
    void router.replace(href, { scroll: false });
  }

  function updateAchievementFilters(
    partial: Partial<GlobalGameAchievementFilters>,
  ): void {
    const nextAchievements = normalizeGlobalGameAchievementFilters({
      ...achievementFilters,
      ...partial,
    });
    setAchievementFilters(nextAchievements);
    replaceSearchParams(nextAchievements, playerFilters);
  }

  function updatePlayerFilters(partial: Partial<GlobalGamePlayerFilters>): void {
    const nextPlayers = normalizeGlobalGamePlayerFilters({
      ...playerFilters,
      ...partial,
    });
    setPlayerFilters(nextPlayers);
    replaceSearchParams(achievementFilters, nextPlayers);
  }

  function submitAchievementSearch(): void {
    updateAchievementFilters({
      search: achievementSearchInput.trim(),
      offset: 0,
    });
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link className="text-sm font-medium text-blue-700" href="/games">
          Back to games
        </Link>
        <AuthStatus />
      </div>

      {game.isLoading ? <LoadingState message="Loading global game..." /> : null}
      {isMissing ? (
        <ErrorState
          message="This Steam game is not tracked in the local database yet."
          title="Game not found"
        />
      ) : null}
      {!isMissing && game.isError ? (
        <ErrorState message={getErrorMessage(game.error)} title="Game unavailable" />
      ) : null}

      {game.data ? (
        <div className="grid gap-6">
          <GlobalGameHeader game={game.data.game} />
          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold text-slate-950">Guides and roadmaps</h2>
                <p className="mt-1 text-sm text-slate-600">
                  View public guides or create a draft roadmap for this Steam game.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  href={`/games/${steamAppId}/guides`}
                >
                  View guides
                </Link>
                <Link
                  className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                  href={`/games/${steamAppId}/guides/new`}
                >
                  New guide
                </Link>
              </div>
            </div>
          </section>
          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold text-slate-950">Gaming sessions</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Schedule or join public co-op and achievement boosting sessions.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  href={`/games/${steamAppId}/sessions`}
                >
                  View sessions
                </Link>
                <Link
                  className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                  href={`/games/${steamAppId}/sessions/new`}
                >
                  New session
                </Link>
              </div>
            </div>
          </section>
          <GlobalGameStats stats={game.data.stats} />
          <GlobalGameAchievements
            error={achievements.error}
            filters={achievementFilters}
            isError={achievements.isError}
            isLoading={achievements.isLoading}
            items={achievements.data?.items}
            onFiltersChange={updateAchievementFilters}
            onSearchChange={setAchievementSearchInput}
            onSubmitSearch={submitAchievementSearch}
            searchInput={achievementSearchInput}
            total={achievements.data?.total}
          />
          <GlobalGamePlayers
            error={players.error}
            filters={playerFilters}
            isError={players.isError}
            isLoading={players.isLoading}
            items={players.data?.items}
            onFiltersChange={updatePlayerFilters}
            total={players.data?.total}
          />
          <ActivityFeed
            error={activity.error}
            isError={activity.isError}
            isLoading={activity.isLoading}
            items={activity.data?.items}
            title="Game activity"
          />
        </div>
      ) : null}
    </>
  );
}
