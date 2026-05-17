'use client';

import Link from 'next/link';

import { EmptyState, ErrorState, LoadingState } from '@/components/ui/panel-state';
import { AuthStatus } from '@/features/auth/components/auth-status';
import { useLeaderboards } from '@/features/leaderboards/api/use-leaderboards';
import { LeaderboardTabs } from '@/features/leaderboards/components/leaderboard-tabs';
import { getErrorMessage } from '@/lib/format';

export default function LeaderboardsPage() {
  const leaderboards = useLeaderboards();

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link className="text-sm font-medium text-blue-700" href="/">
          Back to home
        </Link>
        <AuthStatus />
      </div>

      <section className="mb-6">
        <h1 className="text-3xl font-semibold tracking-normal text-slate-950">
          Steam Leaderboards
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Leaderboards use stored profile snapshots, so ranking pages remain fast
          and stable without recomputing every profile from raw progress rows.
        </p>
      </section>

      {leaderboards.isLoading ? (
        <LoadingState message="Loading leaderboard types..." />
      ) : null}
      {leaderboards.isError ? (
        <ErrorState
          message={getErrorMessage(leaderboards.error)}
          title="Leaderboards are unavailable"
        />
      ) : null}
      {leaderboards.data && leaderboards.data.items.length > 0 ? (
        <LeaderboardTabs items={leaderboards.data.items} />
      ) : null}
      {leaderboards.data && leaderboards.data.items.length === 0 ? (
        <EmptyState
          message="No leaderboard types are configured yet."
          title="No leaderboards"
        />
      ) : null}
    </main>
  );
}
