'use client';

import Link from 'next/link';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useMemo } from 'react';

import { PageHero } from '@/components/layout/page-hero';
import { PageShell } from '@/components/layout/page-shell';
import { SectionCard } from '@/components/ui/section-card';
import { ErrorState, LoadingState } from '@/components/ui/panel-state';
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
    <Suspense fallback={<main className="p-6 text-sm text-slate-400">Loading leaderboard...</main>}>
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
      <PageShell>
        <Link className="text-sm font-medium text-lime-200" href="/leaderboards">
          Back to leaderboards
        </Link>
        <div className="mt-6">
          <ErrorState message="This leaderboard type is not available." />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="mb-4">
        <Link className="text-sm font-medium text-lime-200" href="/leaderboards">
          Back to leaderboards
        </Link>
      </div>

      <div className="mb-6">
        <PageHero eyebrow="Leaderboard" title={getLeaderboardLabel(type)}>
          <p>
            {getLeaderboardDescription(type)}
          </p>
        </PageHero>
      </div>

      <SectionCard
        description="Ranks are based on the stored snapshot value for this leaderboard. Profiles with newer snapshots can move even without a live Steam request on page load."
        title="Score Explanation"
      >
        <p className="text-sm leading-6 text-slate-300">
          The score column shows the exact snapshot metric used by this leaderboard.
          Snapshot timestamps show when the ranking input was last captured.
        </p>
      </SectionCard>

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
            className="rounded-xl border border-white/10 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={pagination.offset === 0}
            onClick={() => updateOffset(pagination.offset - pagination.limit)}
            type="button"
          >
            Previous
          </button>
          <span className="text-sm text-slate-400">
            Showing {pagination.offset + 1}-
            {pagination.offset + leaderboard.data.items.length}
          </span>
          <button
            className="rounded-xl border border-white/10 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
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
    </PageShell>
  );
}
