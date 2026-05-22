import type { ProfileSummaryResponseDto } from '@steam-achievement/client-sdk';

import { formatNumber, formatPercent } from '@/lib/format';

import { SummaryCard } from '@/components/ui/summary-card';

export function ProfileSummaryGrid({
  isLoading,
  summary,
}: Readonly<{
  isLoading: boolean;
  summary?: ProfileSummaryResponseDto;
}>): React.ReactNode {
  return (
    <section aria-label="summary statistics" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <SummaryCard
        hint="Games already discovered through stored syncs"
        label="Total games"
        loading={isLoading}
        value={summary ? formatNumber(summary.totalGames) : '-'}
      />
      <SummaryCard
        hint="Full completion reached"
        label="Completed games"
        loading={isLoading}
        value={summary ? formatNumber(summary.completedGames) : '-'}
      />
      <SummaryCard
        hint="Tracked canonical achievement rows"
        label="Total achievements"
        loading={isLoading}
        value={summary ? formatNumber(summary.totalAchievements) : '-'}
      />
      <SummaryCard
        hint="Known unlocked rows only"
        label="Unlocked achievements"
        loading={isLoading}
        value={summary ? formatNumber(summary.unlockedAchievements) : '-'}
      />
      <SummaryCard
        hint="Excludes metadata-only unknowns"
        label="Remaining achievements"
        loading={isLoading}
        value={summary ? formatNumber(summary.remainingAchievements) : '-'}
      />
      <SummaryCard
        hint="Across tracked Steam games"
        label="Average completion"
        loading={isLoading}
        value={summary ? formatPercent(summary.averageCompletionPercentage) : '-'}
      />
    </section>
  );
}
