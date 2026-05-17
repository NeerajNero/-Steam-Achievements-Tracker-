'use client';

import {
  ListProfileGamesOrderEnum,
  ListProfileGamesSortEnum,
  ListProfileGamesStatusEnum,
  type QueuedSyncResponseDto,
  SyncRequestDtoScopeEnum,
} from '@steam-achievement/client-sdk';
import Link from 'next/link';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { EmptyState, ErrorState } from '@/components/ui/panel-state';
import { AuthStatus } from '@/features/auth/components/auth-status';
import { useEnqueueSync } from '@/features/profile/api/use-enqueue-sync';
import { useNearestCompletions } from '@/features/profile/api/use-nearest-completions';
import { useProfile } from '@/features/profile/api/use-profile';
import { useProfileGames } from '@/features/profile/api/use-profile-games';
import { useProfileSummary } from '@/features/profile/api/use-profile-summary';
import { useRarestAchievements } from '@/features/profile/api/use-rarest-achievements';
import { useSyncRuns } from '@/features/profile/api/use-sync-runs';
import {
  type ProfileLibraryFilters,
  DEFAULT_LIBRARY_LIMIT,
  DEFAULT_LIBRARY_OFFSET,
  parseProfileLibraryFilters,
  toProfileLibrarySearchParams,
  normalizeProfileLibraryFilters,
} from '@/features/profile/utils/profile-library-filters';
import { shouldPollSyncRuns } from '@/features/profile/utils/sync-status';
import { ProfileHeader } from '@/features/profile/components/profile-header';
import { ProfileSummaryGrid } from '@/features/profile/components/profile-summary-grid';
import { SyncActions } from '@/features/profile/components/sync-actions';
import { SyncRunsList } from '@/features/profile/components/sync-runs-list';
import { GameLibrary } from '@/features/profile/components/game-library';
import { GameLibraryFilters } from '@/features/profile/components/game-library-filters';
import { NearestCompletions } from '@/features/profile/components/nearest-completions';
import { RarestAchievements } from '@/features/profile/components/rarest-achievements';
import { useProfileSnapshots } from '@/features/snapshots/api/use-profile-snapshots';
import { ProfileSnapshotsList } from '@/features/snapshots/components/profile-snapshots-list';
import { getErrorMessage, getHttpStatus } from '@/lib/format';

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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const parsedSearchParams = useMemo(
    () => parseProfileLibraryFilters(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  const [filters, setFilters] = useState<ProfileLibraryFilters>(() =>
    normalizeProfileLibraryFilters(parsedSearchParams),
  );
  const [searchInput, setSearchInput] = useState(filters.search);
  const [queuedSync, setQueuedSync] = useState<QueuedSyncResponseDto | null>(null);
  const [pendingScope, setPendingScope] = useState<SyncRequestDtoScopeEnum | null>(
    null,
  );

  useEffect(() => {
    const nextFilters = normalizeProfileLibraryFilters(parsedSearchParams);
    const hasFiltersChanged =
      JSON.stringify(nextFilters) !== JSON.stringify(filters);

    if (hasFiltersChanged) {
      setFilters(nextFilters);
      setSearchInput(nextFilters.search);
    }
  }, [parsedSearchParams, filters]);

  const profile = useProfile(steamId);
  const summary = useProfileSummary(steamId);
  const games = useProfileGames(steamId, {
    limit: filters.limit,
    offset: filters.offset,
    search: filters.search || undefined,
    status: filters.status,
    sort: filters.sort,
    order: filters.order,
  });
  const nearestCompletions = useNearestCompletions(steamId, 5);
  const rarestAchievements = useRarestAchievements(steamId, 5);
  const syncRuns = useSyncRuns(steamId, SYNC_RUNS_LIMIT);
  const snapshots = useProfileSnapshots(steamId, { limit: 5, offset: 0 });
  const enqueueSync = useEnqueueSync(steamId);
  const refetchSyncRuns = syncRuns.refetch;

  const runs = syncRuns.data?.items ?? [];
  const latestSyncRun = runs[0] ?? null;
  const isPollingSyncRuns = shouldPollSyncRuns(runs, queuedSync);
  const profileMissing =
    getHttpStatus(profile.error) === 404 ||
    getHttpStatus(summary.error) === 404;
  const totalGames = games.data?.total ?? 0;

  useEffect(() => {
    if (!isPollingSyncRuns) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      void refetchSyncRuns();
    }, SYNC_POLL_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [isPollingSyncRuns, refetchSyncRuns]);

  function updateFilters(nextFilters: Partial<ProfileLibraryFilters>): void {
    const normalizedFilters = normalizeProfileLibraryFilters(nextFilters);
    setFilters(normalizedFilters);

    const params = toProfileLibrarySearchParams(normalizedFilters);
    const href = params.length > 0 ? `${pathname}?${params}` : pathname;

    void router.replace(href, { scroll: false });
  }

  function onSubmitSearch(): void {
    const clampedOffset =
      filters.search.trim() === searchInput.trim() ? filters.offset : DEFAULT_LIBRARY_OFFSET;

    updateFilters({
      ...filters,
      search: searchInput.trim(),
      offset: clampedOffset,
    });
  }

  function onPageChange(newOffset: number): void {
    const nextOffset = Math.max(DEFAULT_LIBRARY_OFFSET, newOffset);

    const clampedOffset = Number.isNaN(totalGames)
      ? nextOffset
      : Math.min(nextOffset, Math.max(0, Math.max(totalGames - 1, 0)));

    updateFilters({
      ...filters,
      offset: clampedOffset,
    });
  }

  async function enqueue(scope: SyncRequestDtoScopeEnum): Promise<void> {
    setPendingScope(scope);

    try {
      const response = await enqueueSync.mutateAsync({
        scope,
      });
      setQueuedSync(response);
      await refetchSyncRuns();
    } finally {
      setPendingScope(null);
    }
  }

  const headerProfile = profile.data ?? summary.data;
  const errorMessage = getErrorMessage(profile.error ?? summary.error);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6">
      <div className="mb-4">
        <Link className="text-sm font-medium text-blue-700" href="/">
          Back to home
        </Link>
      </div>

      <div className="mb-4">
        <AuthStatus />
      </div>

      <div className="mb-6">
        <ProfileHeader profile={headerProfile} />
      </div>

      {profileMissing ? (
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
          message="Profile not synced yet. This Steam ID is not in the local database."
          title="Profile not synced yet"
        />
      ) : null}

      {(profile.error || summary.error) && !profileMissing ? (
        <div className="mb-6">
          <ErrorState message={errorMessage} title="Profile data is unavailable" />
        </div>
      ) : null}

      <ProfileSummaryGrid isLoading={summary.isLoading} summary={summary.data} />

      <SyncActions
        actions={syncActions}
        error={enqueueSync.error}
        onSync={(scope) => void enqueue(scope)}
        pendingScope={pendingScope}
        queuedSync={queuedSync}
        latestSync={latestSyncRun}
      />

      <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <div className="grid gap-6">
          <GameLibraryFilters
            filters={filters}
            onSubmitSearch={onSubmitSearch}
            onSearchChange={setSearchInput}
            onStatusChange={(status: ListProfileGamesStatusEnum) =>
              updateFilters({ ...filters, status, offset: DEFAULT_LIBRARY_OFFSET })
            }
            onSortChange={(sort: ListProfileGamesSortEnum) =>
              updateFilters({ ...filters, sort, offset: DEFAULT_LIBRARY_OFFSET })
            }
            onOrderChange={(order: ListProfileGamesOrderEnum) =>
              updateFilters({ ...filters, order })
            }
            onLimitChange={(limit) =>
              updateFilters({
                ...filters,
                limit,
                offset: DEFAULT_LIBRARY_OFFSET,
              })
            }
            onPageChange={onPageChange}
            totalGames={totalGames}
            searchInput={searchInput}
          />
          <GameLibrary
            error={games.error}
            isError={games.isError}
            isLoading={games.isLoading}
            items={games.data?.items}
            onSyncGames={() => void enqueue(SyncRequestDtoScopeEnum.Games)}
            steamId={steamId}
            total={games.data?.total}
          />
        </div>

        <aside className="grid content-start gap-6">
          <NearestCompletions
            error={nearestCompletions.error}
            isError={nearestCompletions.isError}
            isLoading={nearestCompletions.isLoading}
            items={nearestCompletions.data?.items}
            steamId={steamId}
          />
          <RarestAchievements
            error={rarestAchievements.error}
            isError={rarestAchievements.isError}
            isLoading={rarestAchievements.isLoading}
            items={rarestAchievements.data?.items}
            steamId={steamId}
          />
          <SyncRunsList
            error={syncRuns.error}
            isError={syncRuns.isError}
            isLoading={syncRuns.isLoading}
            isPolling={isPollingSyncRuns}
            runs={syncRuns.data?.items}
          />
          <ProfileSnapshotsList
            error={snapshots.error}
            isError={snapshots.isError}
            isLoading={snapshots.isLoading}
            snapshots={snapshots.data?.items}
          />
        </aside>
      </section>
    </main>
  );
}
