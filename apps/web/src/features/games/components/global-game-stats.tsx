import type { ReactNode } from 'react';

import type { GlobalGameStatsResponseDto } from '@steam-achievement/client-sdk';

import { SummaryCard } from '@/components/ui/summary-card';
import { formatNumber, formatPercent, formatPlaytime } from '@/lib/format';

export function GlobalGameStats({
  stats,
}: Readonly<{
  stats: GlobalGameStatsResponseDto;
}>): ReactNode {
  return (
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <SummaryCard label="Tracked Players" value={formatNumber(stats.trackedPlayers)} />
      <SummaryCard label="Completed" value={formatNumber(stats.completedPlayers)} />
      <SummaryCard
        label="Achievement Metadata"
        value={formatNumber(stats.achievementMetadataCount)}
      />
      <SummaryCard
        label="Average Completion"
        value={formatPercent(stats.averageCompletionPercentage)}
      />
      <SummaryCard label="Total Playtime" value={formatPlaytime(stats.totalPlaytimeMinutes)} />
      <SummaryCard
        label="Average Playtime"
        value={formatPlaytime(stats.averagePlaytimeMinutes)}
      />
    </section>
  );
}
