'use client';

import {
  ListProfileGamesOrderEnum,
  ListProfileGamesSortEnum,
  type QueuedSyncResponseDto,
  SyncRequestDtoScopeEnum,
} from '@steam-achievement/client-sdk';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

import { EmptyState, ErrorState, LoadingState } from '@/components/ui/panel-state';
import { SummaryCard } from '@/components/ui/summary-card';
import { useEnqueueSync } from '@/features/profile/api/use-enqueue-sync';
import { useNearestCompletions } from '@/features/profile/api/use-nearest-completions';
import { useProfile } from '@/features/profile/api/use-profile';
import { useProfileGames } from '@/features/profile/api/use-profile-games';
import { useProfileSummary } from '@/features/profile/api/use-profile-summary';
import { useRarestAchievements } from '@/features/profile/api/use-rarest-achievements';
import { useSyncRuns } from '@/features/profile/api/use-sync-runs';
import { GamesTable } from '@/features/profile/components/games-table';
import { SyncActions } from '@/features/profile/components/sync-actions';
import { SyncRunsList } from '@/features/profile/components/sync-runs-list';
import { shouldPollSyncRuns } from '@/features/profile/utils/sync-status';
import {
  formatNumber,
  formatPercent,
  getErrorMessage,
  getHttpStatus,
} from '@/lib/format';

const SYNC_RUNS_LIMIT = 8;
const SYNC_POLL_INTERVAL_MS = 3_000;

const syncActions = [
  { label: 'Sync Profile', scope: SyncRequestDtoScopeEnum.Profile },
  { label: 'Sync Games', scope: SyncRequestDtoScopeEnum.Games },
  { label: 'Sync Achievements', scope: SyncRequestDtoScopeEnum.Achievements },
] as const;

export default function ProfilePage() {
  const params = useParams<{ steamId: string }>();
  const steamId = params.steamId;
  const [queuedSync, setQueuedSync] = useState<QueuedSyncResponseDto | null>(
    null,
  );
  const [pendingScope, setPendingScope] =
    useState<SyncRequestDtoScopeEnum | null>(null);

  const profile = useProfile(steamId);
  const summary = useProfileSummary(steamId);
  const games = useProfileGames(steamId, {
    limit: 25,
    sort: ListProfileGamesSortEnum.Completion,
    order: ListProfileGamesOrderEnum.Desc,
  });
  const nearestCompletions = useNearestCompletions(steamId, 5);
  const rarestAchievements = useRarestAchievements(steamId, 5);
  const syncRuns = useSyncRuns(steamId, SYNC_RUNS_LIMIT);
  const enqueueSync = useEnqueueSync(steamId);
  const refetchSyncRuns = syncRuns.refetch;

  const runs = syncRuns.data?.items ?? [];
  const isPollingSyncRuns = shouldPollSyncRuns(runs, queuedSync);
  const profileMissing =
    getHttpStatus(profile.error) === 404 || getHttpStatus(summary.error) === 404;

  useEffect(() => {
    if (!isPollingSyncRuns) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      void refetchSyncRuns();
    }, SYNC_POLL_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [isPollingSyncRuns, refetchSyncRuns]);

  async function enqueue(scope: SyncRequestDtoScopeEnum): Promise<void> {
    setPendingScope(scope);

    try {
      const response = await enqueueSync.mutateAsync({
        scope,
        appIds: undefined,
      });
      setQueuedSync(response);
      await refetchSyncRuns();
    } finally {
      setPendingScope(null);
    }
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link className="text-sm font-medium text-blue-700" href="/">
            Back to search
          </Link>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal text-slate-950">
            {summary.data?.personaName ?? profile.data?.personaName ?? steamId}
          </h1>
          <p className="mt-1 text-sm text-slate-600">Steam ID: {steamId}</p>
        </div>
        {profile.data?.avatarUrl ? (
          <img
            alt=""
            className="h-16 w-16 rounded-md border border-slate-200"
            src={profile.data.avatarUrl}
          />
        ) : null}
      </div>

      {profileMissing ? (
        <div className="mb-6">
          <EmptyState
            action={
              <button
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                disabled={pendingScope === SyncRequestDtoScopeEnum.Profile}
                onClick={() => void enqueue(SyncRequestDtoScopeEnum.Profile)}
                type="button"
              >
                {pendingScope === SyncRequestDtoScopeEnum.Profile
                  ? 'Queueing...'
                  : 'Sync Profile'}
              </button>
            }
            message="This Steam ID is not in the local database yet. Queue a profile sync to create it."
            title="Profile not synced yet"
          />
        </div>
      ) : null}

      {!profileMissing && (summary.isError || profile.isError) ? (
        <div className="mb-6">
          <ErrorState
            message={getErrorMessage(summary.error ?? profile.error)}
            title="Profile data is unavailable"
          />
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Games"
          loading={summary.isLoading}
          value={summary.data ? formatNumber(summary.data.totalGames) : '-'}
        />
        <SummaryCard
          label="Completed"
          loading={summary.isLoading}
          value={summary.data ? formatNumber(summary.data.completedGames) : '-'}
        />
        <SummaryCard
          label="Achievements"
          loading={summary.isLoading}
          value={
            summary.data
              ? `${formatNumber(summary.data.unlockedAchievements)} / ${formatNumber(summary.data.totalAchievements)}`
              : '-'
          }
        />
        <SummaryCard
          label="Average Completion"
          loading={summary.isLoading}
          value={
            summary.data
              ? formatPercent(summary.data.averageCompletionPercentage)
              : '-'
          }
        />
      </section>

      <SyncActions
        actions={syncActions}
        error={enqueueSync.error}
        onSync={(scope) => void enqueue(scope)}
        pendingScope={pendingScope}
        queuedSync={queuedSync}
      />

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <GamesTable
          error={games.error}
          isError={games.isError}
          isLoading={games.isLoading}
          items={games.data?.items}
          onSyncGames={() => void enqueue(SyncRequestDtoScopeEnum.Games)}
          steamId={steamId}
          total={games.data?.total}
        />

        <aside className="grid content-start gap-6">
          <SmallListPanel
            emptyMessage="No near-completion games yet."
            error={nearestCompletions.error}
            isError={nearestCompletions.isError}
            isLoading={nearestCompletions.isLoading}
            title="Nearest 100%"
          >
            {nearestCompletions.data?.items.map((game) => (
              <li
                className="rounded-md border border-slate-200 p-3"
                key={game.steamAppId}
              >
                <Link
                  className="font-medium text-blue-700"
                  href={`/profiles/${steamId}/games/${game.steamAppId}`}
                >
                  {game.name}
                </Link>
                <div className="mt-1 text-sm text-slate-600">
                  {formatPercent(game.completionPercentage)} complete,{' '}
                  {formatNumber(game.remainingAchievements)} remaining
                </div>
              </li>
            ))}
          </SmallListPanel>

          <SmallListPanel
            emptyMessage="No rare unlocked achievements yet."
            error={rarestAchievements.error}
            isError={rarestAchievements.isError}
            isLoading={rarestAchievements.isLoading}
            title="Rarest Achievements"
          >
            {rarestAchievements.data?.items.map((achievement) => (
              <li
                className="rounded-md border border-slate-200 p-3"
                key={`${achievement.steamAppId}-${achievement.apiName}`}
              >
                <div className="font-medium text-slate-900">
                  {achievement.displayName ?? achievement.apiName}
                </div>
                <div className="mt-1 text-sm text-slate-600">
                  App {achievement.steamAppId} ·{' '}
                  {formatPercent(achievement.globalPercentage)}
                </div>
              </li>
            ))}
          </SmallListPanel>

          <SyncRunsList
            error={syncRuns.error}
            isError={syncRuns.isError}
            isLoading={syncRuns.isLoading}
            isPolling={isPollingSyncRuns}
            runs={syncRuns.data?.items}
          />
        </aside>
      </div>
    </main>
  );
}

function SmallListPanel({
  children,
  emptyMessage,
  error,
  isError,
  isLoading,
  title,
}: Readonly<{
  children: ReactNode;
  emptyMessage: string;
  error: unknown;
  isError: boolean;
  isLoading: boolean;
  title: string;
}>) {
  const hasItems = Array.isArray(children)
    ? children.length > 0
    : Boolean(children);

  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-5">
        <h2 className="text-xl font-semibold text-slate-950">{title}</h2>
      </div>
      {isLoading ? <LoadingState message="Loading..." /> : null}
      {isError ? (
        <div className="p-4">
          <ErrorState message={getErrorMessage(error)} />
        </div>
      ) : null}
      {!isLoading && !isError && !hasItems ? (
        <EmptyState message={emptyMessage} />
      ) : null}
      {hasItems ? <ul className="grid gap-3 p-4">{children}</ul> : null}
    </section>
  );
}
