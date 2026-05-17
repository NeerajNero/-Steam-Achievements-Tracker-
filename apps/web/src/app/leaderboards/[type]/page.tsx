'use client';

import Link from 'next/link';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useMemo } from 'react';

import { ErrorState, LoadingState } from '@/components/ui/panel-state';
import { AuthStatus } from '@/features/auth/components/auth-status';
import { useLeaderboard } from '@/features/leaderboards/api/use-leaderboard';
import { useLeaderboards } from '@/features/leaderboards/api/use-leaderboards';
import { LeaderboardTable } from '@/features/leaderboards/components/leaderboard-table';
import { LeaderboardTabs } from '@/features/leaderboards/components/leaderboard-tabs';
import {
  getLeaderboardDescription,
  getLeaderboardLabel,
  isLeaderboardType,
  normalizeLeaderboardPagination,
} from '@/features/leaderboards/utils/leaderboard-types';
import { getErrorMessage } from '@/lib/format';

export default function LeaderboardPage() {
  return (
    <Suspense fallback={<main className="p-6 text-sm text-slate-500">Loading leaderboard...</main>}>
      <LeaderboardPageContent />
    </Suspense>
  );
}

function LeaderboardPageContent() {
  const params = useParams<{ type: string }>();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const pagination = useMemo(
    () => normalizeLeaderboardPagination(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );
  const type = params.type;
  const leaderboards = useLeaderboards();
  const isValidType = isLeaderboardType(type);
  const leaderboard = useLeaderboard(
    isValidType ? type : 'completion_percentage',
    pagination,
  );

  function updateOffset(offset: number): void {
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set('limit', String(pagination.limit));
    nextParams.set('offset', String(Math.max(0, offset)));
    void router.replace(`${pathname}?${nextParams.toString()}`, { scroll: false });
  }

  if (!isValidType) {
    return (
      <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6">
        <Link className="text-sm font-medium text-blue-700" href="/leaderboards">
          Back to leaderboards
        </Link>
        <div className="mt-6">
          <ErrorState message="This leaderboard type is not available." />
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link className="text-sm font-medium text-blue-700" href="/leaderboards">
          Back to leaderboards
        </Link>
        <AuthStatus />
      </div>

      <section className="mb-6">
        <h1 className="text-3xl font-semibold tracking-normal text-slate-950">
          {getLeaderboardLabel(type)}
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          {getLeaderboardDescription(type)}
        </p>
      </section>

      <div className="mb-6">
        {leaderboards.isLoading ? (
          <LoadingState message="Loading leaderboard types..." />
        ) : null}
        {leaderboards.isError ? (
          <ErrorState
            message={getErrorMessage(leaderboards.error)}
            title="Leaderboard navigation is unavailable"
          />
        ) : null}
        {leaderboards.data ? (
          <LeaderboardTabs activeType={type} items={leaderboards.data.items} />
        ) : null}
      </div>

      <LeaderboardTable
        error={leaderboard.error}
        isError={leaderboard.isError}
        isLoading={leaderboard.isLoading}
        items={leaderboard.data?.items}
      />

      {leaderboard.data && leaderboard.data.items.length > 0 ? (
        <nav
          aria-label="Leaderboard pagination"
          className="mt-4 flex flex-wrap items-center justify-between gap-3"
        >
          <button
            className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={pagination.offset === 0}
            onClick={() => updateOffset(pagination.offset - pagination.limit)}
            type="button"
          >
            Previous
          </button>
          <span className="text-sm text-slate-500">
            Showing {pagination.offset + 1}-
            {pagination.offset + leaderboard.data.items.length}
          </span>
          <button
            className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={leaderboard.data.items.length < pagination.limit}
            onClick={() => updateOffset(pagination.offset + pagination.limit)}
            type="button"
          >
            Next
          </button>
        </nav>
      ) : null}

      {leaderboard.data && leaderboard.data.items.length === 0 ? (
        <div className="sr-only">No leaderboard entries</div>
      ) : null}
    </main>
  );
}
