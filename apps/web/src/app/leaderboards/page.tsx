'use client';

import { PageHero } from '@/components/layout/page-hero';
import { PageShell } from '@/components/layout/page-shell';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/panel-state';
import { SectionCard } from '@/components/ui/section-card';
import { useLeaderboards } from '@/features/leaderboards/api/use-leaderboards';
import { LeaderboardTabs } from '@/features/leaderboards/components/leaderboard-tabs';
import { getErrorMessage } from '@/lib/format';

export default function LeaderboardsPage() {
  const leaderboards = useLeaderboards();

  return (
    <PageShell>
      <PageHero eyebrow="Snapshot rankings" title="Steam Leaderboards">
        <p>
          Leaderboards rank stored profile snapshots, not live Steam calls. That keeps
          score comparisons stable and lets each ranking page explain exactly what its
          score means before you drill into the table.
        </p>
      </PageHero>

      <SectionCard
        description="Choose a ranking lens first, then open the full table for that metric."
        title="Leaderboard Types"
      >
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
      </SectionCard>
    </PageShell>
  );
}
