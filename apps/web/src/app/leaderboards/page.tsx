'use client';

import { PageHero } from '@/components/layout/page-hero';
import { PageShell } from '@/components/layout/page-shell';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/panel-state';
import { useLeaderboards } from '@/features/leaderboards/api/use-leaderboards';
import { LeaderboardTabs } from '@/features/leaderboards/components/leaderboard-tabs';
import { getErrorMessage } from '@/lib/format';

export default function LeaderboardsPage() {
  const leaderboards = useLeaderboards();

  return (
    <PageShell>
      <div className="mb-6">
        <PageHero eyebrow="Snapshot rankings" title="Steam Leaderboards">
          <p>
          Leaderboards use stored profile snapshots, so ranking pages remain fast
          and stable without recomputing every profile from raw progress rows.
          </p>
        </PageHero>
      </div>

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
    </PageShell>
  );
}
